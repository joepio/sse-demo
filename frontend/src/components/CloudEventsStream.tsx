import React, { useRef, useEffect } from "react";
import type { CloudEvent } from "../types";

interface CloudEventsStreamProps {
  events: CloudEvent[];
  isSnapshot: boolean;
  showHeader?: boolean;
}

const CloudEventsStream: React.FC<CloudEventsStreamProps> = ({
  events,
  isSnapshot,
  showHeader = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (containerRef.current && !isSnapshot) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events.length, isSnapshot]);

  const renderCloudEvent = (cloudEvent: CloudEvent, index: number) => (
    <li
      key={`${cloudEvent.id}-${index}`}
      style={{
        margin: "0.5rem 0",
        padding: "0.75rem",
        backgroundColor: "#fff",
        borderRadius: "6px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        animation: !isSnapshot ? "fadeIn 0.3s ease-in" : undefined,
        opacity: isSnapshot ? 0.8 : 1,
      }}
    >
      <pre
        style={{
          margin: 0,
          fontFamily: "monospace",
          fontSize: "0.85rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {JSON.stringify(cloudEvent, null, 2)}
      </pre>
    </li>
  );

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        style={{
          marginTop: showHeader ? "2rem" : "0",
        }}
      >
        {showHeader && (
          <>
            <h3>Live CloudEvents Stream</h3>
            <p
              style={{
                marginBottom: "1rem",
                color: "#666",
                fontSize: "0.9rem",
              }}
            >
              Immutable event log - new events appear in real-time via SSE
            </p>
          </>
        )}

        <div
          ref={containerRef}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            height: "400px",
            overflowY: "auto",
            padding: "1rem",
            backgroundColor: "#f9f9f9",
            marginBottom: "1rem",
          }}
        >
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {events.length > 0 && isSnapshot && (
              <li
                style={{
                  margin: "0.5rem 0",
                }}
              >
                <div
                  style={{
                    background: "#e9ecef",
                    borderRadius: "4px",
                    padding: "0.5rem",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                    color: "#495057",
                    textAlign: "center",
                  }}
                >
                  📸 Snapshot: {events.length} existing CloudEvents
                </div>
              </li>
            )}

            {events.map((event, index) => renderCloudEvent(event, index))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default CloudEventsStream;
