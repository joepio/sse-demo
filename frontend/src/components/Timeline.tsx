import React, { useMemo, useState, useCallback } from "react";
import type { CloudEvent, TimelineEvent, TimelineItemType } from "../types";
import TimelineItem from "./TimelineItem";
import Modal from "./Modal";
import "./Timeline.css";

interface TimelineProps {
  events: CloudEvent[];
  issueId: string;
  onClose: () => void;
}

const Timeline: React.FC<TimelineProps> = ({ events, issueId, onClose }) => {
  const [filter, setFilter] = useState<TimelineItemType | "all">("all");

  // Convert CloudEvents to TimelineEvents for this specific issue
  const timelineEvents = useMemo(() => {
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
  const getTimelineItemType = useCallback(
    (event: CloudEvent): TimelineItemType => {
      if (event.type === "com.example.issue.create") return "issue_created";
      if (event.type === "com.example.issue.patch") return "issue_updated";
      if (event.type === "com.example.issue.delete") return "issue_deleted";

      // Check for timeline-specific event types from EVENT_DESIGN.md
      if (event.type.includes("timeline/item/created")) {
        if (
          event.data &&
          typeof event.data === "object" &&
          event.data !== null
        ) {
          const data = event.data as Record<string, unknown>;
          return (data.item_type as TimelineItemType) || "system_event";
        }
        return "system_event";
      }

      return "system_event";
    },
    [],
  );

  // Filter events based on selected filter
  const filteredEvents = useMemo(() => {
    if (filter === "all") return timelineEvents;
    return timelineEvents.filter((event) => {
      const itemType = getTimelineItemType(event.originalEvent);
      return itemType === filter;
    });
  }, [timelineEvents, filter, getTimelineItemType]);

  // Get unique timeline item types for filter options
  const availableTypes = useMemo(() => {
    const types = new Set<TimelineItemType>();
    timelineEvents.forEach((event) => {
      types.add(getTimelineItemType(event.originalEvent));
    });
    return Array.from(types).sort();
  }, [timelineEvents, getTimelineItemType]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Timeline for Issue #${issueId}`}
      maxWidth="800px"
    >
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="timeline-filter" style={{ marginRight: "0.5rem" }}>
          Filter by type:
        </label>
        <select
          id="timeline-filter"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as TimelineItemType | "all")
          }
          style={{
            padding: "0.5rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            background: "white",
            color: "#333",
          }}
        >
          <option value="all">All Events ({timelineEvents.length})</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              (
              {
                timelineEvents.filter(
                  (e) => getTimelineItemType(e.originalEvent) === type,
                ).length
              }
              )
            </option>
          ))}
        </select>
      </div>

      {filteredEvents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
          <p>No timeline events found for this issue.</p>
        </div>
      ) : (
        <div className="timeline-list">
          {filteredEvents.map((event, index) => {
            const itemType = getTimelineItemType(event.originalEvent);
            return (
              <TimelineItem
                key={event.id}
                event={event}
                itemType={itemType}
                isFirst={index === 0}
                isLast={index === filteredEvents.length - 1}
              />
            );
          })}
        </div>
      )}

      <div
        style={{
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "1px solid #e5e5e5",
          textAlign: "center",
          fontSize: "0.875rem",
          color: "#666",
        }}
      >
        Showing {filteredEvents.length} of {timelineEvents.length} events
      </div>
    </Modal>
  );
};

export default Timeline;
