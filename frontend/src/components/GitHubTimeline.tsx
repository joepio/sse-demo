import React, { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSSE } from "../contexts/SSEContext";
import type {
  CloudEvent,
  TimelineEvent,
  TimelineItemType,
  Issue,
} from "../types";
import TimelineItem from "./TimelineItem";
import ResourceEditor from "./ResourceEditor";
import NotificationBell from "./NotificationBell";
import "./GitHubTimeline.css";

const GitHubTimeline: React.FC = () => {
  const { zaakId } = useParams<{ zaakId: string }>();
  const navigate = useNavigate();
  const { events, issues, sendEvent } = useSSE();
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const issue = zaakId ? issues[zaakId] : null;

  // Convert CloudEvents to TimelineEvents for this specific issue
  const timelineEvents = useMemo(() => {
    if (!zaakId) return [];

    return events
      .filter((event) => event.subject === zaakId)
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
  }, [events, zaakId]);

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
    if (!commentText.trim() || !zaakId || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setCommentError(null);
    setCommentSuccess(false);

    try {
      // Create a timeline comment event
      const commentEvent: CloudEvent = {
        specversion: "1.0",
        id: crypto.randomUUID(),
        source: `frontend-demo-event`,
        subject: zaakId,
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
        error instanceof Error ? error.message : "Opmerking verzenden mislukt",
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
      !zaakId ||
      !window.confirm(`Weet u zeker dat u zaak #${zaakId} wilt verwijderen?`)
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      // Create delete event
      const deleteEvent: CloudEvent = {
        specversion: "1.0",
        id: crypto.randomUUID(),
        source: "frontend-demo-event",
        subject: zaakId,
        type: "com.example.issue.delete",
        time: new Date().toISOString(),
        datacontenttype: "application/json",
        data: {
          id: zaakId,
          reason: "Verwijderd vanuit tijdlijn weergave",
        },
      };

      await sendEvent(deleteEvent);

      // Navigate back to main page after successful deletion
      navigate("/");
    } catch (error) {
      console.error("Failed to delete issue:", error);
      alert("Verwijderen van zaak mislukt");
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

  if (!zaakId) {
    return (
      <div className="github-timeline-error">
        <h1>Zaak niet gevonden</h1>
        <Link to="/">← Terug naar Zaken</Link>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="github-timeline-loading">
        <h1>Zaak laden...</h1>
        <Link to="/">← Terug naar Zaken</Link>
      </div>
    );
  }

  return (
    <div className="github-timeline">
      {/* Header */}
      <div className="github-timeline-header">
        <div className="breadcrumb">
          <Link to="/" className="breadcrumb-link">
            Terug naar mijn Zaken
          </Link>
        </div>

        {/* Notification Bell */}
        <NotificationBell currentZaakId={zaakId} />
      </div>

      {/* Main content */}
      <div className="github-timeline-content">
        {/* Zaak header - de hoofdzaak als eerste item */}
        <div className="github-timeline-item github-timeline-issue">
          <div className="github-timeline-item-avatar">
            <div className="avatar">
              {issue.assignee ? issue.assignee.charAt(0).toUpperCase() : "?"}
            </div>
          </div>

          <div className="github-timeline-item-content">
            <div className="github-timeline-issue-header">
              <h1 className="issue-title">
                {String(issue.title) || "Zaak zonder titel"}
              </h1>

              <div className="issue-meta">
                <span
                  className="issue-status"
                  style={{ backgroundColor: getStatusColor(issue.status) }}
                >
                  {issue.status === "in_progress"
                    ? "In Behandeling"
                    : issue.status === "open"
                      ? "Open"
                      : issue.status === "closed"
                        ? "Gesloten"
                        : issue.status}
                </span>
                {issue.priority && (
                  <span
                    className="issue-priority"
                    style={{ color: getPriorityColor(issue.priority) }}
                  >
                    {String(issue.priority) === "high"
                      ? "Hoge"
                      : String(issue.priority) === "medium"
                        ? "Gemiddelde"
                        : String(issue.priority) === "low"
                          ? "Lage"
                          : String(issue.priority)}{" "}
                    prioriteit
                  </span>
                )}
              </div>
            </div>

            <div className="issue-description">
              <p>
                {String(issue.description) || "Geen beschrijving beschikbaar."}
              </p>
            </div>

            <div className="issue-details">
              <div className="issue-detail">
                <strong>Toegewezen aan:</strong>{" "}
                {String(issue.assignee) || "Niet toegewezen"}
              </div>
              {issue.created_at && (
                <div className="issue-detail">
                  <strong>Aangemaakt:</strong>{" "}
                  {new Date(String(issue.created_at)).toLocaleDateString(
                    "nl-NL",
                  )}
                </div>
              )}
            </div>

            <div className="issue-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleEditIssue}
              >
                Bewerken
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDeleteIssue}
                disabled={isDeleting}
              >
                {isDeleting ? "Verwijderen..." : "Verwijderen"}
              </button>
            </div>
          </div>
        </div>

        {/* Timeline events */}
        <div className="github-timeline-events">
          {timelineEvents.map((event) => {
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
                <h3>Opmerking toevoegen</h3>
              </div>

              {commentError && (
                <div className="comment-error">
                  <strong>Fout:</strong> {commentError}
                </div>
              )}

              {commentSuccess && (
                <div className="comment-success">
                  Opmerking succesvol verzonden!
                </div>
              )}

              <textarea
                className="comment-textarea"
                placeholder="Voeg een opmerking toe..."
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
                    {isSubmittingComment
                      ? "Verzenden..."
                      : "Opmerking toevoegen"}
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
      />
    </div>
  );
};

export default GitHubTimeline;
