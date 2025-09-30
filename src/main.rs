mod issues;
mod schemas;

use chrono;
use futures_util::stream::{self, Stream};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[cfg(feature = "shuttle")]
use shuttle_axum::axum::{
    extract::{Path, State},
    http::StatusCode,
    response::sse::{Event, KeepAlive, Sse},
    response::{Html, Response},
    routing::{get, post},
    Json, Router,
};

#[cfg(not(feature = "shuttle"))]
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::sse::{Event, KeepAlive, Sse},
    response::{Html, Response},
    routing::{get, post},
    serve, Json, Router,
};
use std::{convert::Infallible, sync::Arc, time::Duration};
use tokio::{
    sync::{broadcast, RwLock},
    time::sleep,
};
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt;
use tower_http::services::ServeDir;
use tower_http::{cors::CorsLayer, services::ServeFile};

#[derive(Clone)]
struct AppState {
    // Our entire list (the "source of truth")
    events: Arc<RwLock<Vec<Value>>>,
    // Broadcast deltas to all subscribers
    tx: broadcast::Sender<CloudEvent>,
    // Base URL for generating schema URLs
    base_url: String,
}

impl Default for AppState {
    fn default() -> Self {
        let (tx, _) = broadcast::channel(256);

        // Generate initial data
        let (initial_events, _) = issues::generate_initial_data();

        Self {
            events: Arc::new(RwLock::new(initial_events)),
            tx,
            base_url: "http://localhost:8000".to_string(),
        }
    }
}

/// CloudEvent following the CloudEvents specification v1.0
pub use schemas::CloudEvent;

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

#[cfg(feature = "shuttle")]
#[shuttle_runtime::main]
async fn main() -> shuttle_axum::ShuttleAxum {
    let app = create_app().await;
    Ok(app.into())
}

#[cfg(not(feature = "shuttle"))]
#[tokio::main]
async fn main() {
    let app = create_app().await;
    let addr = "0.0.0.0:8000";
    println!("→ http://{addr}");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    serve(listener, app).await.unwrap();
}

async fn create_app() -> Router {
    if !std::path::Path::new("dist").exists() {
        panic!("Frontend dist folder is missing! Please build the frontend first with: cd frontend && pnpm run build");
    }

    // Get base URL from environment or use default
    let base_url =
        std::env::var("BASE_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());

    let mut state = AppState::default();
    state.base_url = base_url;

    // Optional: emit demo events every 20s that randomly update existing zaken
    if std::env::var("DEMO").is_ok() {
        let demo = state.clone();
        tokio::spawn(async move {
            loop {
                sleep(Duration::from_secs(10)).await;

                // Get current zaken for random selection from events
                let current_issues = {
                    let events = demo.events.read().await;
                    // Extract issues from events for demo purposes
                    let mut issues_map = std::collections::HashMap::new();
                    for event in events.iter() {
                        if let Some(data) = event.get("data") {
                            if let Some(item_type) = data.get("item_type").and_then(|t| t.as_str())
                            {
                                if item_type == "issue" {
                                    if let Some(item_data) = data.get("item_data") {
                                        if let Some(id) =
                                            item_data.get("id").and_then(|i| i.as_str())
                                        {
                                            issues_map.insert(id.to_string(), item_data.clone());
                                        }
                                    }
                                }
                            }
                        }
                    }
                    issues_map
                };

                // Generate a random demo event
                if let Some(demo_event_json) = issues::generate_demo_event(&current_issues) {
                    // Convert JSON to our CloudEvent struct
                    if let Some(cloud_event) = issues::json_to_cloudevent(&demo_event_json) {
                        // Store the event
                        {
                            let mut events = demo.events.write().await;
                            events.push(demo_event_json);
                        }

                        // Broadcast to all listeners
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

                let events_count = reset_app_state(&reset_state).await;

                let complete_time = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC");
                println!(
                    "✅ [{}] App state reset complete - {} events regenerated",
                    complete_time, events_count
                );
            }
        });
    }

    let app = Router::new()
        .route("/events", get(sse_handler))
        .route("/events", post(handle_event)) // single endpoint for all CloudEvents
        .route("/reset/", post(reset_state_handler))
        .route("/schemas", get(get_schemas_index))
        .route("/schemas/{name}", get(get_schema))
        .route("/asyncapi-docs/asyncapi.yaml", get(serve_asyncapi_yaml))
        .route("/asyncapi-docs/asyncapi.json", get(serve_asyncapi_json))
        .route("/asyncapi-docs", get(serve_asyncapi_docs))
        .nest_service("/asyncapi-docs/css", ServeDir::new("asyncapi-docs/css"))
        .nest_service("/asyncapi-docs/js", ServeDir::new("asyncapi-docs/js"))
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

/// Validate a CloudEvent JSON
fn validate_cloud_event(event_json: &Value) -> bool {
    if let Some(event_type) = event_json.get("type").and_then(|t| t.as_str()) {
        matches!(
            event_type,
            "item.created" | "item.updated" | "item.deleted" | "system.reset"
        )
    } else {
        false
    }
}

async fn handle_event(
    State(state): State<AppState>,
    Json(incoming_event): Json<IncomingCloudEvent>,
) -> Result<Json<&'static str>, StatusCode> {
    // Convert to JSON Value for processing
    let mut event_json = serde_json::to_value(&incoming_event).unwrap();

    // Validate event type
    if !validate_cloud_event(&event_json) {
        eprintln!("❌ Invalid event type: {}", incoming_event.event_type);
        return Err(StatusCode::BAD_REQUEST);
    }

    // Add NL-GOV compliance fields if not present
    add_dataschema_to_event(&mut event_json, &state.base_url);

    // Convert incoming event to our CloudEvent format
    let cloud_event = CloudEvent {
        specversion: incoming_event.specversion,
        id: incoming_event.id,
        source: incoming_event.source,
        subject: incoming_event.subject,
        event_type: incoming_event.event_type,
        time: incoming_event.time,
        datacontenttype: incoming_event.datacontenttype,
        dataschema: None,
        dataref: None,
        sequence: None,
        sequencetype: None,
        data: incoming_event.data,
    };

    // Store the event
    {
        let mut events = state.events.write().await;
        events.push(event_json);
    }

    // Broadcast to all listeners
    let _ = state.tx.send(cloud_event);

    Ok(Json("ok"))
}

/// Get all available schemas as an index
async fn get_schemas_index() -> Json<Value> {
    Json(schemas::get_schema_index())
}

/// Get a specific schema by name
async fn get_schema(Path(name): Path<String>) -> Result<Json<Value>, StatusCode> {
    match schemas::get_schema(&name) {
        Some(schema) => Ok(Json(schema)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

/// Serve the AsyncAPI HTML documentation with fixed paths
async fn serve_asyncapi_docs() -> Result<Html<String>, StatusCode> {
    let docs_path = std::path::Path::new("asyncapi-docs/index.html");
    if !docs_path.exists() {
        return Err(StatusCode::NOT_FOUND);
    }

    match tokio::fs::read_to_string(docs_path).await {
        Ok(content) => {
            // Fix the relative paths to work with our routing
            let fixed_content = content
                .replace(r#"href="css/"#, r#"href="/asyncapi-docs/css/"#)
                .replace(r#"src="js/"#, r#"src="/asyncapi-docs/js/"#);
            Ok(Html(fixed_content))
        }
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// Serve the AsyncAPI YAML specification
async fn serve_asyncapi_yaml() -> Result<Response, StatusCode> {
    let yaml_path = std::path::Path::new("asyncapi.yaml");
    if !yaml_path.exists() {
        return Err(StatusCode::NOT_FOUND);
    }

    match tokio::fs::read_to_string(yaml_path).await {
        Ok(content) => {
            let response = Response::builder()
                .header("Content-Type", "text/yaml")
                .header("Content-Disposition", "inline; filename=\"asyncapi.yaml\"")
                .body(content.into())
                .unwrap();
            Ok(response)
        }
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// Serve the AsyncAPI JSON specification
async fn serve_asyncapi_json() -> Result<Json<Value>, StatusCode> {
    let json_path = std::path::Path::new("asyncapi.json");
    if !json_path.exists() {
        return Err(StatusCode::NOT_FOUND);
    }

    match tokio::fs::read_to_string(json_path).await {
        Ok(content) => match serde_json::from_str::<Value>(&content) {
            Ok(json_value) => Ok(Json(json_value)),
            Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
        },
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// Reset the application state with fresh data
async fn reset_app_state(state: &AppState) -> usize {
    // Generate fresh initial data
    let (new_events, _) = issues::generate_initial_data();

    // Store length before moving the data
    let events_count = new_events.len();

    // Reset events
    {
        let mut events = state.events.write().await;
        *events = new_events;
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
        dataschema: None,
        dataref: None,
        sequence: None,
        sequencetype: None,
        data: Some(serde_json::json!({
            "message": "App state has been reset",
            "timestamp": chrono::Utc::now().to_rfc3339()
        })),
    };

    let _ = state.tx.send(reset_event);

    events_count
}

/// Example function demonstrating CloudEvent creation
async fn reset_state_handler(State(state): State<AppState>) -> Json<Value> {
    let reset_time = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC");
    println!("🔄 [{}] Manual reset triggered via API...", reset_time);

    let events_count = reset_app_state(&state).await;

    let complete_time = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC");
    println!(
        "✅ [{}] Manual app state reset complete - {} events regenerated",
        complete_time, events_count
    );

    Json(serde_json::json!({
        "status": "success",
        "message": "App state has been reset",
        "events_count": events_count,
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

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

    // Fallback NL-GOV compliant CloudEvent
    CloudEvent {
        subject: Some("zaak-123".to_string()),
        specversion: "1.0".to_string(),
        id: uuid::Uuid::now_v7().to_string(),
        source: "urn:nld:oin:00000001823288444000:systeem:sse-demo-systeem".to_string(),
        event_type: "nl.gemeente.demo.zaken.zaak-status-gewijzigd".to_string(),
        time: Some(chrono::Utc::now().to_rfc3339()),
        datacontenttype: Some("application/json".to_string()),
        dataschema: Some("http://localhost:8000/schemas/ItemEventData".to_string()),
        dataref: Some("http://localhost:8000/api/zaken/zaak-123".to_string()),
        sequence: Some("1".to_string()),
        sequencetype: Some("integer".to_string()),
        data: Some(serde_json::json!({
            "item_type": "issue",
            "item_id": "zaak-123",
            "item_data": {
                "status": "in_behandeling",
                "assignee": "alice@gemeente.nl"
            },
            "itemschema": "http://localhost:8000/schemas/Issue"
        })),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_cloudevent_creation() {
        let event = create_example_cloudevent();

        assert_eq!(event.specversion, "1.0");
        assert!(!event.source.is_empty());
        assert!(event.source.contains("demo") || event.source == "server");
        assert!(matches!(
            event.event_type.as_str(),
            "item.created" | "item.updated" | "item.deleted" | "system.reset"
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
            .filter(|e| e["type"] == "item.created" && e["data"]["item_type"] == "issue")
            .collect();

        assert!(!create_events.is_empty());

        let event = &create_events[0];
        assert_eq!(event["specversion"], "1.0");
        assert!(!event["source"].as_str().unwrap().is_empty());
        assert_eq!(event["type"], "item.created");
        assert_eq!(event["datacontenttype"], "application/json");
        assert!(event["data"]["item_data"]["title"].is_string());
        assert!(event["data"]["item_data"]["id"].is_string());
    }

    #[test]
    fn test_issue_merge_patch_cloudevent() {
        // Test using the issues module instead
        let (events, _) = issues::generate_initial_data();
        let patch_events: Vec<_> = events
            .iter()
            .filter(|e| e["type"] == "item.updated" && e["data"]["item_type"] == "issue")
            .collect();

        assert!(!patch_events.is_empty());

        let event = &patch_events[0];
        assert_eq!(event["specversion"], "1.0");
        assert!(!event["source"].as_str().unwrap().is_empty());
        assert_eq!(event["type"], "item.updated");
        assert_eq!(event["datacontenttype"], "application/json");
        assert!(event["data"]["item_data"].is_object());
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
            dataschema: None,
            dataref: None,
            sequence: None,
            sequencetype: None,
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

    #[tokio::test]
    async fn test_schema_endpoints() {
        // Test get_schemas_index function
        let index = get_schemas_index().await;
        let index_value = index.0; // Extract the Json wrapper

        assert!(index_value.is_object());
        assert!(index_value.get("schemas").is_some());
        assert!(index_value.get("base_url").is_some());
        assert_eq!(
            index_value.get("base_url").unwrap().as_str().unwrap(),
            "/schemas"
        );

        let schemas_array = index_value.get("schemas").unwrap().as_array().unwrap();
        assert!(schemas_array.len() > 0);

        // Check that key schemas are present
        let schema_names: Vec<String> = schemas_array
            .iter()
            .map(|v| v.as_str().unwrap().to_string())
            .collect();

        assert!(schema_names.contains(&"CloudEvent".to_string()));
        assert!(schema_names.contains(&"Issue".to_string()));
        assert!(schema_names.contains(&"Task".to_string()));
    }

    #[tokio::test]
    async fn test_get_specific_schema_endpoint() {
        use shuttle_axum::axum::extract::Path;

        // Test getting CloudEvent schema
        let path = Path("CloudEvent".to_string());
        let result = get_schema(path).await;

        assert!(result.is_ok());
        let schema = result.unwrap().0; // Extract Json wrapper

        assert!(schema.is_object());
        assert!(schema.get("properties").is_some());

        let properties = schema.get("properties").unwrap().as_object().unwrap();
        assert!(properties.contains_key("specversion"));
        assert!(properties.contains_key("id"));
        assert!(properties.contains_key("source"));
        assert!(properties.contains_key("dataschema"));
        assert!(properties.contains_key("dataref"));
    }

    #[tokio::test]
    async fn test_get_nonexistent_schema_endpoint() {
        use shuttle_axum::axum::extract::Path;
        use shuttle_axum::axum::http::StatusCode;

        // Test getting non-existent schema
        let path = Path("NonExistentSchema".to_string());
        let result = get_schema(path).await;

        assert!(result.is_err());
        let status = result.unwrap_err();
        assert_eq!(status, StatusCode::NOT_FOUND);
    }

    #[test]
    fn test_add_dataschema_to_event() {
        let base_url = "http://localhost:8000";

        // Test event with data payload
        let mut event_with_data = json!({
            "specversion": "1.0",
            "id": "test-123",
            "source": "test-source",
            "type": "item.created",
            "data": {
                "item_type": "issue",
                "item_id": "issue-123"
            }
        });

        add_dataschema_to_event(&mut event_with_data, base_url);

        assert_eq!(
            event_with_data.get("dataschema").unwrap().as_str().unwrap(),
            "http://localhost:8000/schemas/ItemEventData"
        );

        // Test event without data payload
        let mut event_without_data = json!({
            "specversion": "1.0",
            "id": "test-456",
            "source": "test-source",
            "type": "system.reset"
        });

        add_dataschema_to_event(&mut event_without_data, base_url);

        assert_eq!(
            event_without_data
                .get("dataschema")
                .unwrap()
                .as_str()
                .unwrap(),
            "http://localhost:8000/schemas/CloudEvent"
        );

        // Test event that already has dataschema (should not be overwritten)
        let mut event_with_existing_schema = json!({
            "specversion": "1.0",
            "id": "test-789",
            "source": "test-source",
            "type": "item.updated",
            "dataschema": "http://example.com/custom-schema",
            "data": {
                "item_type": "task"
            }
        });

        add_dataschema_to_event(&mut event_with_existing_schema, base_url);

        // Should not change existing dataschema
        assert_eq!(
            event_with_existing_schema
                .get("dataschema")
                .unwrap()
                .as_str()
                .unwrap(),
            "http://example.com/custom-schema"
        );
    }
}

/// Add dataschema URL to CloudEvent based on the event type and data
fn add_dataschema_to_event(event: &mut Value, base_url: &str) {
    // Only add dataschema if not already present
    if event.get("dataschema").is_none() {
        let schema_url = if event.get("data").is_some() {
            // The dataschema describes the structure of the "data" payload
            // In our case, that's always ItemEventData which contains:
            // - item_type
            // - item_id
            // - item_data (the actual item content)
            format!("{}/schemas/ItemEventData", base_url)
        } else {
            // No data payload, so no schema needed for data
            // Could potentially point to a minimal CloudEvent schema
            format!("{}/schemas/CloudEvent", base_url)
        };

        event["dataschema"] = Value::String(schema_url);
    }
}
