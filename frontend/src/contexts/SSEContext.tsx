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
          case "item.created":
            if (
              cloudEvent.data &&
              typeof cloudEvent.data === "object" &&
              cloudEvent.data !== null
            ) {
              const data = cloudEvent.data as Record<string, unknown>;
              if (data.item_type === "issue" && data.item_data) {
                const issueData = data.item_data as Record<string, unknown>;
                if (issueData.id && typeof issueData.id === "string") {
                  newIssues[issueData.id] = {
                    id: String(issueData.id),
                    title: String(issueData.title || ""),
                    description: issueData.description
                      ? String(issueData.description)
                      : null,
                    status: String(issueData.status || "open") as
                      | "open"
                      | "in_progress"
                      | "closed",
                    assignee: issueData.assignee
                      ? String(issueData.assignee)
                      : null,
                    created_at: String(
                      issueData.created_at || new Date().toISOString(),
                    ),
                    resolution: issueData.resolution
                      ? String(issueData.resolution)
                      : null,
                    lastActivity: eventTime,
                  };
                }
              }
            }
            break;

          case "item.updated":
            if (cloudEvent.subject && cloudEvent.data) {
              const data = cloudEvent.data as Record<string, unknown>;
              const issueId = cloudEvent.subject;

              if (data.item_type === "issue" && data.item_data) {
                if (newIssues[issueId]) {
                  const patchedIssue = applyMergePatch(
                    newIssues[issueId],
                    data.item_data,
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
                    data.item_data,
                  ) as IssueWithActivity;
                  newIssues[issueId] = {
                    ...patchedNewIssue,
                    lastActivity: eventTime,
                  };
                }
              }
            }
            break;

          case "item.deleted":
            if (cloudEvent.subject && cloudEvent.data) {
              const data = cloudEvent.data as Record<string, unknown>;
              if (data.item_type === "issue") {
                delete newIssues[cloudEvent.subject];
              }
            }
            break;

          case "system.reset":
            // System reset event - reload the page to get fresh state
            console.log("🔄 System reset event received - refreshing page");
            window.location.reload();
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

        // Don't add event locally - let it come back through SSE delta to avoid duplicates
        // Only update local state for immediate UI responsiveness
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
          type: "item.updated",
          time: new Date().toISOString(),
          datacontenttype: "application/merge-patch+json",
          data: {
            item_type: "task",
            item_id: taskId,
            actor: "user@gemeente.nl",
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
          const snapshotEvents = JSON.parse(e.data) as CloudEvent[];

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
              case "item.created":
                if (
                  event.data &&
                  typeof event.data === "object" &&
                  event.data !== null
                ) {
                  const data = event.data as Record<string, unknown>;
                  if (data.item_type === "issue" && data.item_data) {
                    const issueData = data.item_data as Record<string, unknown>;
                    if (issueData.id && typeof issueData.id === "string") {
                      initialIssues[issueData.id] = {
                        id: String(issueData.id),
                        title: String(issueData.title || ""),
                        description: issueData.description
                          ? String(issueData.description)
                          : null,
                        status: String(issueData.status || "open") as
                          | "open"
                          | "in_progress"
                          | "closed",
                        assignee: issueData.assignee
                          ? String(issueData.assignee)
                          : null,
                        created_at: String(
                          issueData.created_at || new Date().toISOString(),
                        ),
                        resolution: issueData.resolution
                          ? String(issueData.resolution)
                          : null,
                        lastActivity: eventTime,
                      };
                    }
                  }
                }
                break;

              case "item.updated":
                if (event.subject && event.data) {
                  const data = event.data as Record<string, unknown>;
                  const issueId = event.subject;

                  if (data.item_type === "issue" && data.item_data) {
                    if (initialIssues[issueId]) {
                      const patchedIssue = applyMergePatch(
                        initialIssues[issueId],
                        data.item_data,
                      ) as IssueWithActivity;
                      initialIssues[issueId] = {
                        ...patchedIssue,
                        lastActivity: eventTime,
                      };
                    } else {
                      // Create new issue if it doesn't exist
                      const newIssue = { id: issueId };
                      const patchedNewIssue = applyMergePatch(
                        newIssue,
                        data.item_data,
                      ) as IssueWithActivity;
                      initialIssues[issueId] = {
                        ...patchedNewIssue,
                        lastActivity: eventTime,
                      };
                    }
                  }
                }
                break;

              case "item.deleted":
                if (event.subject && event.data) {
                  const data = event.data as Record<string, unknown>;
                  if (data.item_type === "issue") {
                    delete initialIssues[event.subject];
                  }
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

          // Check for system reset event before processing
          if (cloudEvent.type === "system.reset") {
            console.log("🔄 System reset event received - refreshing page");
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
