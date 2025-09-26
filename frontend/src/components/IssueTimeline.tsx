import React, { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSSE } from "../contexts/SSEContext";
import type { CloudEvent, TimelineEvent, TimelineItemType } from "../types";

import IssueHeader from "./IssueHeader";
import PageHeader from "./PageHeader";
import ActiveTaskSection from "./ActiveTaskSection";
import ActivePlanningSection from "./ActivePlanningSection";
import CommentForm from "./CommentForm";
import TimelineEventsList from "./TimelineEventsList";
import SchemaForm from "./SchemaForm";
import SectionLabel from "./SectionLabel";

const IssueTimeline: React.FC = () => {
  const { zaakId } = useParams<{ zaakId: string }>();
  const navigate = useNavigate();
  const { events, issues, sendEvent } = useSSE();

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
    // Check for item events
    if (
      event.type === "item.created" ||
      event.type === "item.updated" ||
      event.type === "item.deleted"
    ) {
      if (event.data && typeof event.data === "object" && event.data !== null) {
        const data = event.data as Record<string, unknown>;
        const itemType = data.item_type as string;

        // Map item types to timeline types
        if (itemType === "issue") {
          if (event.type === "item.created") return "issue_created";
          if (event.type === "item.updated") return "issue_updated";
          if (event.type === "item.deleted") return "issue_deleted";
        }

        return (itemType as TimelineItemType) || "system_event";
      }
    }

    return "system_event";
  };

  const handleCommentSubmit = async (event: CloudEvent) => {
    await sendEvent(event);
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
        type: "item.deleted",
        time: new Date().toISOString(),
        datacontenttype: "application/json",
        data: {
          item_type: "issue",
          item_id: zaakId,
          item_data: {
            id: zaakId,
            reason: "Verwijderd vanuit tijdlijn weergave",
          },
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
      <PageHeader currentZaakId={zaakId} />

      {/* Main content */}
      <div className="max-w-3xl mx-auto p-4 md:p-8 pt-8">
        {/* Zaak header - show as standalone section like active task and planning */}
        <div className="mb-6 md:mb-8 relative">
          {issue && (
            <IssueHeader
              issue={issue}
              onDelete={handleDeleteIssue}
              isDeleting={isDeleting}
            />
          )}
        </div>

        {/* Active task section - completely separate from timeline */}
        {zaakId && <ActiveTaskSection events={events} zaakId={zaakId} />}

        {/* Active planning section - completely separate from timeline */}
        {zaakId && <ActivePlanningSection events={events} zaakId={zaakId} />}

        {/* Timeline section */}
        {timelineEvents.length > 0 && (
          <div className="mb-6">
            <SectionLabel>Tijdlijn</SectionLabel>
            <TimelineEventsList
              events={timelineEvents}
              getTimelineItemType={getTimelineItemType}
            />
          </div>
        )}

        {/* Comment form */}
        {zaakId && (
          <CommentForm zaakId={zaakId} onSubmit={handleCommentSubmit} />
        )}

        {/* Schema-driven form for creating new items */}
        {zaakId && (
          <SchemaForm zaakId={zaakId} onSubmit={handleCommentSubmit} />
        )}
      </div>
    </div>
  );
};

export default IssueTimeline;
