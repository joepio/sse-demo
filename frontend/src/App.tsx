import type React from "react";
import { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ApiDocumentationView from "./components/ApiDocumentationView";
import { SSEProvider, useSSE } from "./contexts/SSEContext";
import ConnectionStatus from "./components/ConnectionStatus";
import CreateIssueForm from "./components/CreateIssueForm";
import IssueTimeline from "./components/IssueTimeline";
import Modal from "./components/Modal";
import ActionButton from "./components/ActionButton";
import { formatRelativeTime } from "./utils/time";
import { getLatestTaskForIssue } from "./utils/taskUtils";
import DeadlineBadge from "./components/DeadlineBadge";
import PlanningStatusBadge from "./components/PlanningStatusBadge";
import { shouldShowPlanningStatus } from "./utils/planningUtils";

import type { CloudEvent, Issue } from "./types";
import "./App.css";

const ZakenDashboard: React.FC = () => {
  const { issues, events, connectionStatus, sendEvent, completeTask } =
    useSSE();
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
    <div
      className="min-h-screen p-4 md:p-2"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <header
        className="text-center mb-12 py-12 md:py-8 border-b"
        style={{ borderColor: "var(--border-secondary)" }}
      >
        {/* Navigation */}
        <nav className="mb-6">
          <div className="flex justify-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--text-secondary)" }}
            >
              Dashboard
            </Link>
            <Link
              to="/api-docs"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--text-secondary)" }}
            >
              API Documentatie
            </Link>
          </div>
        </nav>

        <h1
          className="mb-6 text-5xl md:text-4xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Mijn Zaken
          <ConnectionStatus status={connectionStatus} />
        </h1>
        <p
          className="text-lg leading-relaxed max-w-3xl mx-auto mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          Een simpel zaaksysteem met realtime updates en interactieve
          visualisaties.
        </p>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-6 md:gap-4 mb-8">
          {issueEntries.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>
              Geen zaken gevonden.
            </p>
          ) : (
            issueEntries.map(([id, issue]) => {
              const latestTask = getLatestTaskForIssue(events, id);
              const showPlanning = shouldShowPlanningStatus(events, id);

              return (
                <div
                  key={id}
                  className={`zaak-item-hover rounded-md p-6 md:p-4 border transition-all duration-150 block no-underline ${
                    animatingIssues.has(id) ? "animate-timeline-appear" : ""
                  }`}
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    borderColor: "var(--border-primary)",
                  }}
                  data-issue-id={id}
                >
                  <Link
                    to={`/zaak/${id}`}
                    className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-2 no-underline group"
                  >
                    <div
                      className="zaak-link font-semibold text-xl md:text-lg leading-tight flex-1 min-w-0 no-underline"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {issue.title || "Zaak zonder titel"}
                    </div>
                    <div
                      className="text-sm font-normal whitespace-nowrap flex-shrink-0 opacity-80 group-hover:opacity-100 md:self-end"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {formatRelativeTime(
                        issue.lastActivity ||
                          issue.created_at ||
                          new Date().toISOString(),
                      )}
                    </div>
                  </Link>

                  {(showPlanning || (latestTask && !latestTask.completed)) && (
                    <div className="mt-4 md:mt-3 space-y-3">
                      {/* Planning Status */}
                      {showPlanning && (
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <PlanningStatusBadge
                            events={events}
                            issueId={id}
                            variant="compact"
                          />
                        </div>
                      )}

                      {/* Active Task */}
                      {latestTask && !latestTask.completed && (
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <div className="text-xs">
                              <ActionButton
                                variant="secondary"
                                onClick={() => {
                                  completeTask(latestTask.id, id);
                                }}
                              >
                                {latestTask.cta}
                              </ActionButton>
                            </div>
                            {latestTask.deadline && (
                              <DeadlineBadge
                                deadline={latestTask.deadline}
                                variant="full"
                                showLabel={false}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          className="btn-primary-hover inline-flex items-center gap-2 px-6 py-3 rounded-md text-base font-semibold cursor-pointer transition-all duration-150 border disabled:opacity-60 disabled:cursor-not-allowed mt-12"
          style={{
            backgroundColor: "var(--button-primary-bg)",
            color: "var(--text-inverse)",
            borderColor: "var(--button-primary-bg)",
          }}
          onClick={() => setIsCreateModalOpen(true)}
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
          <Route path="/zaak/:zaakId" element={<IssueTimeline />} />
          <Route path="/api-docs" element={<ApiDocumentationView />} />
        </Routes>
      </Router>
    </SSEProvider>
  );
};

export default App;
