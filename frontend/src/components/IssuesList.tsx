import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Issue, CloudEvent } from "../types";
import ResourceEditor from "./ResourceEditor";

interface IssuesListProps {
  issues: Record<string, Issue>;
  onDeleteIssue: (issueId: string) => Promise<void>;
  onPatchIssue: (event: CloudEvent) => Promise<void>;
}

const IssuesList: React.FC<IssuesListProps> = ({
  issues,
  onDeleteIssue,
  onPatchIssue,
}) => {
  const [animatingIssues, setAnimatingIssues] = useState<Set<string>>(
    new Set(),
  );
  const [deletingIssues, setDeletingIssues] = useState<Set<string>>(new Set());
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const prevIssuesRef = useRef<Record<string, Issue>>({});
  const navigate = useNavigate();

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

  const handleIssueClick = (
    issue: Issue,
    event: React.MouseEvent | React.KeyboardEvent,
  ) => {
    // Check if the click was on the edit button
    if ((event.target as HTMLElement).closest(".edit-button")) {
      setSelectedIssue(issue);
      setIsEditorOpen(true);
      return;
    }

    // Default behavior: navigate to timeline
    navigate(`/issue/${issue.id}`);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setSelectedIssue(null);
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
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .issue-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: #007bff;
          transform: translateY(-1px);
        }

        .issue-card:active {
          transform: translateY(0);
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
                  onClick={(e) => handleIssueClick(issue, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleIssueClick(issue, e);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  style={{
                    opacity: deletingIssues.has(id) ? 0.5 : 1,
                  }}
                  title="Click to view issue timeline"
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
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span>📝</span>
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

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        className="edit-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIssue(issue);
                          setIsEditorOpen(true);
                        }}
                        style={{
                          background: "#6c757d",
                          color: "white",
                          border: "none",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                        }}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ResourceEditor<Issue>
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        resource={selectedIssue}
        resourceType="issue"
        onSave={onPatchIssue}
        readOnlyFields={["id", "created_at"]}
      />
    </>
  );
};

export default IssuesList;
