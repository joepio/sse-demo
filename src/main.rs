use axum::{
    extract::State,
    response::{
        sse::{Event, KeepAlive, Sse},
        Html,
    },
    routing::{get, post},
    Json, Router,
};
use futures_util::stream::{self, Stream};
use serde::{Deserialize, Serialize};
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
        Self {
            items: Arc::new(RwLock::new(vec!["First item".into(), "Second item".into()])),
            tx,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
enum Delta {
    // For this demo we only append, but you can add Update/Remove etc.
    Append(String),
}

#[derive(Debug, Deserialize)]
struct NewItem {
    text: String,
}

#[tokio::main]
async fn main() {
    let state = AppState::default();

    // Optional: emit a demo delta every 15s so you see live updates immediately
    let demo = state.clone();
    tokio::spawn(async move {
        let mut i = 3;
        loop {
            sleep(Duration::from_secs(15)).await;
            let text = format!("Auto item #{i}");
            {
                let mut items = demo.items.write().await;
                items.push(text.clone());
            }
            let _ = demo.tx.send(Delta::Append(text));
            i += 1;
        }
    });

    let app = Router::new()
        .route("/", get(index))
        .route("/events", get(sse_handler))
        .route("/items", get(get_all)) // convenient REST snapshot
        .route("/items", post(add_item)) // append new item (POST JSON {text})
        .with_state(state);

    let addr = "0.0.0.0:3000";
    println!("→ http://{addr}");
    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
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

async fn index() -> Html<String> {
    Html(tokio::fs::read_to_string("src/index.html").await.unwrap())
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
    let _ = state.tx.send(Delta::Append(text));
    Json("ok")
}
