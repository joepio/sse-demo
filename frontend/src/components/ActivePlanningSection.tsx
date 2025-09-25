import React from "react";
import type { CloudEvent } from "../types";
import PlanningPlugin from "../plugins/eventTypes/PlanningPlugin";
import { getLatestPlanningForIssue } from "../utils/planningUtils";

interface ActivePlanningSectionProps {
  events: CloudEvent[];
  zaakId: string;
}

const ActivePlanningSection: React.FC<ActivePlanningSectionProps> = ({
  events,
  zaakId,
}) => {
  const latestPlanning = getLatestPlanningForIssue(events, zaakId);

  if (!latestPlanning) return null;

  // Create a mock event structure for the PlanningPlugin
  const mockEvent = {
    id: `active-planning-${latestPlanning.id}`,
    type: "created" as const,
    timestamp: latestPlanning.timestamp,
    actor: latestPlanning.actor,
    data: {
      item_type: "planning",
      item_id: latestPlanning.id,
      item_data: {
        title: latestPlanning.title,
        description: latestPlanning.description,
        moments: latestPlanning.moments,
      },
      actor: latestPlanning.actor,
      timestamp: latestPlanning.timestamp,
    },
    originalEvent: {
      specversion: "1.0",
      id: `active-planning-${latestPlanning.id}`,
      source: "frontend-active-planning",
      subject: zaakId,
      type: "item.created",
      time: latestPlanning.timestamp,
      datacontenttype: "application/json",
      data: {
        item_type: "planning",
        item_id: latestPlanning.id,
        item_data: {
          title: latestPlanning.title,
          description: latestPlanning.description,
          moments: latestPlanning.moments,
        },
        actor: latestPlanning.actor,
        timestamp: latestPlanning.timestamp,
      },
    },
  };

  return (
    <div className="mb-8" style={{ position: "relative", zIndex: 1 }}>
      <div className="text-xs text-text-secondary uppercase font-semibold tracking-wider mb-2 ml-0">
        Planning
      </div>
      <div
        className="border rounded-xl p-8 md:p-6"
        style={{
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border-primary)",
        }}
      >
        <PlanningPlugin
          event={mockEvent}
          data={mockEvent.data}
          timeInfo={{
            date: new Date(latestPlanning.timestamp).toLocaleDateString(
              "nl-NL",
            ),
            time: new Date(latestPlanning.timestamp).toLocaleTimeString(
              "nl-NL",
              {
                hour: "2-digit",
                minute: "2-digit",
              },
            ),
            relative: "planning",
          }}
        />
      </div>
    </div>
  );
};

export default ActivePlanningSection;
