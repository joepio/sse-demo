import React from "react";
import type { CloudEvent, TimelineEvent, TimelineItemType } from "../types";
import TimelineItem from "./TimelineItem";

interface TimelineEventsListProps {
  events: TimelineEvent[];
  getTimelineItemType: (event: CloudEvent) => TimelineItemType;
}

const TimelineEventsList: React.FC<TimelineEventsListProps> = ({
  events,
  getTimelineItemType,
}) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-tertiary">
          Geen tijdlijn gebeurtenissen gevonden.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div
        className="absolute left-5 md:left-4 top-0 bottom-0 w-0.5 z-10"
        style={{ backgroundColor: "var(--border-primary)" }}
      />

      {events.map((event) => {
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
  );
};

export default TimelineEventsList;
