# Timeline Visual Mockup

## Timeline Modal Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Timeline for Issue #1                        × │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filter by type: [All Events (6)                             ▼] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─🏠─┐   ┌───────────────────────────────────────────────────────────────┐   │
│ │ 📝 │◄──┤ Issue Created                         alice@example.com • 2h ago │   │
│ └─|─┘   │                                                               │   │
│   |     │ Login system failing                                          │   │
│   |     │ Users cannot authenticate                                     │   │
│   |     │                                                               │   │
│   |     │ Status: open • Priority: high • Assigned to: alice@example.com│   │
│   |     │ Event ID: a1b2c3d4                                            │   │
│   |     └───────────────────────────────────────────────────────────────┘   │
│   |                                                                         │
│ ┌─|─┐   ┌───────────────────────────────────────────────────────────────┐   │
│ │ 💬 │◄──┤ Comment                            alice@example.com • 70m ago │   │
│ └─|─┘   │                                                               │   │
│   |     │ I'm investigating this authentication issue. Will check the   │   │
│   |     │ session timeout settings.                                     │   │
│   |     │                                                               │   │
│   |     │ Mentions: @bob                                                │   │
│   |     │ Event ID: b2c3d4e5                                            │   │
│   |     └───────────────────────────────────────────────────────────────┘   │
│   |                                                                         │
│ ┌─|─┐   ┌───────────────────────────────────────────────────────────────┐   │
│ │ 🔄 │◄──┤ Status Change                      bob@example.com • 65m ago  │   │
│ └─|─┘   │                                                               │   │
│   |     │ Changed status from open to in_progress                       │   │
│   |     │ Reason: Starting investigation                                │   │
│   |     │                                                               │   │
│   |     │ Event ID: c3d4e5f6                                            │   │
│   |     └───────────────────────────────────────────────────────────────┘   │
│   |                                                                         │
│ ┌─|─┐   ┌───────────────────────────────────────────────────────────────┐   │
│ │ 🤖 │◄──┤ AI Analysis                      system@example.com • 60m ago │   │
│ └─|─┘   │                                                               │   │
│   |     │ Prompt: Analyze this authentication issue and provide         │   │
│   |     │ recommendations                                               │   │
│   |     │                                                               │   │
│   |     │ ┌─────────────────────────────────────────────────────────┐   │   │
│   |     │ │ Response:                                               │   │   │
│   |     │ │ This appears to be related to session timeout          │   │   │
│   |     │ │ configuration. The authentication system is likely     │   │   │
│   |     │ │ expiring sessions too quickly, causing users to be     │   │   │
│   |     │ │ logged out unexpectedly.                               │   │   │
│   |     │ └─────────────────────────────────────────────────────────┘   │   │
│   |     │                                                               │   │
│   |     │ Model: gpt-4 • Confidence: 87%                               │   │
│   |     │ Event ID: d4e5f6g7                                            │   │
│   |     └───────────────────────────────────────────────────────────────┘   │
│   |                                                                         │
│ ┌─|─┐   ┌───────────────────────────────────────────────────────────────┐   │
│ │ 💬 │◄──┤ Comment                            alice@example.com • 55m ago │   │
│ └─|─┘   │                                                               │   │
│   |     │ Found the issue! The session timeout was set to 5 minutes    │   │
│   |     │ instead of 30 minutes.                                       │   │
│   |     │                                                               │   │
│   |     │ Event ID: e5f6g7h8                                            │   │
│   |     └───────────────────────────────────────────────────────────────┘   │
│   |                                                                         │
│ ┌─|─┐   ┌───────────────────────────────────────────────────────────────┐   │
│ │ ✏️ │◄──┤ Comment Updated                    alice@example.com • 50m ago │   │
│ └───┘   │                                                               │   │
│         │ I'm investigating this authentication issue. Will check the   │   │
│         │ session timeout settings. UPDATE: Found some relevant logs    │   │
│         │ in the auth service.                                          │   │
│         │                                                               │   │
│         │ Edited 50m ago                                                │   │
│         │ Event ID: f6g7h8i9                                            │   │
│         └───────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                        Showing 6 of 6 events                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Filter Dropdown Options

```
┌─────────────────────────────────────┐
│ All Events (6)                      │
├─────────────────────────────────────┤
│ Comment (3)                         │
│ Issue Created (1)                   │
│ Llm Analysis (1)                    │
│ Status Change (1)                   │
└─────────────────────────────────────┘
```

## Issue Card with Timeline Button

```
┌───────────────────────────────────────────────────────────────────────────┐
│ 📝 Login system failing                                             #1    │
│                                                                           │
│ Users cannot authenticate                                                 │
│                                                                           │
│ Status: in_progress  Assignee: alice@example.com  Priority: high         │
│ Created: 1/11/2024                                                       │
│                                                                           │
│                                          [📅 Timeline] [Delete] │
└───────────────────────────────────────────────────────────────────────────┘
```

## Mobile Timeline View

```
┌─────────────────────────────────────┐
│ Timeline for Issue #1          × │
├─────────────────────────────────────┤
│ Filter: [All Events (6)       ▼] │
├─────────────────────────────────────┤
│                                     │
│ 📝 Issue Created        2h ago      │
│ ┌─────────────────────────────────┐ │
│ │ Login system failing            │ │
│ │ Status: open • Priority: high   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 💬 Comment             70m ago      │
│ ┌─────────────────────────────────┐ │
│ │ I'm investigating this auth...  │ │
│ │ Mentions: @bob                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🔄 Status Change       65m ago      │
│ ┌─────────────────────────────────┐ │
│ │ open → in_progress              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🤖 AI Analysis         60m ago      │
│ ┌─────────────────────────────────┐ │
│ │ Session timeout issue likely... │ │
│ │ Model: gpt-4 • Confidence: 87% │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│        Showing 6 of 6 events       │
└─────────────────────────────────────┘
```

## Color-Coded Event Icons

- **📝 Issue Created** - Green background (#e8f5e8)
- **✏️ Issue Updated** - Orange background (#fff3e0)  
- **🗑️ Issue Deleted** - Red background (#ffebee)
- **💬 Comment** - Blue background (#e3f2fd)
- **🔄 Status Change** - Orange background (#fff3e0)
- **🤖 AI Analysis** - Purple background (#f3e5f5)
- **🚀 Deployment** - Green background (#e8f5e8)
- **⚙️ System Event** - Gray background (#f5f5f5)

## Timeline Features Demonstrated

✅ **Chronological Order** - Events sorted by timestamp
✅ **Visual Timeline** - Connected line with icons
✅ **Event Filtering** - Dropdown with counts
✅ **Rich Content** - Context-appropriate information
✅ **Actor Attribution** - Who performed each action
✅ **Relative Timestamps** - "2h ago", "70m ago", etc.
✅ **Responsive Design** - Works on desktop and mobile
✅ **Modal Interface** - Clean overlay presentation
✅ **Event Types** - Multiple supported event categories
✅ **Real-time Updates** - Live event stream integration