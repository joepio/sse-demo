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
import ActionButton from "./ActionButton";
import Card, { CardHeader, CardContent } from "./Card";
import { getLatestTaskForIssue } from "../utils/taskUtils";
import TaskPlugin from "../plugins/eventTypes/TaskPlugin";

const GitHubTimeline: React.FC = () => {
  const { zaakId } = useParams<{ zaakId: string }>();
  const navigate = useNavigate();
  const { events, issues, sendEvent } = useSSE();
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

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
    if (
      event.type.includes("timeline/item/created") ||
      event.type.includes("timeline/item/updated")
    ) {
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

  if (!zaakId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-bg-primary">
        <h1 className="text-3xl text-text-primary mb-4">Zaak niet gevonden</h1>
        <Link
          to="/"
          className="text-link-primary hover:text-link-hover hover:underline font-medium"
        >
          ← Terug naar Zaken
        </Link>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-bg-primary">
        <h1 className="text-3xl text-text-primary mb-4">Zaak laden...</h1>
        <Link
          to="/"
          className="text-link-primary hover:text-link-hover hover:underline font-medium"
        >
          ← Terug naar Zaken
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-50 border-b p-4 md:px-8 md:py-4 flex justify-start items-center gap-4"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          borderBottomColor: "var(--border-primary)",
        }}
      >
        <div className="flex items-center gap-2 text-sm flex-1">
          <Link
            to="/"
            className="text-link-primary hover:text-link-hover hover:underline font-medium"
          >
            Terug naar mijn Zaken
          </Link>
        </div>

        {/* Notification Bell */}
        <NotificationBell currentZaakId={zaakId} />
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto p-8 md:p-4">
        {/* Zaak header - de hoofdzaak als eerste item */}
        <div className="mb-12 md:mb-6 relative">
          <div
            className="border rounded-xl p-8 md:p-6"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-primary)",
            }}
          >
            <div className="mb-6 md:mb-4">
              <h1 className="text-3xl md:text-2xl font-semibold text-text-primary mb-3 leading-tight flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                {String(issue.title) || "Zaak zonder titel"}
              </h1>

              <div className="flex items-center gap-3 mb-4">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-text-inverse capitalize"
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
                    className="text-sm font-medium capitalize"
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

            <div className="mb-6">
              <p className="text-base leading-relaxed text-text-primary m-0">
                {String(issue.description) || "Geen beschrijving beschikbaar."}
              </p>
            </div>

            <div className="flex flex-wrap gap-6 md:gap-3 mb-6 md:flex-col">
              <div className="text-sm text-text-tertiary">
                <strong className="text-text-primary">Toegewezen aan:</strong>{" "}
                {String(issue.assignee) || "Niet toegewezen"}
              </div>
              {issue.created_at && (
                <div className="text-sm text-text-tertiary">
                  <strong className="text-text-primary">Aangemaakt:</strong>{" "}
                  {new Date(String(issue.created_at)).toLocaleDateString(
                    "nl-NL",
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <ActionButton variant="secondary" onClick={handleEditIssue}>
                Bewerken
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={handleDeleteIssue}
                disabled={isDeleting}
              >
                {isDeleting ? "Verwijderen..." : "Verwijderen"}
              </ActionButton>
            </div>
          </div>
        </div>

        {/* Active task section - completely separate from timeline */}
        {zaakId &&
          (() => {
            const latestTask = getLatestTaskForIssue(events, zaakId);
            if (!latestTask || latestTask.completed) return null;

            // Create a mock event structure for the TaskPlugin
            const mockEvent = {
              id: `active-task-${latestTask.id}`,
              type: "created" as const,
              timestamp: latestTask.timestamp,
              actor: latestTask.actor,
              data: {
                item_type: "task",
                item_id: latestTask.id,
                item_data: {
                  cta: latestTask.cta,
                  description: latestTask.description,
                  url: latestTask.url,
                  completed: latestTask.completed,
                  deadline: latestTask.deadline,
                },
                actor: latestTask.actor,
                timestamp: latestTask.timestamp,
              },
              originalEvent: {
                specversion: "1.0",
                id: `active-task-${latestTask.id}`,
                source: "frontend-active-task",
                subject: zaakId,
                type: "https://api.example.com/events/timeline/item/created/v1",
                time: latestTask.timestamp,
                datacontenttype: "application/json",
                data: {
                  item_type: "task",
                  item_id: latestTask.id,
                  item_data: {
                    cta: latestTask.cta,
                    description: latestTask.description,
                    url: latestTask.url,
                    completed: latestTask.completed,
                    deadline: latestTask.deadline,
                  },
                  actor: latestTask.actor,
                  timestamp: latestTask.timestamp,
                },
              },
            };

            return (
              <div className="mb-8" style={{ position: "relative", zIndex: 1 }}>
                <div className="text-xs text-text-secondary uppercase font-semibold tracking-wider mb-2 ml-0">
                  Actieve taak
                </div>
                <div
                  className="border-l-4 rounded-md p-4 bg-white shadow-sm"
                  style={{
                    borderLeftColor: "var(--link-primary)",
                    backgroundColor: "var(--bg-secondary)",
                    marginLeft: 0,
                  }}
                >
                  <TaskPlugin
                    event={mockEvent}
                    data={mockEvent.data}
                    timeInfo={{
                      date: new Date(latestTask.timestamp).toLocaleDateString(
                        "nl-NL",
                      ),
                      time: new Date(latestTask.timestamp).toLocaleTimeString(
                        "nl-NL",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      ),
                      relative: "actief",
                    }}
                  />
                </div>
              </div>
            );
          })()}

        {/* Timeline events */}
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-5 md:left-4 top-0 bottom-0 w-0.5 z-10"
            style={{ backgroundColor: "var(--border-primary)" }}
          ></div>

          {timelineEvents.map((event) => {
            const itemType = getTimelineItemType(event.originalEvent);
            return (
              <div key={event.id} className="flex mb-8 md:mb-6 relative z-20">
                <div className="flex-shrink-0 mr-4 md:mr-3 w-10 md:w-8">
                  <div
                    className="w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold text-sm md:text-xs border-2"
                    style={{
                      backgroundColor: "var(--link-primary)",
                      color: "var(--text-inverse)",
                      borderColor: "var(--bg-primary)",
                    }}
                  >
                    {event.actor ? event.actor.charAt(0).toUpperCase() : "?"}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div>
                    <TimelineItem event={event} itemType={itemType} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comment form */}
        <div className="flex mb-8 relative z-20">
          <div className="flex-shrink-0 mr-4 md:mr-3 w-10 md:w-8">
            <div
              className="w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold text-sm md:text-xs border-2"
              style={{
                backgroundColor: "var(--link-primary)",
                color: "var(--text-inverse)",
                borderColor: "var(--bg-primary)",
              }}
            >
              U
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <Card>
              <CardHeader>
                <h3 className="m-0 text-sm font-semibold text-text-primary">
                  Opmerking toevoegen
                </h3>
              </CardHeader>

              <form onSubmit={handleCommentSubmit}>
                <CardContent>
                  {commentError && (
                    <div
                      className="px-4 py-3 mb-4 text-sm border-l-4 bg-bg-error text-text-error"
                      style={{ borderLeftColor: "var(--text-error)" }}
                    >
                      <strong>Fout:</strong> {commentError}
                    </div>
                  )}
                  <textarea
                    className="w-full min-h-[120px] p-4 border-none outline-none resize-y text-sm leading-relaxed placeholder:opacity-60"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="Voeg een opmerking toe..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={4}
                    disabled={isSubmittingComment}
                  />
                </CardContent>

                <CardHeader>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all duration-150 border bg-button-primary-bg text-text-inverse border-button-primary-bg hover:bg-button-primary-hover hover:border-button-primary-hover disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!commentText.trim() || isSubmittingComment}
                    >
                      {isSubmittingComment
                        ? "Verzenden..."
                        : "Opmerking toevoegen"}
                    </button>
                  </div>
                </CardHeader>
              </form>
            </Card>
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
