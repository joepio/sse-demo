# Timeline Event System Specification

Minimal, extensible event system for GitHub-style activity timelines.

## Core Design

**3 Event Types:**
- `timeline/item/created` - New timeline item
- `timeline/item/updated` - Modified item (JSON Merge Patch)  
- `timeline/item/deleted` - Removed item

**Extensible via `item_type`:** comment, status_change, llm_analysis, deployment, etc.

## Event Structure

### Created
```json
{
  "type": "https://api.example.com/events/timeline/item/created/v1",
  "subject": "issue-456",
  "data": {
    "item_type": "comment",
    "item_id": "comment-789",
    "actor": "alice@example.com", 
    "timestamp": "2024-01-15T10:30:00Z",
    "item_data": {
      "content": "This looks like a duplicate",
      "parent_id": null
    }
  }
}
```

### Updated
```json
{
  "type": "https://api.example.com/events/timeline/item/updated/v1",
  "subject": "issue-456",
  "data": {
    "item_type": "comment",
    "item_id": "comment-789",
    "actor": "alice@example.com",
    "timestamp": "2024-01-15T10:35:00Z", 
    "patch": {
      "content": "This is DEFINITELY a duplicate",
      "edited_at": "2024-01-15T10:35:00Z"
    }
  }
}
```

### Deleted
```json
{
  "type": "https://api.example.com/events/timeline/item/deleted/v1",
  "subject": "issue-456",
  "data": {
    "item_type": "comment",
    "item_id": "comment-789",
    "actor": "alice@example.com",
    "timestamp": "2024-01-15T10:40:00Z",
    "reason": "Duplicate comment"
  }
}
```

## Custom Item Types

### Comment
```json
{
  "item_type": "comment",
  "item_data": {
    "content": "User comment text",
    "parent_id": null,
    "mentions": ["@user"]
  }
}
```

### LLM Analysis
```json
{
  "item_type": "llm_analysis", 
  "item_data": {
    "prompt": "Analyze this issue",
    "response": "This appears to be...",
    "model": "gpt-4",
    "confidence": 0.92
  }
}
```

### Status Change
```json
{
  "item_type": "status_change",
  "item_data": {
    "field": "status",
    "old_value": "open",
    "new_value": "closed",
    "reason": "Fixed in PR #123"
  }
}
```

## API Endpoints

```
GET /api/{resource_type}/{resource_id}/timeline
GET /api/{resource_type}/{resource_id}/timeline/stream (SSE)
POST /api/timeline/items
PATCH /api/timeline/items/{item_id}
DELETE /api/timeline/items/{item_id}
```

## Benefits

- **Minimal**: Only 3 event types
- **Extensible**: Unlimited custom item types
- **GitHub-like**: Familiar timeline UX
- **Real-time**: Built-in SSE support
- **Efficient**: JSON Merge Patch updates
- **Developer-friendly**: Easy to add new timeline items