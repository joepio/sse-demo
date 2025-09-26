# Testing

This project uses Vitest for testing the frontend components and SSE functionality.

## Running Tests

### Prerequisites

Make sure you have installed dependencies:

```bash
npm install
```

### Test Commands

```bash
# Run tests once
npm run test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with UI (opens browser interface)
npm run test:ui
```

## Test Structure

Tests are located in `frontend/src/__tests__/` and follow the naming convention `*.test.tsx`.

### Key Test Files

- `example.test.tsx` - Simple example tests to verify setup
- `SSEContext.test.tsx` - Comprehensive tests for the SSE context functionality

## What's Tested

### SSEContext Tests

The SSEContext tests cover:

- **Connection Management**: SSE connection lifecycle, error handling
- **Snapshot Processing**: Initial data loading, issue creation from historical events
- **Delta Processing**: Real-time updates, issue creation/updates/deletion
- **Event Sending**: Posting events to server, error handling
- **Task Completion**: Task completion functionality
- **Edge Cases**: Malformed data, missing fields, error scenarios

### Test Features

- **Mock EventSource**: Custom EventSource implementation for testing SSE
- **Mock Fetch**: Simulated HTTP requests
- **Activity Map Testing**: Ensures `lastActivity` is correctly calculated
- **Real-time Updates**: Tests that comments and other events update issue timestamps
- **Error Scenarios**: Network failures, malformed data, connection issues

## Test Patterns

### Testing SSE Events

```typescript
// Create test events
const issueEvent = createIssueEvent('issue-1', 'Test Issue');
const commentEvent = createCommentEvent('issue-1', 'comment-1', 'Test comment');

// Simulate receiving events
mockEventSource.simulateSnapshot([issueEvent]);
mockEventSource.simulateDelta(commentEvent);
```

### Testing Component State

```typescript
// Check issue count
expect(screen.getByTestId('issues-count')).toHaveTextContent('2');

// Check specific issue data
expect(screen.getByTestId('issue-issue-1-title')).toHaveTextContent('Test Issue');
expect(screen.getByTestId('issue-issue-1-lastActivity')).toHaveTextContent(timestamp);
```

## Debugging Tests

- Use `screen.debug()` to see the current DOM state
- Add `console.log` statements in test code (will be visible in test output)
- Use `waitFor()` for async operations
- Use `act()` when triggering events that cause state changes

## Coverage

The tests focus on:
- Core SSE functionality ✅
- Event processing logic ✅
- State management ✅
- Error handling ✅
- Real-time update behavior ✅

## Adding New Tests

When adding new features:

1. Create test cases in the appropriate `describe` block
2. Use the helper functions (`createIssueEvent`, `createCommentEvent`) 
3. Test both success and error scenarios
4. Verify state changes with `screen.getByTestId()` assertions
5. Use `waitFor()` for async operations

## CI/CD

Tests can be run in CI environments with:

```bash
npm run test -- --run --reporter=verbose
```

The `--run` flag ensures tests run once without watch mode.