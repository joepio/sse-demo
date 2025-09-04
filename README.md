# SSE Demo: Snapshots & Deltas

Simple Rust + JS demo showcasing Server-Sent Events (SSE), built with Tokio and Axum.
Browser app with real-time updates over SSE, with Snapshots (all state until now) and Deltas (streaming new changes).

## Local development

```
# Make sure cargo, rust and shuttle.rs are installed
shuttle run
```

## Deployment

Currently running on https://sse-demo-syla.shuttle.app/, hosted on the account joepio

```
shuttle deploy
```
