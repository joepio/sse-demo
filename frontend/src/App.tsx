import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useSSE } from "./hooks/useSSE";
import ConnectionStatus from "./components/ConnectionStatus";
import CreateIssueForm from "./components/CreateIssueForm";
import GitHubTimeline from "./components/GitHubTimeline";
import Modal from "./components/Modal";

import type { CloudEvent, Issue } from "./types";
import "./App.css";

const ZakenDashboard: React.FC = () => {
  const { issues, connectionStatus, sendEvent } = useSSE();
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

  const issueEntries = Object.entries(issues);

  return (
    <div className="github-timeline">
      {/* Header */}
      <div className="github-timeline-header">
        <div className="breadcrumb">
          <span className="breadcrumb-current">ZaakSysteem Dashboard</span>
        </div>
        <ConnectionStatus status={connectionStatus} />
      </div>

      {/* Main content */}
      <div className="github-timeline-content">
        {/* Zaken List */}
        <div className="github-timeline-item">
          <div className="github-timeline-item-avatar">
            <div className="avatar">📋</div>
          </div>
          <div className="github-timeline-item-content">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Huidige Zaken</h2>
                <p className="card-subtitle">
                  {issueEntries.length}{" "}
                  {issueEntries.length !== 1 ? "zaken" : "zaak"} opgebouwd uit
                  events
                </p>
              </div>

              <div className="card-body">
                {issueEntries.length === 0 ? (
                  <div className="loading-message">
                    <p>
                      Geen zaken gevonden. Maak uw eerste zaak hierboven aan.
                    </p>
                  </div>
                ) : (
                  <div className="zaken-list">
                    {issueEntries.map(([id, issue]) => (
                      <a
                        href={`/zaak/${id}`}
                        key={id}
                        className={`zaak-item ${animatingIssues.has(id) ? "new" : ""}`}
                        data-issue-id={id}
                      >
                        <div className="zaak-link">
                          {issue.title || "Zaak zonder titel"}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create New Zaak Button */}
        <div className="github-timeline-item">
          <div className="github-timeline-item-avatar">
            <div className="avatar">+</div>
          </div>
          <div className="github-timeline-item-content">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Nieuwe Zaak</h2>
                <p className="card-subtitle">
                  Klik om een nieuwe zaak aan te maken
                </p>
              </div>
              <div className="card-body">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsCreateModalOpen(true)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    fontSize: "1rem",
                  }}
                >
                  + Nieuwe Zaak Aanmaken
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    <Router>
      <Routes>
        <Route path="/" element={<ZakenDashboard />} />
        <Route path="/zaak/:zaakId" element={<GitHubTimeline />} />
      </Routes>
    </Router>
  );
};

export default App;
