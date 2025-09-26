# Components Documentation

## SchemaEditForm

The `SchemaEditForm` component provides dynamic editing capabilities for items using JSON Schema validation. This component creates modal-based edit forms that are automatically generated based on the item type's schema.

### Features

- **Dynamic form generation**: Automatically creates form fields based on JSON Schema
- **Modal interface**: Opens in a modal overlay for better UX
- **Type validation**: Uses the same schemas as the create forms for consistency
- **Real-time updates**: Sends CloudEvent updates via the SSE context

### Usage

```tsx
import SchemaEditForm from './SchemaEditForm';

// In your component
const [showEditModal, setShowEditModal] = useState(false);

<SchemaEditForm
  isOpen={showEditModal}
  onClose={() => setShowEditModal(false)}
  itemType="comment"
  itemId="comment-123"
  initialData={{
    content: "Original comment text",
    mentions: ["user@example.com"]
  }}
  onSubmit={sendEvent}
  zaakId="zaak-456"
/>
```

### Props

- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Called when modal should close
- `itemType: string` - Type of item being edited (comment, task, document, etc.)
- `itemId: string` - Unique ID of the item being edited
- `initialData: Record<string, any>` - Current values to populate the form
- `onSubmit: (event: CloudEvent) => Promise<void>` - Function to handle the update event
- `zaakId: string` - ID of the parent zaak/issue

### Event Structure

The component generates CloudEvents with the following structure:

```json
{
  "specversion": "1.0",
  "id": "uuid-here",
  "source": "frontend-edit",
  "subject": "zaak-id",
  "type": "item.updated",
  "time": "2024-01-01T12:00:00Z",
  "datacontenttype": "application/json",
  "data": {
    "item_type": "comment",
    "item_id": "comment-123",
    "actor": "frontend-user",
    "patch": {
      "content": "Updated comment text",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  }
}
```

### Integration Examples

#### CommentPlugin

```tsx
import SchemaEditForm from "../../components/SchemaEditForm";

// Add edit button
<Button variant="icon" size="sm" onClick={() => setShowEditModal(true)}>
  ✏️
</Button>

// Add form
<SchemaEditForm
  isOpen={showEditModal}
  onClose={() => setShowEditModal(false)}
  itemType="comment"
  itemId={commentId}
  initialData={{ content, mentions }}
  onSubmit={sendEvent}
  zaakId={zaakId}
/>
```

#### TaskCard

```tsx
import SchemaEditForm from "./SchemaEditForm";

// Add edit button next to task description
<Button variant="icon" size="sm" onClick={() => setShowEditModal(true)}>
  ✏️
</Button>

// Add form
<SchemaEditForm
  isOpen={showEditModal}
  onClose={() => setShowEditModal(false)}
  itemType="task"
  itemId={task.id}
  initialData={{
    description: task.description,
    cta: task.cta,
    deadline: task.deadline
  }}
  onSubmit={sendEvent}
  zaakId={zaakId}
/>
```

### Field Types Supported

The form automatically generates appropriate input elements based on JSON Schema field types:

- `string` (default format) → Text input
- `string` with `format: "textarea"` → Textarea
- `string` with `format: "date"` → Date picker
- `string` with `format: "date-time"` → DateTime picker
- `boolean` → Checkbox
- `number` / `integer` → Number input

### Styling

The component uses the application's CSS custom properties for consistent theming:

- `--bg-primary` / `--bg-secondary` - Background colors
- `--text-primary` / `--text-secondary` / `--text-tertiary` - Text colors
- `--border-primary` - Border colors

### Limitations

- Read-only fields (`id`, `created_at`) are automatically excluded
- Complex nested objects require special handling
- File uploads are not currently supported
- Array fields need custom rendering logic

### Related Components

- `SchemaForm` - For creating new items
- `Modal` - Base modal component
- `ResourceEditor` - JSON-based editing (legacy)