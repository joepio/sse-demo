import type React from "react";
import { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { SSEProvider, useSSE } from "./contexts/SSEContext";
import ConnectionStatus from "./components/ConnectionStatus";
import CreateIssueForm from "./components/CreateIssueForm";
import GitHubTimeline from "./components/GitHubTimeline";
import Modal from "./components/Modal";
import { formatRelativeTime } from "./utils/time";
import { getLatestTaskForIssue } from "./utils/taskUtils";

import type { CloudEvent, Issue } from "./types";
import "./App.css";

const ZakenDashboard: React.FC = () => {
  const { issues, events, connectionStatus, sendEvent } = useSSE();
  const [animatingIssues, setAnimatingIssues] = useState<Set<string>>(
    new Set(),
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const prevIssuesRef = useRef<Record<string, Issue>>({});

  // Track which issues are new for animation
  useEffect(() => {
    const currentIssueIds = new Set(Object.keys(issues));
    const prevIssueIds = new Set(Object.keys(prevIssuesRef.current));

    const newIssues = new Set(
      [...currentIssueIds].filter((id) => !prevIssueIds.has(id)),
    );

    if (newIssues.size > 0) {
      setAnimatingIssues((prev) => new Set([...prev, ...newIssues]));

      // Remove animation class after animation completes
      setTimeout(() => {
        setAnimatingIssues((prev) => {
          const updated = new Set(prev);
          newIssues.forEach((id) => {
            updated.delete(id);
          });
          return updated;
        });
      }, 500);
    }

    prevIssuesRef.current = issues;
  }, [issues]);

  const handleCreateIssue = async (event: CloudEvent) => {
    await sendEvent(event);
    setIsCreateModalOpen(false);
  };

  const issueEntries = Object.entries(issues).sort((a, b) => {
    const [, issueA] = a;
    const [, issueB] = b;

    // Sort by lastActivity (newest first), fallback to created_at
    const timeA = issueA.lastActivity || issueA.created_at || "1970-01-01";
    const timeB = issueB.lastActivity || issueB.created_at || "1970-01-01";

    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });

  return (
    <div className="app">
      <header>
        <h1>Mijn Zaken</h1>
        <p>
          {issueEntries.length} {issueEntries.length !== 1 ? "zaken" : "zaak"}{" "}
          opgebouwd uit events
        </p>
        <ConnectionStatus status={connectionStatus} />
      </header>

      <main>
        <div className="zaken-list">
          {issueEntries.length === 0 ? (
            <p>Geen zaken gevonden.</p>
          ) : (
            issueEntries.map(([id, issue]) => {
              const latestTask = getLatestTaskForIssue(events, id);

              return (
                <div
                  key={id}
                  className={`zaak-item ${animatingIssues.has(id) ? "new" : ""}`}
                  data-issue-id={id}
                >
                  <Link to={`/zaak/${id}`} className="zaak-content">
                    <div className="zaak-link">
                      {issue.title || "Zaak zonder titel"}
                    </div>
                    <div className="zaak-time">
                      {formatRelativeTime(
                        issue.lastActivity ||
                          issue.created_at ||
                          new Date().toISOString(),
                      )}
                    </div>
                  </Link>

                  {latestTask && (
                    <div className="zaak-task-indicator">
                      <span className="task-indicator-badge">
                        📋 Actieve taak
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
          style={{ marginTop: "2rem" }}
        >
          + Nieuwe Zaak Aanmaken
        </button>
      </main>

      {/* Create Zaak Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nieuwe Zaak Aanmaken"
        maxWidth="600px"
      >
        <CreateIssueForm onCreateIssue={handleCreateIssue} />
      </Modal>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SSEProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ZakenDashboard />} />
          <Route path="/zaak/:zaakId" element={<GitHubTimeline />} />
        </Routes>
      </Router>
    </SSEProvider>
  );
};

export default App;
