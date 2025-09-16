import React, { useEffect, useRef, useState } from "react";
import type { Issue } from "../types";

interface IssuesListProps {
  issues: Record<string, Issue>;
  onDeleteIssue: (issueId: string) => Promise<void>;
  onIssueUpdate?: (issueId: string) => void;
}

const IssuesList: React.FC<IssuesListProps> = ({
  issues,
  onDeleteIssue,
  onIssueUpdate,
}) => {
  const [animatingIssues, setAnimatingIssues] = useState<Set<string>>(
    new Set(),
  );
  const [deletingIssues, setDeletingIssues] = useState<Set<string>>(new Set());
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
          newIssues.forEach((id) => updated.delete(id));
          return updated;
        });
      }, 500);
    }

    prevIssuesRef.current = issues;
  }, [issues]);

  const handleDeleteIssue = async (issueId: string) => {
    if (!window.confirm(`Are you sure you want to delete issue #${issueId}?`)) {
      return;
    }

    setDeletingIssues((prev) => new Set([...prev, issueId]));

    try {
      await onDeleteIssue(issueId);
    } catch (error) {
      console.error("Failed to delete issue:", error);
      setDeletingIssues((prev) => {
        const updated = new Set(prev);
        updated.delete(issueId);
        return updated;
      });
      alert("Failed to delete issue");
    }
  };

  const handleIssueClick = (issueId: string) => {
    if (onIssueUpdate) {
      onIssueUpdate(issueId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "#28a745";
      case "in_progress":
        return "#ffc107";
      case "closed":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "#dc3545";
      case "medium":
        return "#ffc107";
      case "low":
        return "#28a745";
      default:
        return "#6c757d";
    }
  };

  const issueEntries = Object.entries(issues);

  return (
    <>
      <style>{`
        @keyframes issueAppear {
          0% {
            opacity: 0;
            transform: translateY(-20px);
            max-height: 0;
            margin-bottom: 0;
            padding-top: 0;
            padding-bottom: 0;
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            max-height: 500px;
            margin-bottom: 1rem;
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
        }

        @keyframes issueDisappear {
          0% {
            opacity: 1;
            transform: translateY(0);
            max-height: 500px;
            margin-bottom: 1rem;
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
          100% {
            opacity: 0;
            transform: translateY(-20px);
            max-height: 0;
            margin-bottom: 0;
            padding-top: 0;
            padding-bottom: 0;
          }
        }

        @keyframes shine {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.8);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(0, 123, 255, 0.4);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
          }
        }

        .issue-appear {
          animation: issueAppear 0.5s ease-out forwards;
        }

        .issue-disappear {
          animation: issueDisappear 0.4s ease-in forwards;
        }

        .issue-shine {
          animation: shine 1s ease-in-out;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.8);
        }

        .issue-card {
          margin-bottom: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: box-shadow 0.2s ease;
        }

        .issue-card:hover {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }
      `}</style>

      <div style={{ marginTop: "2rem" }}>
        <h3>Current Issues (Built from Events)</h3>
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <div>
            {issueEntries.length === 0 ? (
              <p style={{ color: "#888", fontStyle: "italic" }}>
                No issues found
              </p>
            ) : (
              issueEntries.map(([id, issue]) => (
                <div
                  key={id}
                  className={`issue-card ${
                    animatingIssues.has(id) ? "issue-appear" : ""
                  } ${deletingIssues.has(id) ? "issue-disappear" : ""}`}
                  data-issue-id={id}
                  onClick={() => handleIssueClick(id)}
                  style={{
                    opacity: deletingIssues.has(id) ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        color: "#333",
                        flex: 1,
                        marginRight: "1rem",
                      }}
                    >
                      {issue.title || "No title"}
                    </h4>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "#999",
                        background: "#f8f9fa",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        fontFamily: "monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      #{id}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 0.5rem 0", color: "#666" }}>
                    {issue.description || "No description"}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.9rem",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        color: "#888",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>
                        <strong>Status:</strong>{" "}
                        <span style={{ color: getStatusColor(issue.status) }}>
                          {issue.status || "unknown"}
                        </span>
                      </span>

                      <span>
                        <strong>Assignee:</strong>{" "}
                        {issue.assignee || "unassigned"}
                      </span>

                      {issue.priority && (
                        <span>
                          <strong>Priority:</strong>{" "}
                          <span
                            style={{ color: getPriorityColor(issue.priority) }}
                          >
                            {issue.priority}
                          </span>
                        </span>
                      )}

                      {issue.created_at && (
                        <span>
                          <strong>Created:</strong>{" "}
                          {new Date(issue.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteIssue(id);
                      }}
                      disabled={deletingIssues.has(id)}
                      style={{
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        cursor: deletingIssues.has(id)
                          ? "not-allowed"
                          : "pointer",
                        fontSize: "0.8rem",
                        opacity: deletingIssues.has(id) ? 0.6 : 1,
                      }}
                    >
                      {deletingIssues.has(id) ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default IssuesList;
