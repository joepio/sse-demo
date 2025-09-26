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

  // Extract issue data from CloudEvent
  const extractIssueData = useCallback(
    (cloudEvent: CloudEvent): Issue | null => {
      if (!cloudEvent.data || typeof cloudEvent.data !== "object") return null;

      const data = cloudEvent.data as Record<string, unknown>;
      if (data.item_type !== "issue" || !data.item_data) return null;

      const issueData = data.item_data as Record<string, unknown>;
      if (!issueData.id || typeof issueData.id !== "string") return null;

      return {
        id: String(issueData.id),
        title: String(issueData.title || ""),
        description: issueData.description
          ? String(issueData.description)
          : null,
        status: String(issueData.status || "open") as
          | "open"
          | "in_progress"
          | "closed",
        assignee: issueData.assignee ? String(issueData.assignee) : null,
        created_at: String(issueData.created_at || new Date().toISOString()),
        resolution: issueData.resolution ? String(issueData.resolution) : null,
      };
    },
    [],
  );

  // Handle issue creation events
  const handleIssueCreated = useCallback(
    (
      cloudEvent: CloudEvent,
      eventTime: string,
      issuesMap: Record<string, IssueWithActivity>,
    ): Record<string, IssueWithActivity> => {
      const newIssues = { ...issuesMap };
      const issueData = extractIssueData(cloudEvent);

      if (issueData) {
        newIssues[issueData.id] = {
          ...issueData,
          lastActivity: eventTime,
        };
      } else if (cloudEvent.subject && newIssues[cloudEvent.subject]) {
        // For non-issue items (comments, tasks, etc.), update the parent issue's lastActivity
        const data = cloudEvent.data as Record<string, unknown>;

        newIssues[cloudEvent.subject] = {
          ...newIssues[cloudEvent.subject],
          lastActivity: eventTime,
        };
      }

      return newIssues;
    },
    [extractIssueData],
  );

  // Handle issue update events
  const handleIssueUpdated = useCallback(
    (
      cloudEvent: CloudEvent,
      eventTime: string,
      issuesMap: Record<string, IssueWithActivity>,
    ): Record<string, IssueWithActivity> => {
      if (!cloudEvent.subject || !cloudEvent.data) return issuesMap;

      const newIssues = { ...issuesMap };
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
      } else if (newIssues[issueId]) {
        // For non-issue items (comments, tasks, etc.), update the parent issue's lastActivity

        newIssues[issueId] = {
          ...newIssues[issueId],
          lastActivity: eventTime,
        };
      }

      return newIssues;
    },
    [applyMergePatch],
  );

  // Handle issue deletion events
  const handleIssueDeleted = useCallback(
    (
      cloudEvent: CloudEvent,
      issuesMap: Record<string, IssueWithActivity>,
    ): Record<string, IssueWithActivity> => {
      if (!cloudEvent.subject || !cloudEvent.data) return issuesMap;

      const data = cloudEvent.data as Record<string, unknown>;
      if (data.item_type === "issue") {
        const newIssues = { ...issuesMap };
        delete newIssues[cloudEvent.subject];

        return newIssues;
      }

      return issuesMap;
    },
    [],
  );

  // Handle other timeline events that should update lastActivity
  const handleTimelineEvent = useCallback(
    (
      cloudEvent: CloudEvent,
      eventTime: string,
      issuesMap: Record<string, IssueWithActivity>,
    ): Record<string, IssueWithActivity> => {
      if (!cloudEvent.subject || !issuesMap[cloudEvent.subject])
        return issuesMap;

      const newIssues = { ...issuesMap };
      newIssues[cloudEvent.subject] = {
        ...newIssues[cloudEvent.subject],
        lastActivity: eventTime,
      };

      return newIssues;
    },
    [],
  );

  // Process a single CloudEvent and update issues state
  const processCloudEvent = useCallback(
    (cloudEvent: CloudEvent) => {
      setIssues((prevIssues) => {
        const eventTime = cloudEvent.time || new Date().toISOString();

        switch (cloudEvent.type) {
          case "item.created":
            return handleIssueCreated(cloudEvent, eventTime, prevIssues);

          case "item.updated":
            return handleIssueUpdated(cloudEvent, eventTime, prevIssues);

          case "item.deleted":
            return handleIssueDeleted(cloudEvent, prevIssues);

          case "system.reset":
            window.location.reload();
            return prevIssues;

          default:
            return handleTimelineEvent(cloudEvent, eventTime, prevIssues);
        }
      });
    },
    [
      handleIssueCreated,
      handleIssueUpdated,
      handleIssueDeleted,
      handleTimelineEvent,
    ],
  );

  // Build activity map to track latest activity per issue
  const buildActivityMap = useCallback(
    (events: CloudEvent[]): Record<string, string> => {
      const activityMap: Record<string, string> = {};

      for (const event of events) {
        if (event.subject) {
          const eventTime = event.time || new Date().toISOString();
          if (
            !activityMap[event.subject] ||
            eventTime > activityMap[event.subject]
          ) {
            activityMap[event.subject] = eventTime;
          }
        }
      }

      return activityMap;
    },
    [],
  );

  // Process snapshot events to build initial state
  const processSnapshot = useCallback(
    (snapshotEvents: CloudEvent[]): Record<string, IssueWithActivity> => {
      const initialIssues: Record<string, IssueWithActivity> = {};
      const activityMap = buildActivityMap(snapshotEvents);

      for (const event of snapshotEvents) {
        const eventTime = event.time || new Date().toISOString();

        switch (event.type) {
          case "item.created": {
            const issueData = extractIssueData(event);
            if (issueData) {
              const lastActivity = activityMap[issueData.id] || eventTime;
              initialIssues[issueData.id] = {
                ...issueData,
                lastActivity,
              };
            }
            break;
          }

          case "item.updated": {
            if (event.subject && event.data) {
              const data = event.data as Record<string, unknown>;
              const issueId = event.subject;

              if (data.item_type === "issue" && data.item_data) {
                const lastActivity = activityMap[issueId] || eventTime;

                if (initialIssues[issueId]) {
                  const patchedIssue = applyMergePatch(
                    initialIssues[issueId],
                    data.item_data,
                  ) as IssueWithActivity;
                  initialIssues[issueId] = {
                    ...patchedIssue,
                    lastActivity,
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
                    lastActivity,
                  };
                }
              }
            }
            break;
          }

          case "item.deleted": {
            if (event.subject && event.data) {
              const data = event.data as Record<string, unknown>;
              if (data.item_type === "issue") {
                delete initialIssues[event.subject];
              }
            }
            break;
          }
        }
      }

      return initialIssues;
    },
    [applyMergePatch, extractIssueData, buildActivityMap],
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
        const taskUpdateEvent: CloudEvent = {
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
      } catch (error) {
        console.error("Error completing task:", error);
        throw error;
      }
    },
    [sendEvent],
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
          const initialIssues = processSnapshot(snapshotEvents);
          setIssues(initialIssues);
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
