# SSE Demo: Issue Tracking with Event Sourcing

Real-time issue tracking system showcasing Server-Sent Events (SSE) with CloudEvents specification and event sourcing, built with Rust (Axum/Tokio) backend and React + Vite frontend.

- **Real-time Updates**: Live issue updates powered by Server-Sent Events
- **Event Sourcing**: Complete issue state is reconstructed from immutable CloudEvents combined with JSON Merge Patch
- **Immutable Events**: All changes are stored as CloudEvents, never modified
- **State Reconstruction**: Current issues are built by replaying all events
- **Snapshot + Deltas**: Frontend receives full history, then live updates
- **Time Travel**: Complete audit trail of all changes
- **Modern Frontend**: React + TypeScript + Vite with custom hooks for SSE

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

### Quick Start

**Option 1: Build and run production mode**
```bash
# Build everything (React frontend + Rust backend)
./build.sh

# Run with built React app served by Rust
cargo run
```

**Option 2: Development mode with hot reloading**
```bash
# Terminal 1: Start Rust backend
cargo run --features local

# Terminal 2: Start React dev server (in another terminal)
cd frontend
npm run dev
```

### Development Modes

**Production Mode (Port 3000)**
- React app is built and served by Rust backend
- Single server serving both API and static files
```bash
cargo run  # serves at http://localhost:3000
```

**Development Mode (Dual servers)**
- Rust backend serves API only (Port 3000)
- Vite dev server serves React app with hot reload (Port 5173)
- Vite proxies API requests to Rust backend
```bash
cargo run --features local     # API at http://localhost:3000
cd frontend && npm run dev      # React at http://localhost:5173
```

**Shuttle Local Development (Port 8000)**
```bash
shuttle run
```

### Building

**Build React Frontend**
```bash
cd frontend
npm install
npm run build  # outputs to ../dist/
```

**Build Rust Backend**
```bash
cargo build --release
```

**Build Everything**
```bash
./build.sh  # Automated build script
```

### Live Demo Data

The app automatically generates random demo events every 20 seconds, including:
- Status changes (open → in_progress → closed)
- Title updates with emojis (🔥 URGENT, ✅ RESOLVED, 🐛 BUG FIX)
- Assignee changes
- Priority adjustments
- Occasional new issue creation or deletion

## 🌐 Deployment

### Shuttle Deployment

1. Build the React frontend:
```bash
cd frontend && npm run build && cd ..
```

2. Deploy to Shuttle:
```bash
shuttle deploy
```

### Manual Deployment

1. Build everything:
```bash
./build.sh
```

2. Deploy the binary and `dist/` folder to your server

## 🛠️ Architecture

### Backend (Rust)
- **Framework**: Axum with Tokio async runtime
- **Features**: Server-Sent Events, CloudEvents processing, JSON Merge Patch
- **API Endpoints**: `/events` (SSE + POST), `/issues`, `/cloudevents`
- **Static Files**: Serves built React app in production mode

### Frontend (React + TypeScript)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7 with hot module reloading
- **SSE Integration**: Custom React hooks for real-time event handling
- **State Management**: React hooks with local state and optimistic updates
- **Styling**: CSS-in-JS with responsive design and dark mode support

### Development Workflow
- **Hot Reloading**: Vite dev server with instant updates
- **Proxy Setup**: API requests automatically proxied from React dev server to Rust backend
- **Type Safety**: Full TypeScript coverage with CloudEvents interfaces
- **Production Build**: Single binary serving optimized React bundle
