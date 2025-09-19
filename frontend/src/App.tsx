import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useSSE } from "./hooks/useSSE";
import ConnectionStatus from "./components/ConnectionStatus";
import CreateIssueForm from "./components/CreateIssueForm";
import GitHubTimeline from "./components/GitHubTimeline";
import ResourceEditor from "./components/ResourceEditor";

import type { CloudEvent, Issue } from "./types";
import "./App.css";

const IssuesDashboard: React.FC = () => {
  const { issues, connectionStatus, sendEvent } = useSSE();
  const [animatingIssues, setAnimatingIssues] = useState<Set<string>>(
    new Set(),
  );
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
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
  };

  const handleEditIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsEditorOpen(true);
  };

  const handlePatchIssue = async (event: CloudEvent) => {
    await sendEvent(event);
    setIsEditorOpen(false);
    setSelectedIssue(null);

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

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setSelectedIssue(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "var(--status-open)";
      case "in_progress":
        return "var(--status-progress)";
      case "closed":
        return "var(--status-closed)";
      default:
        return "var(--text-secondary)";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "var(--priority-high)";
      case "medium":
        return "var(--priority-medium)";
      case "low":
        return "var(--priority-low)";
      default:
        return "var(--text-secondary)";
    }
  };

  const issueEntries = Object.entries(issues);

  return (
    <div className="github-timeline">
      {/* Header */}
      <div className="github-timeline-header">
        <div className="breadcrumb">
          <span className="breadcrumb-current">Issues Dashboard</span>
        </div>
        <ConnectionStatus status={connectionStatus} />
      </div>

      {/* Main content */}
      <div className="github-timeline-content">
        {/* Create Issue Form */}
        <div className="github-timeline-item">
          <div className="github-timeline-item-avatar">
            <div className="avatar">+</div>
          </div>
          <div className="github-timeline-item-content">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Create New Issue</h2>
                <p className="card-subtitle">
                  Add a new issue to track work or bugs
                </p>
              </div>
              <CreateIssueForm onCreateIssue={handleCreateIssue} />
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="github-timeline-item">
          <div className="github-timeline-item-avatar">
            <div className="avatar">📋</div>
          </div>
          <div className="github-timeline-item-content">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Current Issues</h2>
                <p className="card-subtitle">
                  {issueEntries.length} issue
                  {issueEntries.length !== 1 ? "s" : ""} built from events
                </p>
              </div>

              <div className="card-body">
                {issueEntries.length === 0 ? (
                  <div className="loading-message">
                    <p>No issues found. Create your first issue above.</p>
                  </div>
                ) : (
                  <div className="issues-grid">
                    {issueEntries.map(([id, issue]) => (
                      <div
                        key={id}
                        className={`issue-card ${animatingIssues.has(id) ? "new" : ""}`}
                        data-issue-id={id}
                      >
                        <div className="issue-card-header">
                          <h3 className="issue-card-title">
                            <a href={`/issue/${id}`} className="issue-link">
                              {issue.title || "Untitled Issue"}
                            </a>
                            <span className="issue-number">#{id}</span>
                          </h3>

                          <div className="issue-card-actions">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleEditIssue(issue)}
                              title="Edit issue"
                            >
                              ✏️ Edit
                            </button>
                          </div>
                        </div>

                        <p className="issue-card-description">
                          {issue.description || "No description provided."}
                        </p>

                        <div className="issue-card-meta">
                          <div className="issue-meta-item">
                            <span className="meta-label">Status:</span>
                            <span
                              className="badge badge-status"
                              style={{
                                backgroundColor: getStatusColor(issue.status),
                              }}
                            >
                              {issue.status === "in_progress"
                                ? "In Progress"
                                : issue.status}
                            </span>
                          </div>

                          <div className="issue-meta-item">
                            <span className="meta-label">Assignee:</span>
                            <span className="meta-value">
                              {issue.assignee || "Unassigned"}
                            </span>
                          </div>

                          {issue.priority && (
                            <div className="issue-meta-item">
                              <span className="meta-label">Priority:</span>
                              <span
                                className="meta-value priority"
                                style={{
                                  color: getPriorityColor(issue.priority),
                                }}
                              >
                                {issue.priority}
                              </span>
                            </div>
                          )}

                          {issue.created_at && (
                            <div className="issue-meta-item">
                              <span className="meta-label">Created:</span>
                              <span className="meta-value">
                                {new Date(
                                  issue.created_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Events Indicator */}
        <div className="github-timeline-item">
          <div className="github-timeline-item-avatar">
            <div className="avatar">🔴</div>
          </div>
          <div className="github-timeline-item-content">
            <div className="live-indicator">
              <span>🔴</span>
              Live CloudEvents Stream - New events appear in real-time
            </div>
          </div>
        </div>
      </div>

      <ResourceEditor<Issue>
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        resource={selectedIssue}
        resourceType="issue"
        onSave={handlePatchIssue}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IssuesDashboard />} />
        <Route path="/issue/:issueId" element={<GitHubTimeline />} />
      </Routes>
    </Router>
  );
};

export default App;
