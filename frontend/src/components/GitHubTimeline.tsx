import React, { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSSE } from "../hooks/useSSE";
import type {
  CloudEvent,
  TimelineEvent,
  TimelineItemType,
  Issue,
} from "../types";
import TimelineItem from "./TimelineItem";
import ResourceEditor from "./ResourceEditor";
import "./GitHubTimeline.css";

const GitHubTimeline: React.FC = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const { events, issues, sendEvent } = useSSE();
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const issue = issueId ? issues[issueId] : null;

  // Convert CloudEvents to TimelineEvents for this specific issue
  const timelineEvents = useMemo(() => {
    if (!issueId) return [];

    return events
      .filter((event) => event.subject === issueId)
      .map((event): TimelineEvent => {
        const timestamp = event.time || new Date().toISOString();
        let type: "created" | "updated" | "deleted" = "created";
        let actor = "system";

        // Extract actor from event data
        if (
          event.data &&
          typeof event.data === "object" &&
          event.data !== null
        ) {
          const data = event.data as Record<string, unknown>;
          if (data.actor && typeof data.actor === "string") {
            actor = data.actor;
          } else if (data.assignee && typeof data.assignee === "string") {
            actor = data.assignee;
          }
        }

        // Determine event type based on CloudEvent type
        if (event.type.includes("patch") || event.type.includes("updated")) {
          type = "updated";
        } else if (event.type.includes("delete")) {
          type = "deleted";
        }

        return {
          id: event.id,
          type,
          timestamp,
          actor,
          data: event.data || {},
          originalEvent: event,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
  }, [events, issueId]);

  // Determine timeline item type from CloudEvent
  const getTimelineItemType = (event: CloudEvent): TimelineItemType => {
    if (event.type === "com.example.issue.create") return "issue_created";
    if (event.type === "com.example.issue.patch") return "issue_updated";
    if (event.type === "com.example.issue.delete") return "issue_deleted";

    // Check for timeline-specific event types from EVENT_DESIGN.md
    if (event.type.includes("timeline/item/created")) {
      if (event.data && typeof event.data === "object" && event.data !== null) {
        const data = event.data as Record<string, unknown>;
        return (data.item_type as TimelineItemType) || "system_event";
      }
      return "system_event";
    }

    return "system_event";
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !issueId || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setCommentError(null);
    setCommentSuccess(false);

    try {
      // Create a timeline comment event
      const commentEvent: CloudEvent = {
        specversion: "1.0",
        id: crypto.randomUUID(),
        source: `/timeline/items/comment-${Date.now()}`,
        subject: issueId,
        type: "https://api.example.com/events/timeline/item/created/v1",
        time: new Date().toISOString(),
        datacontenttype: "application/json",
        data: {
          item_type: "comment",
          item_id: `comment-${Date.now()}`,
          actor: "user@example.com", // In a real app, this would come from auth
          timestamp: new Date().toISOString(),
          item_data: {
            content: commentText.trim(),
            parent_id: null,
            mentions: [],
          },
        },
      };

      // Send the comment event to the server
      await sendEvent(commentEvent);
      setCommentText("");
      setCommentSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setCommentSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to submit comment:", error);
      setCommentError(
        error instanceof Error ? error.message : "Failed to submit comment",
      );
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditIssue = () => {
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
  };

  const handlePatchIssue = async (event: CloudEvent) => {
    await sendEvent(event);
    setIsEditorOpen(false);
  };

  const handleDeleteIssue = async () => {
    if (
      !issueId ||
      !window.confirm(`Are you sure you want to delete issue #${issueId}?`)
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const deleteEvent: CloudEvent = {
        specversion: "1.0",
        id: crypto.randomUUID(),
        source: `/issues/${issueId}`,
        subject: issueId,
        type: "com.example.issue.delete",
        time: new Date().toISOString(),
        datacontenttype: "application/json",
        data: {
          id: issueId,
          reason: "Deleted from timeline view",
        },
      };

      await sendEvent(deleteEvent);

      // Navigate back to main page after successful deletion
      navigate("/");
    } catch (error) {
      console.error("Failed to delete issue:", error);
      alert("Failed to delete issue");
    } finally {
      setIsDeleting(false);
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

  if (!issueId) {
    return (
      <div className="github-timeline-error">
        <h1>Issue not found</h1>
        <Link to="/">← Back to Issues</Link>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="github-timeline-loading">
        <h1>Loading issue...</h1>
        <Link to="/">← Back to Issues</Link>
      </div>
    );
  }

  return (
    <div className="github-timeline">
      {/* Header */}
      <div className="github-timeline-header">
        <div className="breadcrumb">
          <Link to="/" className="breadcrumb-link">
            Issues
          </Link>
          <span className="breadcrumb-separator">•</span>
          <span className="breadcrumb-current">#{issueId}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="github-timeline-content">
        {/* Issue header - the main issue as the first item */}
        <div className="github-timeline-item github-timeline-issue">
          <div className="github-timeline-item-avatar">
            <div className="avatar">
              {issue.assignee ? issue.assignee.charAt(0).toUpperCase() : "?"}
            </div>
          </div>

          <div className="github-timeline-item-content">
            <div className="github-timeline-issue-header">
              <h1 className="issue-title">
                {String(issue.title) || "Untitled Issue"}
                <span className="issue-number">#{issueId}</span>
              </h1>

              <div className="issue-meta">
                <span
                  className="issue-status"
                  style={{ backgroundColor: getStatusColor(issue.status) }}
                >
                  {issue.status === "in_progress"
                    ? "In Progress"
                    : issue.status}
                </span>
                {issue.priority && (
                  <span
                    className="issue-priority"
                    style={{ color: getPriorityColor(issue.priority) }}
                  >
                    {String(issue.priority)} priority
                  </span>
                )}
              </div>
            </div>

            <div className="issue-description">
              <p>{String(issue.description) || "No description provided."}</p>
            </div>

            <div className="issue-details">
              <div className="issue-detail">
                <strong>Assignee:</strong>{" "}
                {String(issue.assignee) || "Unassigned"}
              </div>
              {issue.created_at && (
                <div className="issue-detail">
                  <strong>Created:</strong>{" "}
                  {new Date(String(issue.created_at)).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="issue-actions">
              <button
                type="button"
                className="btn btn-edit"
                onClick={handleEditIssue}
              >
                Edit Issue
              </button>
              <button
                type="button"
                className="btn btn-delete"
                onClick={handleDeleteIssue}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Issue"}
              </button>
            </div>
          </div>
        </div>

        {/* Timeline events */}
        <div className="github-timeline-events">
          {timelineEvents
            .filter(
              (event) =>
                getTimelineItemType(event.originalEvent) !== "issue_created",
            )
            .map((event) => {
              const itemType = getTimelineItemType(event.originalEvent);
              return (
                <div key={event.id} className="github-timeline-item">
                  <div className="github-timeline-item-avatar">
                    <div className="avatar">
                      {event.actor ? event.actor.charAt(0).toUpperCase() : "?"}
                    </div>
                  </div>
                  <div className="github-timeline-item-content">
                    <TimelineItem
                      event={event}
                      itemType={itemType}
                      isFirst={false}
                      isLast={false}
                    />
                  </div>
                </div>
              );
            })}
        </div>

        {/* Comment form */}
        <div className="github-timeline-item github-timeline-comment-form">
          <div className="github-timeline-item-avatar">
            <div className="avatar">U</div>
          </div>

          <div className="github-timeline-item-content">
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <div className="comment-form-header">
                <h3>Add a comment</h3>
              </div>

              {commentError && (
                <div className="comment-error">
                  <strong>Error:</strong> {commentError}
                </div>
              )}

              {commentSuccess && (
                <div className="comment-success">
                  Comment submitted successfully!
                </div>
              )}

              <textarea
                className="comment-textarea"
                placeholder="Leave a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                disabled={isSubmittingComment}
              />

              <div className="comment-form-footer">
                <div className="comment-form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!commentText.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? "Submitting..." : "Comment"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ResourceEditor<Issue>
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        resource={issue}
        resourceType="issue"
        onSave={handlePatchIssue}
        readOnlyFields={["id", "created_at"]}
      />
    </div>
  );
};

export default GitHubTimeline;
