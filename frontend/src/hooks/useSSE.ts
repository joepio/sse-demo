import { useState, useEffect, useCallback, useRef } from "react";
import type { CloudEvent, Issue } from "../types";

interface UseSSEResult {
  events: CloudEvent[];
  issues: Record<string, Issue>;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  sendEvent: (event: CloudEvent) => Promise<void>;
}

export const useSSE = (): UseSSEResult => {
  const [events, setEvents] = useState<CloudEvent[]>([]);
  const [issues, setIssues] = useState<Record<string, Issue>>({});
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const eventSourceRef = useRef<EventSource | null>(null);

  // Apply JSON Merge Patch (RFC 7396)
  const applyMergePatch = useCallback((target: any, patch: any): any => {
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

    const result = { ...target };

    for (const [key, value] of Object.entries(patch)) {
      if (value === null) {
        delete result[key];
      } else if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        value !== null
      ) {
        result[key] = applyMergePatch(target[key], value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }, []);

  // Process CloudEvent and update issues state
  const processCloudEvent = useCallback(
    (cloudEvent: CloudEvent) => {
      setIssues((prevIssues) => {
        const newIssues = { ...prevIssues };

        switch (cloudEvent.type) {
          case "com.example.issue.create":
            if (cloudEvent.data && cloudEvent.data.id) {
              newIssues[cloudEvent.data.id] = cloudEvent.data;
            }
            break;

          case "com.example.issue.patch":
            if (cloudEvent.subject && cloudEvent.data) {
              const issueId = cloudEvent.subject;
              if (newIssues[issueId]) {
                newIssues[issueId] = applyMergePatch(
                  newIssues[issueId],
                  cloudEvent.data,
                );
              } else {
                // Create new issue if it doesn't exist
                const newIssue = { id: issueId };
                newIssues[issueId] = applyMergePatch(
                  newIssue,
                  cloudEvent.data,
                ) as Issue;
              }
            }
            break;

          case "com.example.issue.delete":
            if (cloudEvent.subject) {
              delete newIssues[cloudEvent.subject];
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
          const initialIssues: Record<string, Issue> = {};
          for (const event of snapshotEvents) {
            switch (event.type) {
              case "com.example.issue.create":
                if (event.data && event.data.id) {
                  initialIssues[event.data.id] = event.data;
                }
                break;

              case "com.example.issue.patch":
                if (event.subject && event.data) {
                  const issueId = event.subject;
                  if (initialIssues[issueId]) {
                    initialIssues[issueId] = applyMergePatch(
                      initialIssues[issueId],
                      event.data,
                    );
                  } else {
                    const newIssue = { id: issueId };
                    initialIssues[issueId] = applyMergePatch(
                      newIssue,
                      event.data,
                    ) as Issue;
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

  return {
    events,
    issues,
    connectionStatus,
    sendEvent,
  };
};
