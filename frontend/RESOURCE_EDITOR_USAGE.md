# ResourceEditor Usage Guide

The `ResourceEditor` is a unified, generic component for editing any entity type in the application. It has replaced the previous separate `IssueEditor`, `MessageEditor`, `DocumentEditor`, and `CloudEventJsonEditor` components.

## Features

- **Generic**: Works with any entity type that extends `BaseEntity`
- **JSON Editor**: Uses `@uiw/react-json-view` for intuitive JSON editing
- **Read-only Fields**: Automatically protects specified fields from modification
- **Smart Defaults**: Generates reasonable titles and subtitles automatically
- **Type Safe**: Full TypeScript support with proper generics
- **JSON Merge Patch**: Only sends changed fields to the server

## Basic Usage

```tsx
import ResourceEditor from './ResourceEditor';
import type { Issue, CloudEvent } from '../types';

// For editing an Issue
<ResourceEditor<Issue>
  isOpen={isEditorOpen}
  onClose={() => setIsEditorOpen(false)}
  resource={selectedIssue}
  resourceType="issue"
  onSave={handleSave}
  readOnlyFields={["id", "created_at"]}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | ✅ | - | Controls modal visibility |
| `onClose` | `() => void` | ✅ | - | Called when modal is closed |
| `resource` | `T \| null` | ✅ | - | The entity to edit |
| `resourceType` | `string` | ✅ | - | Entity type name (e.g., "issue", "document") |
| `onSave` | `(event: CloudEvent) => Promise<void>` | ✅ | - | Called when saving changes |
| `readOnlyFields` | `string[]` | ❌ | `["id", "created_at"]` | Fields that cannot be modified |
| `maxWidth` | `string` | ❌ | `"800px"` | Modal maximum width |
| `getTitle` | `(resource: T) => string` | ❌ | Auto-generated | Custom title function |
| `getSubtitle` | `(resource: T) => string` | ❌ | Auto-generated | Custom subtitle function |

## Examples

### Issue Editor
```tsx
<ResourceEditor<Issue>
  isOpen={isIssueEditorOpen}
  onClose={() => setIsIssueEditorOpen(false)}
  resource={selectedIssue}
  resourceType="issue"
  onSave={onPatchIssue}
  readOnlyFields={["id", "created_at"]}
  maxWidth="800px"
/>
```

### Document Editor
```tsx
<ResourceEditor<Document>
  isOpen={isDocumentEditorOpen}
  onClose={() => setIsDocumentEditorOpen(false)}
  resource={selectedDocument}
  resourceType="document"
  onSave={onPatchDocument}
  readOnlyFields={["id", "created_at", "version"]}
  maxWidth="900px"
/>
```

### Message Editor
```tsx
<ResourceEditor<Message>
  isOpen={isMessageEditorOpen}
  onClose={() => setIsMessageEditorOpen(false)}
  resource={selectedMessage}
  resourceType="message"
  onSave={onPatchMessage}
  readOnlyFields={["id", "created_at", "author"]}
  maxWidth="700px"
/>
```

### Custom Title and Subtitle
```tsx
<ResourceEditor<Issue>
  isOpen={isOpen}
  onClose={onClose}
  resource={issue}
  resourceType="issue"
  onSave={onSave}
  readOnlyFields={["id", "created_at"]}
  getTitle={(issue) => `Bug Report #${issue.id}: ${issue.title}`}
  getSubtitle={(issue) => `Priority: ${issue.priority} | Assigned to: ${issue.assignee || 'Unassigned'}`}
/>
```

## Auto-generated Titles and Subtitles

The ResourceEditor automatically generates sensible titles and subtitles based on common entity fields:

### Title Generation
- Uses `title` field if available
- Falls back to `name` field if available
- Otherwise uses "Edit {ResourceType} #{id}"

### Subtitle Generation
Automatically includes relevant fields when present:
- Status
- Author/Assignee
- Priority
- Tags
- Creation date
- Version
- Content word count
- Reaction counts (for messages)

## Read-only Field Protection

Read-only fields are protected at multiple levels:

1. **Visual Indicators**: Shows which fields are read-only
2. **JSON Preservation**: Automatically restores read-only field values if changed
3. **Patch Filtering**: Excludes read-only fields from the generated patch
4. **User Feedback**: Displays warnings about read-only fields

## Migration from Old Editors

### Before (Multiple Components)
```tsx
// Old way - separate components
import IssueEditor from './IssueEditor';
import DocumentEditor from './DocumentEditor';
import MessageEditor from './MessageEditor';

<IssueEditor issue={issue} onPatchIssue={onPatch} />
<DocumentEditor document={doc} onPatchDocument={onPatch} />
<MessageEditor message={msg} onPatchMessage={onPatch} />
```

### After (Unified Component)
```tsx
// New way - single component
import ResourceEditor from './ResourceEditor';

<ResourceEditor<Issue> resource={issue} resourceType="issue" onSave={onPatch} />
<ResourceEditor<Document> resource={doc} resourceType="document" onSave={onPatch} />
<ResourceEditor<Message> resource={msg} resourceType="message" onSave={onPatch} />
```

## Benefits

1. **Reduced Code Duplication**: Single component instead of multiple similar ones
2. **Consistent UX**: All editors behave the same way
3. **Easier Maintenance**: Changes only need to be made in one place
4. **Better Type Safety**: Generic implementation provides better TypeScript support
5. **Flexible**: Easy to add support for new entity types
6. **User-friendly**: JSON editor is more intuitive than Monaco Editor for simple editing

## Adding New Entity Types

To use ResourceEditor with a new entity type:

1. Ensure your entity extends `BaseEntity` and `Record<string, unknown>`
2. Use the component with proper generic typing
3. Specify appropriate `readOnlyFields`
4. Optionally provide custom title/subtitle functions

```tsx
// New entity type
interface CustomEntity extends BaseEntity {
  name: string;
  category: string;
  metadata?: Record<string, unknown>;
}

// Usage
<ResourceEditor<CustomEntity>
  resource={customEntity}
  resourceType="custom"
  onSave={onSave}
  readOnlyFields={["id", "created_at", "metadata"]}
/>
```
