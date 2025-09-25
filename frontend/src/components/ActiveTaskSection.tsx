import React from "react";
import type { CloudEvent } from "../types";
import TaskPlugin from "../plugins/eventTypes/TaskPlugin";
import { getLatestTaskForIssue } from "../utils/taskUtils";

interface ActiveTaskSectionProps {
  events: CloudEvent[];
  zaakId: string;
}

const ActiveTaskSection: React.FC<ActiveTaskSectionProps> = ({
  events,
  zaakId,
}) => {
  const latestTask = getLatestTaskForIssue(events, zaakId);

  if (!latestTask) return null;

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
      type: "item.created",
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
        Mijn taak
      </div>
      <div
        className="border rounded-xl p-8 md:p-6"
        style={{
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border-primary)",
        }}
      >
        <TaskPlugin
          event={mockEvent}
          data={mockEvent.data}
          timeInfo={{
            date: new Date(latestTask.timestamp).toLocaleDateString("nl-NL"),
            time: new Date(latestTask.timestamp).toLocaleTimeString("nl-NL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            relative: "actief",
          }}
        />
      </div>
    </div>
  );
};

export default ActiveTaskSection;
