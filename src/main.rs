use futures_util::stream::{self, Stream};
use serde::{Deserialize, Serialize};
use shuttle_axum::axum::{
    extract::State,
    response::{
        sse::{Event, KeepAlive, Sse},
        Html,
    },
    routing::{get, post},
    Json, Router,
};
use std::{convert::Infallible, sync::Arc, time::Duration};
use tokio::{
    sync::{broadcast, RwLock},
    time::sleep,
};
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt;

#[derive(Clone)]
struct AppState {
    // Our entire list (the “source of truth”)
    items: Arc<RwLock<Vec<String>>>,
    // Broadcast deltas to all subscribers
    tx: broadcast::Sender<Delta>,
}

impl Default for AppState {
    fn default() -> Self {
        let (tx, _) = broadcast::channel(256);

        // Initialize with 1000 simple events
        let mut items = Vec::new();
        for i in 1..=1000 {
            items.push(format!("Event #{}", i));
        }

        Self {
            items: Arc::new(RwLock::new(items)),
            tx,
        }
    }
}

/// A single change event sent to subscribers
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
enum Delta {
    // For this demo we only Create, but you can add Update/Remove etc.
    Create(String),
}

#[derive(Debug, Deserialize)]
struct NewItem {
    text: String,
}

// #[tokio::main]
#[shuttle_runtime::main]
async fn main() -> shuttle_axum::ShuttleAxum {
    let state = AppState::default();

    // Optional: emit a demo event every 15s so you see live updates immediately
    let demo = state.clone();
    tokio::spawn(async move {
        let mut counter = 1001;
        loop {
            sleep(Duration::from_secs(15)).await;
            let text = format!("Event #{}", counter);
            {
                let mut items = demo.items.write().await;
                items.push(text.clone());
            }
            let _ = demo.tx.send(Delta::Create(text));
            counter += 1;
        }
    });

    let app = Router::new()
        .route("/", get(index))
        .route("/events", get(sse_handler))
        .route("/items", get(get_all)) // convenient REST snapshot
        .route("/items", post(add_item)) // append new item (POST JSON {text})
        .with_state(state);

    Ok(app.into())
    // let addr = "0.0.0.0:3000";
    // println!("→ http://{addr}");
    // axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
    //     .await
    //     .unwrap();
}

async fn sse_handler(
    State(state): State<AppState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let rx = state.tx.subscribe();

    let snapshot = {
        let items = state.items.read().await;
        serde_json::to_string(&*items).unwrap()
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

async fn index() -> Html<&'static str> {
    Html(include_str!("index.html"))
}

async fn get_all(State(state): State<AppState>) -> Json<Vec<String>> {
    Json(state.items.read().await.clone())
}

async fn add_item(
    State(state): State<AppState>,
    Json(NewItem { text }): Json<NewItem>,
) -> Json<&'static str> {
    {
        let mut items = state.items.write().await;
        items.push(text.clone());
    }
    let _ = state.tx.send(Delta::Create(text));
    Json("ok")
}
