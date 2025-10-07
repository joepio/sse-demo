import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { CloudEvent, Issue } from "../types";
import { useActor } from "./ActorContext";
import { createTaskCompletionEvent } from "../utils/taskUtils";

interface IssueWithActivity extends Issue {
  lastActivity?: string;
}

interface SSEContextType {
  events: CloudEvent[];
  issues: Record<string, IssueWithActivity>;
  items: Record<string, Record<string, unknown>>; // Unified item store for all item types
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  sendEvent: (event: CloudEvent) => Promise<void>;
  completeTask: (taskId: string, issueId?: string) => Promise<void>;
}

const SSEContext = createContext<SSEContextType | undefined>(undefined);

interface SSEProviderProps {
  children: ReactNode;
}

export const SSEProvider: React.FC<SSEProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<CloudEvent[]>([]);
  const [items, setItems] = useState<Record<string, Record<string, unknown>>>(
    {},
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const eventSourceRef = useRef<EventSource | null>(null);
  const { actor } = useActor();

  // Derive issues from items store with lastActivity calculated from events
  const issues = useMemo(() => {
    const issuesMap: Record<string, IssueWithActivity> = {};
    const activityMap: Record<string, string> = {};
    const creationMap: Record<string, string> = {}; // To store creation time

    // Build activity and creation map from events
    for (const event of events) {
      if (event.subject) {
        const eventTime = event.time || new Date().toISOString();
        if (
          !activityMap[event.subject] ||
          eventTime > activityMap[event.subject]
        ) {
          activityMap[event.subject] = eventTime;
        }
        // Store the first event time as creation time
        if (!creationMap[event.subject]) {
          creationMap[event.subject] = eventTime;
        }
      }
    }

    // Extract issues from items and add lastActivity
    for (const [itemId, itemData] of Object.entries(items)) {
      // Check if this is an issue (issues have their ID as the item_id)
      if (itemData.status && itemData.title) {
        const issue = itemData as unknown as Issue;
        issuesMap[itemId] = {
          ...issue,
          lastActivity: activityMap[itemId] || creationMap[itemId],
        };
      }
    }

    return issuesMap;
  }, [items, events]);

  // Apply JSON Merge Patch (RFC 7396)
  const applyMergePatch = useCallback(
    (target: unknown, patch: unknown): unknown => {
      if (patch === null || typeof patch !== "object" || Array.isArray(patch)) {
        return patch;
      }

      if (
        target === null ||
        typeof target !== "object" ||
        Array.isArray(target)
      ) {
        target = {};
      }

      const result = { ...(target as Record<string, unknown>) };

      for (const [key, value] of Object.entries(
        patch as Record<string, unknown>,
      )) {
        if (value === null) {
          delete result[key];
        } else if (
          typeof value === "object" &&
          !Array.isArray(value) &&
          value !== null
        ) {
          result[key] = applyMergePatch(
            (target as Record<string, unknown>)[key],
            value,
          );
        } else {
          result[key] = value;
        }
      }

      return result;
    },
    [],
  );

  // Process a single CloudEvent into items store
  const processCloudEventToItems = useCallback(
    (
      cloudEvent: CloudEvent,
      items: Record<string, Record<string, unknown>>,
    ) => {
      if (!cloudEvent.data) return items;

      const JSONCommit = cloudEvent.data as Record<string, unknown>;
      const resourceId = (JSONCommit.resource_id ||
        JSONCommit.item_id) as string;
      if (!resourceId) return items;

      const newItems = { ...items };

      // Handle both old event types and new json.commit type
      if (cloudEvent.type === "json.commit") {
        const resourceData = JSONCommit.resource_data || JSONCommit.item_data;
        const patch = JSONCommit.patch;
        const deleted = JSONCommit.deleted;

        // Check if this is a deletion
        if (deleted === true) {
          delete newItems[resourceId];
        }
        // If resource_data exists, it's a create (full resource)
        else if (resourceData) {
          newItems[resourceId] = resourceData as Record<string, unknown>;
        }
        // If patch exists, apply it to existing resource or create new one
        else if (patch) {
          if (newItems[resourceId]) {
            const patched = applyMergePatch(
              newItems[resourceId],
              patch,
            ) as Record<string, unknown>;
            newItems[resourceId] = patched;
          } else {
            // Resource doesn't exist yet, create it with the patch data
            const patchData = patch as Record<string, unknown>;
            newItems[resourceId] = patchData;
          }
        }
      }

      return newItems;
    },
    [applyMergePatch],
  );

  // Process items (comments, tasks, planning, documents, etc.) into unified items store
  const processItemEvent = useCallback(
    (cloudEvent: CloudEvent) => {
      setItems((prevItems) => processCloudEventToItems(cloudEvent, prevItems));
    },
    [processCloudEventToItems],
  );

  // Process a single CloudEvent
  const processCloudEvent = useCallback(
    (cloudEvent: CloudEvent) => {
      // Process all items into the unified items store
      processItemEvent(cloudEvent);

      // Handle system reset
      if (cloudEvent.type === "system.reset") {
        window.location.reload();
      }
    },
    [processItemEvent],
  );

  // Process snapshot events to build initial state
  const processSnapshot = useCallback(
    (snapshotEvents: CloudEvent[]) => {
      let initialItems: Record<string, Record<string, unknown>> = {};

      for (const event of snapshotEvents) {
        initialItems = processCloudEventToItems(event, initialItems);
      }

      // Set the items state (issues will be derived from this)
      setItems(initialItems);
    },
    [processCloudEventToItems],
  );

  // Send CloudEvent to server
  const sendEvent = useCallback(
    async (event: CloudEvent) => {
      try {
        const response = await fetch("/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });

        if (!response.ok) {
          throw new Error(`Failed to send event: ${response.statusText}`);
        }

        // Process the event locally for immediate UI responsiveness
        processCloudEvent(event);
      } catch (error) {
        console.error("Error sending event:", error);
        throw error;
      }
    },
    [processCloudEvent],
  );

  // Complete a task
  const completeTask = useCallback(
    async (taskId: string, issueId?: string) => {
      try {
        if (!issueId) {
          throw new Error("Issue ID is required to complete a task");
        }

        const taskUpdateEvent = createTaskCompletionEvent(
          taskId,
          issueId,
          actor,
        );
        await sendEvent(taskUpdateEvent);
      } catch (error) {
        console.error("Error completing task:", error);
        throw error;
      }
    },
    [sendEvent, actor],
  );

  // Setup SSE connection handlers
  const setupEventSourceHandlers = useCallback(
    (eventSource: EventSource) => {
      eventSource.addEventListener("open", () => {
        setConnectionStatus("connected");
      });

      eventSource.addEventListener("error", () => {
        setConnectionStatus("error");
        setTimeout(() => setConnectionStatus("connecting"), 1000);
      });

      // Handle snapshot (initial full state)
      eventSource.addEventListener("snapshot", (e) => {
        try {
          const snapshotEvents = JSON.parse(e.data) as CloudEvent[];
          setEvents(snapshotEvents);
          processSnapshot(snapshotEvents);
        } catch (error) {
          console.error("Error processing snapshot:", error);
        }
      });

      // Handle deltas (live updates)
      eventSource.addEventListener("delta", (e) => {
        try {
          const cloudEvent = JSON.parse(e.data) as CloudEvent;

          // Check for system reset event
          if (cloudEvent.type === "system.reset") {
            window.location.reload();
            return;
          }

          // Add to events list
          setEvents((prevEvents) => [...prevEvents, cloudEvent]);

          // Process the event to update issues state
          processCloudEvent(cloudEvent);
        } catch (error) {
          console.error("Error processing delta:", error);
        }
      });
    },
    [processSnapshot, processCloudEvent],
  );

  // Connect to SSE endpoint
  useEffect(() => {
    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setConnectionStatus("connecting");

      const eventSource = new EventSource("/events");
      eventSourceRef.current = eventSource;

      setupEventSourceHandlers(eventSource);
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [setupEventSourceHandlers]);

  const contextValue: SSEContextType = {
    events,
    issues,
    items,
    connectionStatus,
    sendEvent,
    completeTask,
  };

  return (
    <SSEContext.Provider value={contextValue}>{children}</SSEContext.Provider>
  );
};

export const useSSE = (): SSEContextType => {
  const context = useContext(SSEContext);
  if (context === undefined) {
    throw new Error("useSSE must be used within an SSEProvider");
  }
  return context;
};
