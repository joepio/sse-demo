import React, { useEffect, useRef } from "react";
import { useSSE } from "./hooks/useSSE";
import ConnectionStatus from "./components/ConnectionStatus";
import CreateIssueForm from "./components/CreateIssueForm";

import IssuesList from "./components/IssuesList";
import CloudEventsStream from "./components/CloudEventsStream";
import type { CloudEvent } from "./types";
import "./App.css";

const App: React.FC = () => {
  const { events, issues, connectionStatus, sendEvent } = useSSE();
  const [snapshotEvents, setSnapshotEvents] = React.useState<CloudEvent[]>([]);
  const [liveEvents, setLiveEvents] = React.useState<CloudEvent[]>([]);
  const [hasReceivedSnapshot, setHasReceivedSnapshot] = React.useState(false);
  const eventsProcessedRef = useRef(0);

  // Separate snapshot from live events
  useEffect(() => {
    if (!hasReceivedSnapshot && events.length > 0) {
      setSnapshotEvents(events);
      setHasReceivedSnapshot(true);
      eventsProcessedRef.current = events.length;
    } else if (
      hasReceivedSnapshot &&
      events.length > eventsProcessedRef.current
    ) {
      const newEvents = events.slice(eventsProcessedRef.current);
      setLiveEvents((prev) => [...prev, ...newEvents]);
      eventsProcessedRef.current = events.length;
    }
  }, [events, hasReceivedSnapshot]);

  const handleCreateIssue = async (event: CloudEvent) => {
    await sendEvent(event);
  };

  const handlePatchIssue = async (event: CloudEvent) => {
    await sendEvent(event);

    // Trigger shine effect on the updated issue
    if (event.subject) {
      setTimeout(() => {
        const issueCard = document.querySelector(
          `[data-issue-id="${event.subject}"]`,
        );
        if (issueCard) {
          issueCard.classList.add("issue-shine");
          setTimeout(() => {
            issueCard.classList.remove("issue-shine");
          }, 1000);
        }
      }, 100);
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    const cloudEvent: CloudEvent = {
      specversion: "1.0",
      id: crypto.randomUUID(),
      source: "/issues",
      subject: issueId,
      type: "com.example.issue.delete",
      time: new Date().toISOString(),
      datacontenttype: "application/json",
      data: {
        id: issueId,
        reason: "manually deleted",
      },
    };

    await sendEvent(cloudEvent);
  };

  return (
    <div className="app">
      <header style={{ marginBottom: "2rem" }}>
        <h1>SSE CloudEvents with Issue Patching</h1>
        <p style={{ marginBottom: "1rem", color: "#666" }}>
          Real-time CloudEvents stream showing immutable events. Use the Issue
          Patcher to modify business objects via JSON Merge Patch.
        </p>
        <ConnectionStatus status={connectionStatus} />
      </header>

      <main>
        {/* Current Issues Display */}
        <IssuesList
          issues={issues}
          onDeleteIssue={handleDeleteIssue}
          onPatchIssue={handlePatchIssue}
        />

        {/* Create New Issue Form */}
        <CreateIssueForm onCreateIssue={handleCreateIssue} />

        {/* CloudEvents Stream - Snapshot */}
        {snapshotEvents.length > 0 && (
          <div style={{ marginTop: "2rem" }}>
            <h3>Historical CloudEvents (Snapshot)</h3>
            <p
              style={{
                marginBottom: "1rem",
                color: "#666",
                fontSize: "0.9rem",
              }}
            >
              Initial state loaded from server - these events built the current
              issues state
            </p>
            <CloudEventsStream
              events={snapshotEvents}
              isSnapshot={true}
              showHeader={false}
            />
          </div>
        )}

        {/* CloudEvents Stream - Live */}
        {(liveEvents.length > 0 || hasReceivedSnapshot) && (
          <div style={{ marginTop: "2rem" }}>
            <div
              style={{
                background: "#007bff",
                color: "white",
                borderRadius: "4px",
                padding: "0.5rem",
                margin: "1rem 0",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              🔴 Live CloudEvents Stream
            </div>
            <p
              style={{
                marginBottom: "1rem",
                color: "#666",
                fontSize: "0.9rem",
              }}
            >
              New events appear in real-time via Server-Sent Events
            </p>
            <CloudEventsStream
              events={liveEvents}
              isSnapshot={false}
              showHeader={false}
            />
          </div>
        )}

        {!hasReceivedSnapshot && (
          <div
            style={{ marginTop: "2rem", textAlign: "center", color: "#666" }}
          >
            <p>Loading initial data...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
