# Timeline Event Plugins

This directory contains the plugin system for rendering different types of timeline events. Each event type has its own plugin component that handles the specific rendering logic.

## Architecture

The plugin system uses a simple component-based approach:

1. **Plugin Components** - Each event type is a React component that receives standardized props
2. **Configuration Objects** - Each plugin exports a config object defining its icon, title, and render mode
3. **Registry System** - All plugins are registered in `index.ts` for easy discovery and use

## Plugin Structure

Each plugin follows this pattern:

```tsx
import React from "react";
import type { EventPluginProps } from "./types";

const MyEventPlugin: React.FC<EventPluginProps> = ({ event, data, timeInfo }) => {
  return (
    <span>
      {/* Plugin-specific rendering logic here */}
    </span>
  );
};

export const myEventConfig = {
  icon: "🎯",
  title: "My Event", // Optional - omit for headerless rendering
  renderAs: "line" as const, // "card" or "line"
};

export default MyEventPlugin;
```

## Rendering Modes

Plugins can render in two modes:

### Card Mode (`renderAs: "card"`)
- Full timeline card with header, content area, and styling
- Best for rich content like comments, AI analysis, issue creation
- Examples: Comments, LLM Analysis, Issue Created

### Line Mode (`renderAs: "line"`)  
- Single line with icon and inline timestamp
- Best for simple updates and status changes
- Examples: Status changes, deployments, simple updates

## Available Plugins

| Plugin | Type | Render Mode | Purpose |
|--------|------|-------------|---------|
| `CommentPlugin` | `comment` | card | User comments and discussions |
| `StatusChangePlugin` | `status_change` | line | Field value changes |
| `LLMAnalysisPlugin` | `llm_analysis` | card | AI analysis results |
| `IssueCreatedPlugin` | `issue_created` | card | New issue creation |
| `IssueUpdatedPlugin` | `issue_updated` | line | Issue field updates |
| `IssueDeletedPlugin` | `issue_deleted` | line | Issue deletion |
| `DeploymentPlugin` | `deployment` | line | Deployment notifications |
| `SystemEventPlugin` | `system_event` | line | System-generated events |

## Adding a New Plugin

1. **Create the plugin component** (e.g., `MyEventPlugin.tsx`):

```tsx
import React from "react";
import type { EventPluginProps } from "./types";

const MyEventPlugin: React.FC<EventPluginProps> = ({ event, data }) => {
  const actor = event.actor && event.actor !== "system" ? event.actor : null;
  
  return (
    <span>
      {actor && <strong>{actor}</strong>} performed my custom action
    </span>
  );
};

export const myEventConfig = {
  icon: "⭐",
  renderAs: "line" as const,
};

export default MyEventPlugin;
```

2. **Register it in `index.ts`**:

```tsx
import MyEventPlugin, { myEventConfig } from "./MyEventPlugin";

export const eventPlugins: Record<TimelineItemType, EventPluginComponent> = {
  // ... existing plugins
  my_event: MyEventPlugin,
};

export const eventConfigs: Record<TimelineItemType, EventPluginConfig> = {
  // ... existing configs  
  my_event: myEventConfig,
};
```

3. **Add the type to your types file** (if it's a new event type):

```tsx
export type TimelineItemType =
  | "comment"
  | "status_change"
  // ... existing types
  | "my_event";
```

## Props Interface

All plugin components receive these props:

```tsx
interface EventPluginProps {
  event: TimelineEvent;      // The timeline event data
  data: TimelineItemData;    // The event's data payload
  timeInfo: TimeInfo;        // Formatted timestamp information
}

interface TimeInfo {
  date: string;    // "12/25/2023"
  time: string;    // "2:30 PM"  
  relative: string; // "5m ago"
}
```

## Styling

Plugins can use these CSS classes for consistent styling:

- `.old-value` / `.new-value` - For before/after values in changes
- `.reason` - For italic explanatory text
- `.commit-info` - For commit hashes and technical details
- `.actor` - Will be automatically styled for user mentions

## Best Practices

1. **Keep plugins focused** - Each plugin should handle one event type
2. **Use semantic HTML** - Structure content with proper tags
3. **Handle missing data gracefully** - Always provide fallbacks
4. **Follow the actor pattern** - Show who performed the action when relevant
5. **Be consistent with styling** - Use the provided CSS classes
6. **Test edge cases** - Handle empty, null, or malformed data

## Testing Plugins

Each plugin can be tested independently:

```tsx
import { render } from '@testing-library/react';
import MyEventPlugin from './MyEventPlugin';

test('renders my event correctly', () => {
  const mockEvent = {
    id: '1',
    type: 'created',
    timestamp: new Date().toISOString(),
    actor: 'user@example.com',
    data: { /* test data */ },
    originalEvent: { /* mock CloudEvent */ }
  };

  render(
    <MyEventPlugin 
      event={mockEvent} 
      data={mockEvent.data} 
      timeInfo={{ date: '12/25/2023', time: '2:30 PM', relative: '5m ago' }}
    />
  );
  
  // Add assertions
});
```

## Migration from Switch Statements

The old approach used a large switch statement in `TimelineItem.tsx`. The new plugin system provides:

- **Better separation of concerns** - Each event type is isolated
- **Easier testing** - Test plugins individually  
- **Simpler maintenance** - No massive switch statements
- **Better extensibility** - Add plugins without touching core code
- **Type safety** - Each plugin handles its own data types