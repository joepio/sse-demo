import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { CloudEvent, Issue } from "../types";

interface IssueWithActivity extends Issue {
  lastActivity?: string;
}

interface SSEContextType {
  events: CloudEvent[];
  issues: Record<string, IssueWithActivity>;
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
  const [issues, setIssues] = useState<Record<string, IssueWithActivity>>({});
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const eventSourceRef = useRef<EventSource | null>(null);

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

  // Process CloudEvent and update issues state
  const processCloudEvent = useCallback(
    (cloudEvent: CloudEvent) => {
      setIssues((prevIssues) => {
        const newIssues = { ...prevIssues };
        const eventTime = cloudEvent.time || new Date().toISOString();

        switch (cloudEvent.type) {
          case "com.example.issue.create":
            if (
              cloudEvent.data &&
              typeof cloudEvent.data === "object" &&
              cloudEvent.data !== null
            ) {
              const data = cloudEvent.data as Record<string, unknown>;
              if (data.id && typeof data.id === "string") {
                newIssues[data.id] = {
                  ...(data as Issue),
                  lastActivity: eventTime,
                };
              }
            }
            break;

          case "com.example.issue.patch":
            if (cloudEvent.subject && cloudEvent.data) {
              const issueId = cloudEvent.subject;
              if (newIssues[issueId]) {
                const patchedIssue = applyMergePatch(
                  newIssues[issueId],
                  cloudEvent.data,
                ) as IssueWithActivity;
                newIssues[issueId] = {
                  ...patchedIssue,
                  lastActivity: eventTime,
                };
              } else {
                // Create new issue if it doesn't exist
                const newIssue = { id: issueId };
                const patchedNewIssue = applyMergePatch(
                  newIssue,
                  cloudEvent.data,
                ) as IssueWithActivity;
                newIssues[issueId] = {
                  ...patchedNewIssue,
                  lastActivity: eventTime,
                };
              }
            }
            break;

          case "com.example.issue.delete":
            if (cloudEvent.subject) {
              delete newIssues[cloudEvent.subject];
            }
            break;

          // Handle timeline events that should update lastActivity
          default:
            if (cloudEvent.subject && newIssues[cloudEvent.subject]) {
              newIssues[cloudEvent.subject] = {
                ...newIssues[cloudEvent.subject],
                lastActivity: eventTime,
              };
            }
            break;
        }

        return newIssues;
      });
    },
    [applyMergePatch],
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

        // Update local state immediately for responsive UI
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
        console.log("Completing task:", taskId);

        // Update the original task to mark it as completed
        const taskUpdateEvent = {
          specversion: "1.0",
          id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: "frontend-user-action",
          subject: issueId,
          type: "https://api.example.com/events/timeline/item/updated/v1",
          time: new Date().toISOString(),
          datacontenttype: "application/merge-patch+json",
          data: {
            item_type: "task",
            item_id: taskId,
            actor: "user@gemeente.nl",
            timestamp: new Date().toISOString(),
            patch: {
              completed: true,
              completed_at: new Date().toISOString(),
            },
          },
        };

        console.log("Sending task update event:", taskUpdateEvent);
        await sendEvent(taskUpdateEvent);
        console.log("Task update completed successfully");
      } catch (error) {
        console.error("Error completing task:", error);
        throw error;
      }
    },
    [sendEvent],
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

      eventSource.addEventListener("open", () => {
        setConnectionStatus("connected");
      });

      eventSource.addEventListener("error", () => {
        setConnectionStatus("error");
        // EventSource will automatically reconnect
        setTimeout(() => setConnectionStatus("connecting"), 1000);
      });

      // Handle snapshot (initial full state)
      eventSource.addEventListener("snapshot", (e) => {
        try {
          let snapshotEvents = JSON.parse(e.data) as CloudEvent[];

          setEvents(snapshotEvents);

          // Process all events to build initial issues state
          const initialIssues: Record<string, IssueWithActivity> = {};
          const issueActivityMap: Record<string, string> = {};

          // First pass: track latest activity for each issue
          for (const event of snapshotEvents) {
            if (event.subject) {
              const eventTime = event.time || new Date().toISOString();
              if (
                !issueActivityMap[event.subject] ||
                eventTime > issueActivityMap[event.subject]
              ) {
                issueActivityMap[event.subject] = eventTime;
              }
            }
          }

          for (const event of snapshotEvents) {
            const eventTime = event.time || new Date().toISOString();

            switch (event.type) {
              case "com.example.issue.create":
                if (
                  event.data &&
                  typeof event.data === "object" &&
                  event.data !== null
                ) {
                  const data = event.data as Record<string, unknown>;
                  if (data.id && typeof data.id === "string") {
                    initialIssues[data.id] = {
                      ...(data as Issue),
                      lastActivity: issueActivityMap[data.id] || eventTime,
                    };
                  }
                }
                break;

              case "com.example.issue.patch":
                if (event.subject && event.data) {
                  const issueId = event.subject;
                  if (initialIssues[issueId]) {
                    const patchedExisting = applyMergePatch(
                      initialIssues[issueId],
                      event.data,
                    ) as IssueWithActivity;
                    initialIssues[issueId] = {
                      ...patchedExisting,
                      lastActivity: issueActivityMap[issueId] || eventTime,
                    };
                  } else {
                    const newIssue = { id: issueId };
                    const patchedNew = applyMergePatch(
                      newIssue,
                      event.data,
                    ) as IssueWithActivity;
                    initialIssues[issueId] = {
                      ...patchedNew,
                      lastActivity: issueActivityMap[issueId] || eventTime,
                    };
                  }
                }
                break;

              case "com.example.issue.delete":
                if (event.subject) {
                  delete initialIssues[event.subject];
                }
                break;
            }
          }

          setIssues(initialIssues);
        } catch (error) {
          console.error("Error processing snapshot:", error);
        }
      });

      // Handle deltas (live updates)
      eventSource.addEventListener("delta", (e) => {
        try {
          const cloudEvent = JSON.parse(e.data) as CloudEvent;

          // Add to events list
          setEvents((prevEvents) => [...prevEvents, cloudEvent]);

          // Process the event to update issues state
          processCloudEvent(cloudEvent);
        } catch (error) {
          console.error("Error processing delta:", error);
        }
      });
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [processCloudEvent, applyMergePatch]);

  const contextValue: SSEContextType = {
    events,
    issues,
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
