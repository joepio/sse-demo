mod issues;

use chrono;
use futures_util::stream::{self, Stream};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use shuttle_axum::axum::{
    extract::State,
    response::sse::{Event, KeepAlive, Sse},
    routing::{get, post},
    Json, Router,
};
use std::{convert::Infallible, path::Path, sync::Arc, time::Duration};
use tokio::{
    sync::{broadcast, RwLock},
    time::sleep,
};
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt;
use tower_http::cors::CorsLayer;
use tower_http::services::{ServeDir, ServeFile};
use uuid;

#[derive(Clone)]
struct AppState {
    // Our entire list (the "source of truth")
    events: Arc<RwLock<Vec<Value>>>,
    // Zaken storage
    issues: Arc<RwLock<std::collections::HashMap<String, Value>>>,
    // Broadcast deltas to all subscribers
    tx: broadcast::Sender<CloudEvent>,
}

impl Default for AppState {
    fn default() -> Self {
        let (tx, _) = broadcast::channel(256);

        // Generate initial zaken and events using the issues module
        let (events, issues) = issues::generate_initial_data();

        Self {
            events: Arc::new(RwLock::new(events)),
            issues: Arc::new(RwLock::new(issues)),
            tx,
        }
    }
}

/// CloudEvent following the CloudEvents specification v1.0
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudEvent {
    /// The version of the CloudEvents specification
    pub specversion: String,
    /// Identifies the event
    pub id: String,
    /// Identifies the context in which an event happened
    pub source: String,
    /// Identifies the subject of the event in the context of the event producer
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subject: Option<String>,
    /// The type of event related to the originating occurrence
    #[serde(rename = "type")]
    pub event_type: String,
    /// Timestamp of when the occurrence happened
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time: Option<String>,
    /// Content type of the data value
    #[serde(skip_serializing_if = "Option::is_none")]
    pub datacontenttype: Option<String>,
    /// The event payload
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct IncomingCloudEvent {
    specversion: String,
    id: String,
    source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    subject: Option<String>,
    #[serde(rename = "type")]
    event_type: String,
    time: Option<String>,
    datacontenttype: Option<String>,
    data: Option<Value>,
}

#[cfg(not(feature = "local"))]
#[shuttle_runtime::main]
async fn main() -> shuttle_axum::ShuttleAxum {
    let app = create_app().await;
    Ok(app.into())
}

#[cfg(feature = "local")]
#[tokio::main]
async fn main() {
    let app = create_app().await;
    let addr = "0.0.0.0:3000";
    println!("→ http://{addr}");
    shuttle_axum::axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}

async fn create_app() -> Router {
    if !Path::new("dist").exists() {
        panic!("Frontend dist folder is missing! Please build the frontend first with: cd frontend && pnpm run build");
    }

    let state = AppState::default();

    // Optional: emit demo events every 20s that randomly update existing zaken
    let demo = state.clone();
    tokio::spawn(async move {
        loop {
            sleep(Duration::from_secs(10)).await;

            // Get current zaken for random selection
            let current_issues = {
                let issues = demo.issues.read().await;
                issues.clone()
            };

            // Generate a random demo event
            if let Some(demo_event_json) = issues::generate_demo_event(&current_issues) {
                // Convert JSON to our CloudEvent struct
                if let Some(cloud_event) = issues::json_to_cloudevent(&demo_event_json) {
                    // Process the event using the same handle_event logic
                    process_cloud_event(&demo.issues, &demo.events, &demo_event_json).await;

                    // Add to events list
                    {
                        let mut events = demo.events.write().await;
                        events.push(demo_event_json);
                    }

                    let _ = demo.tx.send(cloud_event);
                }
            }
        }
    });

    // Reset all app state every 5 minutes
    let reset_state = state.clone();
    tokio::spawn(async move {
        loop {
            sleep(Duration::from_secs(300)).await; // 5 minutes = 300 seconds

            let reset_time = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC");
            println!("🔄 [{}] Resetting all app state...", reset_time);

            // Generate fresh initial data
            let (new_events, new_issues) = issues::generate_initial_data();

            // Store lengths before moving the data
            let events_count = new_events.len();
            let issues_count = new_issues.len();

            // Reset events
            {
                let mut events = reset_state.events.write().await;
                *events = new_events;
            }

            // Reset issues
            {
                let mut issues = reset_state.issues.write().await;
                *issues = new_issues;
            }

            // Send a reset notification event
            let reset_event = CloudEvent {
                specversion: "1.0".to_string(),
                id: uuid::Uuid::now_v7().to_string(),
                source: "server".to_string(),
                subject: None,
                event_type: "system.reset".to_string(),
                time: Some(chrono::Utc::now().to_rfc3339()),
                datacontenttype: Some("application/json".to_string()),
                data: Some(serde_json::json!({
                    "message": "App state has been reset",
                    "timestamp": chrono::Utc::now().to_rfc3339()
                })),
            };

            let _ = reset_state.tx.send(reset_event);
            let complete_time = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC");
            println!(
                "✅ [{}] App state reset complete - {} issues and {} events regenerated",
                complete_time, issues_count, events_count
            );
        }
    });

    let app = Router::new()
        .route("/events", get(sse_handler))
        .route("/events", post(handle_event)) // single endpoint for all CloudEvents
        .with_state(state)
        .layer(CorsLayer::permissive())
        .fallback_service(ServeDir::new("dist").fallback(ServeFile::new("dist/index.html")));

    app
}

async fn sse_handler(
    State(state): State<AppState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let rx = state.tx.subscribe();

    let snapshot = {
        let events = state.events.read().await;
        serde_json::to_string(&*events).unwrap()
    };

    let stream = stream::once(async move { Ok(Event::default().event("snapshot").data(snapshot)) })
        .chain(
            BroadcastStream::new(rx)
                .map(|msg| {
                    let delta = msg.unwrap();
                    let json = serde_json::to_string(&delta).unwrap();
                    Event::default().event("delta").data(json)
                })
                .map(Ok),
        );

    Sse::new(stream).keep_alive(KeepAlive::default())
}

/// Process a CloudEvent JSON and update the zaken state
async fn process_cloud_event(
    issues_lock: &Arc<RwLock<std::collections::HashMap<String, Value>>>,
    events_lock: &Arc<RwLock<Vec<Value>>>,
    event_json: &Value,
) {
    if let (Some(event_type), Some(data)) = (
        event_json.get("type").and_then(|t| t.as_str()),
        event_json.get("data"),
    ) {
        match event_type {
            "issue.created" => {
                if let Some(id) = data.get("id").and_then(|i| i.as_str()) {
                    let mut issues = issues_lock.write().await;
                    issues.insert(id.to_string(), data.clone());
                }
            }
            "issue.updated" => {
                if let Some(issue_id) = event_json.get("subject").and_then(|s| s.as_str()) {
                    let mut issues = issues_lock.write().await;
                    if let Some(existing_issue) = issues.get_mut(issue_id) {
                        issues::apply_merge_patch(existing_issue, data);
                    } else {
                        // Create new zaak if it doesn't exist
                        let mut new_issue = serde_json::json!({"id": issue_id});
                        issues::apply_merge_patch(&mut new_issue, data);
                        issues.insert(issue_id.to_string(), new_issue);
                    }
                }
            }
            "issue.deleted" => {
                if let Some(id) = data.get("id").and_then(|i| i.as_str()) {
                    let mut issues = issues_lock.write().await;
                    issues.remove(id);
                }
            }
            "item.updated" => {
                if let (Some(item_id), Some(patch)) = (
                    data.get("item_id").and_then(|i| i.as_str()),
                    data.get("patch"),
                ) {
                    let mut events = events_lock.write().await;

                    // Find and update the timeline item
                    for event in events.iter_mut() {
                        if let Some(event_data) = event.get("data") {
                            if event_data.get("item_id").and_then(|id| id.as_str()) == Some(item_id)
                            {
                                if let Some(item_data) =
                                    event.get_mut("data").and_then(|d| d.get_mut("item_data"))
                                {
                                    issues::apply_merge_patch(item_data, patch);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            _ => {}
        }
    }
}

async fn handle_event(
    State(state): State<AppState>,
    Json(incoming_event): Json<IncomingCloudEvent>,
) -> Json<&'static str> {
    // Convert to JSON for processing
    let event_json = serde_json::to_value(&incoming_event).unwrap();

    // Debug logging
    println!(
        "Received event: type={}, subject={:?}",
        incoming_event.event_type, incoming_event.subject
    );
    if incoming_event.event_type.contains("task") {
        println!(
            "Task event data: {}",
            serde_json::to_string_pretty(&event_json).unwrap_or_default()
        );
    }

    // Process the event
    process_cloud_event(&state.issues, &state.events, &event_json).await;

    // Convert incoming event to our CloudEvent format
    let cloud_event = CloudEvent {
        specversion: incoming_event.specversion,
        id: incoming_event.id,
        source: incoming_event.source,
        subject: incoming_event.subject,
        event_type: incoming_event.event_type,
        time: incoming_event.time,
        datacontenttype: incoming_event.datacontenttype,
        data: incoming_event.data,
    };

    // Add to events list
    {
        let mut events = state.events.write().await;
        events.push(event_json);
    }

    // Broadcast the event
    let _ = state.tx.send(cloud_event);
    Json("ok")
}

/// Example function demonstrating CloudEvent creation
pub fn create_example_cloudevent() -> CloudEvent {
    // Create a sample zaak for demo purposes
    let mut sample_issues = std::collections::HashMap::new();
    sample_issues.insert(
        "123".to_string(),
        serde_json::json!({
            "id": "123",
            "title": "Voorbeeld zaak",
            "status": "open"
        }),
    );

    // Use issues module to create CloudEvent
    if let Some(event_json) = issues::generate_demo_event(&sample_issues) {
        if let Some(cloud_event) = issues::json_to_cloudevent(&event_json) {
            return cloud_event;
        }
    }

    // Fallback CloudEvent (should rarely be reached)
    CloudEvent {
        subject: Some("123".to_string()),
        specversion: "1.0".to_string(),
        id: uuid::Uuid::now_v7().to_string(),
        source: "server".to_string(),
        event_type: "issue.updated".to_string(),
        time: Some(chrono::Utc::now().to_rfc3339()),
        datacontenttype: Some("application/merge-patch+json".to_string()),
        data: Some(serde_json::json!({"status": "closed"})),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cloudevent_creation() {
        let event = create_example_cloudevent();

        assert_eq!(event.specversion, "1.0");
        assert!(!event.source.is_empty());
        assert!(event.source.contains("demo") || event.source == "server");
        assert!(matches!(
            event.event_type.as_str(),
            "issue.created" | "issue.updated" | "issue.deleted" | "item.created"
        ));
        assert!(event.datacontenttype.is_some());
        assert!(event.data.is_some());
    }

    #[test]
    fn test_cloudevent_serialization() {
        let event = create_example_cloudevent();
        let json = serde_json::to_string_pretty(&event).unwrap();

        // Verify it contains expected fields
        assert!(json.contains("\"specversion\": \"1.0\""));
        assert!(json.contains("\"source\":"));
        assert!(json.contains("\"type\":"));
        assert!(json.contains("\"datacontenttype\":"));

        println!("CloudEvent JSON:\n{}", json);
    }

    #[test]
    fn test_issue_create_cloudevent() {
        // Test using the issues module instead
        let (events, _) = issues::generate_initial_data();
        let create_events: Vec<_> = events
            .iter()
            .filter(|e| e["type"] == "issue.created")
            .collect();

        assert!(!create_events.is_empty());

        let event = &create_events[0];
        assert_eq!(event["specversion"], "1.0");
        assert!(!event["source"].as_str().unwrap().is_empty());
        assert_eq!(event["type"], "issue.created");
        assert_eq!(event["datacontenttype"], "application/json");
        assert!(event["data"]["title"].is_string());
        assert!(event["data"]["id"].is_string());
    }

    #[test]
    fn test_issue_merge_patch_cloudevent() {
        // Test using the issues module instead
        let (events, _) = issues::generate_initial_data();
        let patch_events: Vec<_> = events
            .iter()
            .filter(|e| e["type"] == "issue.updated")
            .collect();

        assert!(!patch_events.is_empty());

        let event = &patch_events[0];
        assert_eq!(event["specversion"], "1.0");
        assert!(!event["source"].as_str().unwrap().is_empty());
        assert_eq!(event["type"], "issue.updated");
        assert_eq!(event["datacontenttype"], "application/merge-patch+json");
        assert!(event["data"].is_object());
    }

    #[test]
    fn test_system_reset_cloudevent() {
        // Test system reset event creation
        let reset_event = CloudEvent {
            specversion: "1.0".to_string(),
            id: uuid::Uuid::now_v7().to_string(),
            source: "server".to_string(),
            subject: None,
            event_type: "system.reset".to_string(),
            time: Some(chrono::Utc::now().to_rfc3339()),
            datacontenttype: Some("application/json".to_string()),
            data: Some(serde_json::json!({
                "message": "App state has been reset",
                "timestamp": chrono::Utc::now().to_rfc3339()
            })),
        };

        assert_eq!(reset_event.specversion, "1.0");
        assert_eq!(reset_event.source, "server");
        assert_eq!(reset_event.event_type, "system.reset");
        assert_eq!(
            reset_event.datacontenttype,
            Some("application/json".to_string())
        );
        assert!(reset_event.data.is_some());
        assert!(reset_event.time.is_some());

        // Verify the data contains expected fields
        let data = reset_event.data.as_ref().unwrap();
        assert!(data.get("message").is_some());
        assert!(data.get("timestamp").is_some());

        // Verify serialization
        let json = serde_json::to_string(&reset_event).unwrap();
        assert!(json.contains("system.reset"));
        assert!(json.contains("App state has been reset"));
    }
}
