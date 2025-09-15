# SSE Demo: Issue Tracking with Event Sourcing

Real-time issue tracking system showcasing Server-Sent Events (SSE) with CloudEvents specification and event sourcing, built with Rust (Axum/Tokio) and vanilla JavaScript.

- **Real-time Updates**: Live issue updates powered by Server-Sent Events
- **Event Sourcing**: Complete issue state is reconstructed from immutable CloudEvents combined with JSON Merge Patch
- **Immutable Events**: All changes are stored as CloudEvents, never modified
- **State Reconstruction**: Current issues are built by replaying all events
- **Snapshot + Deltas**: Frontend receives full history, then live updates
- **Time Travel**: Complete audit trail of all changes

## ☁️ CloudEvents

All operations generate CloudEvents following v1.0 specification:

### Create Event
```json
{
  "specversion": "1.0",
  "id": "01234567-89ab-cdef-0123-456789abcdef",
  "source": "/issues",
  "subject": "123",
  "type": "com.example.issue.create",
  "time": "2025-01-11T15:30:00Z",
  "datacontenttype": "application/json",
  "data": {
    "id": "123",
    "title": "New issue",
    "description": "Issue description",
    "status": "open",
    "priority": "medium"
  }
}
```

### Update Event (JSON Merge Patch)
```json
{
  "specversion": "1.0",
  "id": "01234567-89ab-cdef-0123-456789abcdef",
  "source": "/issues",
  "subject": "123",
  "type": "com.example.issue.patch",
  "time": "2025-01-11T15:35:00Z",
  "datacontenttype": "application/merge-patch+json",
  "data": {
    "status": "in_progress",
    "assignee": "bob@example.com",
    "title": "🔥 URGENT: Login system failing"
  }
}
```

### Delete Event
```json
{
  "specversion": "1.0",
  "id": "01234567-89ab-cdef-0123-456789abcdef",
  "source": "/issues",
  "subject": "123",
  "type": "com.example.issue.delete",
  "time": "2025-01-11T15:40:00Z",
  "datacontenttype": "application/json",
  "data": {
    "id": "123",
    "reason": "duplicate"
  }
}
```

## 🚀 API Endpoints

- `GET /` - Interactive web interface with real-time updates
- `GET /events` - SSE endpoint streaming CloudEvents (snapshot + deltas)
- `POST /events` - Create new CloudEvents (for issue operations)
- `GET /cloudevents` - Read-only snapshot of all CloudEvents
- `GET /issues` - Read-only snapshot of current issues state

## 🧪 Testing

Use the included test script to generate sample events:

```bash
./test-api.sh
```

Or test manually:

```bash
# Create a new issue
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "specversion": "1.0",
    "id": "'$(uuidgen)'",
    "source": "/issues",
    "subject": "test-123",
    "type": "com.example.issue.create",
    "time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "datacontenttype": "application/json",
    "data": {
      "id": "test-123",
      "title": "Test issue from API",
      "description": "Created via curl",
      "status": "open",
      "priority": "medium"
    }
  }'

# Update an issue
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "specversion": "1.0",
    "id": "'$(uuidgen)'",
    "source": "/issues",
    "subject": "test-123",
    "type": "com.example.issue.patch",
    "time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "datacontenttype": "application/merge-patch+json",
    "data": {
      "status": "in_progress",
      "title": "🚀 FEATURE: Test issue from API"
    }
  }'

# Get current issues state
curl http://localhost:3000/issues

# Get all CloudEvents
curl http://localhost:3000/cloudevents
```

## 🏃 Development

### Local Development (Port 3000)
```bash
cargo run --features local
```

### Shuttle Local Development (Port 8000)
```bash
shuttle run
```

Open the respective localhost URL to see the web interface with real-time CloudEvents.

### Live Demo Data

The app automatically generates random demo events every 20 seconds, including:
- Status changes (open → in_progress → closed)
- Title updates with emojis (🔥 URGENT, ✅ RESOLVED, 🐛 BUG FIX)
- Assignee changes
- Priority adjustments
- Occasional new issue creation or deletion

## 🌐 Deployment

Deploy to Shuttle:

```bash
shuttle deploy
```
