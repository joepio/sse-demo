# Generic JSON Editor Architecture

This document describes the generic JSON editor architecture that allows editing of any entity type (Issue, Message, Document, etc.) using the same underlying editor while maintaining type safety and domain-specific customizations.

## 🎯 Architecture Overview

The architecture consists of three layers:

1. **Generic Layer** - `CloudEventJsonEditor` - Handles JSON editing, patching, and CloudEvent generation
2. **Entity Layer** - `IssueEditor`, `MessageEditor`, `DocumentEditor` - Domain-specific logic and presentation
3. **View Layer** - `IssuesList`, `MessagesList`, etc. - Entity-specific display and interaction

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IssuesList    │    │  MessagesList   │    │ DocumentsList   │
│                 │    │                 │    │                 │
│ - Display       │    │ - Display       │    │ - Display       │
│ - Click handler │    │ - Click handler │    │ - Click handler │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          v                      v                      v
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IssueEditor   │    │  MessageEditor  │    │ DocumentEditor  │
│                 │    │                 │    │                 │
│ - Issue logic   │    │ - Message logic │    │ - Document logic│
│ - Subtitle      │    │ - Subtitle      │    │ - Subtitle      │
│ - Read-only     │    │ - Read-only     │    │ - Read-only     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────┬───────────┴──────────┬───────────┘
                     │                      │
                     v                      v
            ┌─────────────────────────────────────┐
            │      CloudEventJsonEditor          │
            │                                    │
            │ - Generic JSON editing             │
            │ - JSON Merge Patch calculation     │
            │ - CloudEvent generation            │
            │ - Read-only field protection       │
            │ - Modal management                 │
            └─────────────────────────────────────┘
```

## 🧩 Component Architecture

### 1. Generic Layer: CloudEventJsonEditor

**Responsibilities:**
- JSON editing with syntax highlighting
- JSON Merge Patch calculation (RFC 7396)
- CloudEvent generation with proper typing
- Read-only field protection
- Modal state management
- Error handling and validation

**Type Parameters:**
```typescript
interface CloudEventJsonEditorProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  data: T | null;
  entityId: string;
  entityType: string;
  onSave: (event: CloudEvent) => Promise<void>;
  readOnlyFields?: string[];
  maxWidth?: string;
}
```

**Key Features:**
- **Generic Type Support** - Works with any `T extends Record<string, any>`
- **Read-only Protection** - Prevents editing of specified fields
- **Patch Calculation** - Only sends changed fields to server
- **CloudEvent Generation** - Automatically creates proper CloudEvents
- **Error Handling** - User-friendly error messages and validation

### 2. Entity Layer: Specialized Editors

Each entity type has its own specialized editor that wraps the generic editor:

#### IssueEditor
```typescript
interface IssueEditorProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  onPatchIssue: (event: CloudEvent) => Promise<void>;
}
```

**Customizations:**
- Read-only fields: `["id", "created_at"]`
- Subtitle: Status, assignee, priority, creation date
- Max width: 800px
- Entity type: "issue"

#### MessageEditor
```typescript
interface MessageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  onPatchMessage: (event: CloudEvent) => Promise<void>;
}
```

**Customizations:**
- Read-only fields: `["id", "created_at", "author"]`
- Subtitle: Author, channel, thread, reactions count
- Max width: 700px
- Entity type: "message"

#### DocumentEditor
```typescript
interface DocumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onPatchDocument: (event: CloudEvent) => Promise<void>;
}
```

**Customizations:**
- Read-only fields: `["id", "created_at", "version"]`
- Subtitle: Status, author, version, tags, word count
- Max width: 900px
- Entity type: "document"

### 3. View Layer: Entity Lists

Each entity type has its own list component that handles display and interaction:

```typescript
// IssuesList
const handleIssueClick = (issue: Issue) => {
  setSelectedIssue(issue);
  setIsEditorOpen(true);
};

// MessagesList (future)
const handleMessageClick = (message: Message) => {
  setSelectedMessage(message);
  setIsEditorOpen(true);
};
```

## 📝 Type System

### Base Entity Interface
```typescript
export interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}
```

### Entity Definitions
```typescript
export interface Issue extends BaseEntity {
  title: string;
  description?: string;
  status: "open" | "in_progress" | "closed";
  priority?: "low" | "medium" | "high";
  assignee?: string;
  resolution?: string;
}

export interface Message extends BaseEntity {
  content: string;
  author?: string;
  channel?: string;
  thread_id?: string;
  reactions?: Record<string, number>;
}

export interface Document extends BaseEntity {
  title: string;
  content: string;
  author?: string;
  tags?: string[];
  version?: number;
  status?: "draft" | "published" | "archived";
}
```

### Type Mapping
```typescript
export type EntityTypeMap = {
  issue: Issue;
  message: Message;
  document: Document;
};

export type EntityType = keyof EntityTypeMap;
```

## 🔄 CloudEvent Generation

The generic editor automatically generates CloudEvents with proper structure:

```typescript
const cloudEvent: CloudEvent = {
  specversion: "1.0",
  id: crypto.randomUUID(),
  source: `/${entityType}s`,           // e.g., "/issues", "/messages"
  subject: entityId,                   // e.g., "123"
  type: `com.example.${entityType}.patch`, // e.g., "com.example.issue.patch"
  time: new Date().toISOString(),
  datacontenttype: "application/merge-patch+json",
  data: patch,                         // Only changed fields
};
```

## 🛡️ Read-only Field Protection

The system protects specified fields from modification:

```typescript
// Automatic restoration of read-only fields
const handleJsonChange = (value: any) => {
  const updatedValue = { ...value };
  readOnlyFields.forEach((field) => {
    if (field in originalData) {
      updatedValue[field] = originalData[field];
    }
  });
  setJsonData(updatedValue);
};
```

**Visual Indicators:**
- Field listing in help text
- Automatic restoration if modified

## 📊 JSON Merge Patch Implementation

Follows RFC 7396 specification:

```typescript
const calculatePatch = (original: T, modified: T): Partial<T> => {
  const patch: any = {};

  // Check for changes and additions
  for (const key in modified) {
    if (readOnlyFields.includes(key)) continue;
    if (modified[key] !== original[key]) {
      patch[key] = modified[key];
    }
  }

  // Check for deletions
  for (const key in original) {
    if (readOnlyFields.includes(key)) continue;
    if (!(key in modified)) {
      patch[key] = null; // null = delete in JSON Merge Patch
    }
  }

  return patch;
};
```

## 🔧 Adding New Entity Types

### 1. Define the Entity Type
```typescript
// In types.ts
export interface CustomEntity extends BaseEntity {
  name: string;
  value: number;
  tags?: string[];
}

// Update EntityTypeMap
export type EntityTypeMap = {
  issue: Issue;
  message: Message;
  document: Document;
  custom: CustomEntity; // Add new entity
};

// Update EventType union
export type EventType =
  | "com.example.issue.create"
  | "com.example.issue.patch"
  | "com.example.issue.delete"
  // ... existing types
  | "com.example.custom.create"
  | "com.example.custom.patch"
  | "com.example.custom.delete";
```

### 2. Create Specialized Editor
```typescript
// CustomEditor.tsx
import React from "react";
import CloudEventJsonEditor from "./CloudEventJsonEditor";
import type { CustomEntity, CloudEvent } from "../types";

interface CustomEditorProps {
  isOpen: boolean;
  onClose: () => void;
  entity: CustomEntity | null;
  onPatchEntity: (event: CloudEvent) => Promise<void>;
}

const CustomEditor: React.FC<CustomEditorProps> = ({
  isOpen,
  onClose,
  entity,
  onPatchEntity,
}) => {
  if (!entity) return null;

  const getSubtitle = (entity: CustomEntity) => {
    const parts = [`Value: ${entity.value}`];

    if (entity.tags && entity.tags.length > 0) {
      parts.push(`Tags: ${entity.tags.join(", ")}`);
    }

    return parts.join(" • ");
  };

  return (
    <CloudEventJsonEditor<CustomEntity>
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${entity.name}`}
      subtitle={getSubtitle(entity)}
      data={entity}
      entityId={entity.id}
      entityType="custom"
      onSave={onPatchEntity}
      readOnlyFields={["id", "created_at"]}
      maxWidth="600px"
    />
  );
};

export default CustomEditor;
```

### 3. Create List Component
```typescript
// CustomList.tsx
const CustomList: React.FC<CustomListProps> = ({
  entities,
  onDeleteEntity,
  onPatchEntity,
}) => {
  const [selectedEntity, setSelectedEntity] = useState<CustomEntity | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleEntityClick = (entity: CustomEntity) => {
    setSelectedEntity(entity);
    setIsEditorOpen(true);
  };

  return (
    <>
      {/* List rendering */}
      <CustomEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        entity={selectedEntity}
        onPatchEntity={onPatchEntity}
      />
    </>
  );
};
```

### 4. Update Backend (if needed)
```rust
// In Rust backend - add new event type handling
match cloud_event.type {
    "com.example.issue.create" | "com.example.issue.patch" | "com.example.issue.delete" => {
        // Existing issue handling
    },
    "com.example.custom.create" | "com.example.custom.patch" | "com.example.custom.delete" => {
        // New custom entity handling
        process_custom_event(&cloud_event);
    },
    _ => {}
}
```

## ✨ Benefits of This Architecture

### 🎯 Consistency
- **Uniform Experience** - Same editing paradigm across all entity types
- **Consistent CloudEvents** - Standardized event generation
- **Shared Validation** - Common error handling and messaging

### 🔄 Reusability
- **Generic Component** - One editor for all entity types
- **Minimal Duplication** - Specialized editors are thin wrappers
- **Shared Modal** - Common modal component with consistent behavior

### 🛡️ Type Safety
- **Full TypeScript** - Type checking at compile time
- **Generic Constraints** - Ensures entities extend BaseEntity
- **Event Type Safety** - CloudEvent generation is type-safe

### 🧩 Extensibility
- **Easy to Add** - New entity types require minimal code
- **Configurable** - Read-only fields, sizing, styling per entity
- **Maintainable** - Changes to core editor benefit all entities

### 🎨 Customization
- **Entity-Specific UI** - Custom subtitles and presentations
- **Flexible Sizing** - Modal width per entity type
- **Read-only Control** - Different protection rules per entity

## 🔮 Future Enhancements

### Advanced Features
- **Schema Validation** - JSON Schema validation per entity type
- **Field Templates** - Pre-defined value templates
- **Bulk Operations** - Multi-entity editing
- **History/Diff** - Visual change history
- **Export/Import** - JSON export/import functionality

### UI Improvements
- **Syntax Highlighting** - Better JSON syntax highlighting
- **Auto-completion** - Field suggestions and validation
- **Dark Mode** - Theme support
- **Responsive Design** - Better mobile experience

### Performance
- **Lazy Loading** - Load editors on demand
- **Memoization** - Optimize re-renders
- **Virtual Scrolling** - Handle large entity lists

This architecture provides a solid foundation for a multi-entity system while maintaining the flexibility to customize each entity type's editing experience.
