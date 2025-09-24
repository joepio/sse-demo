import React from "react";
import type { EventPluginProps } from "./types";

import ActionButton from "../../components/ActionButton";
import { useSSE } from "../../contexts/SSEContext";
import {
  getTaskUrgencyClass,
  formatTaskDeadline,
  getTasksForIssue,
} from "../../utils/taskUtils";

const TaskPlugin: React.FC<EventPluginProps> = ({ event, data }) => {
  const { events } = useSSE();

  const eventData = data as Record<string, unknown>;
  const taskId = eventData.item_id as string;
  const isUpdateEvent = event.originalEvent.type.includes("updated");
  const issueId = event.originalEvent.subject;

  // For create events, get the current task state from all events
  // For update events, just show the update message
  if (isUpdateEvent) {
    const taskData = (eventData.patch || {}) as Record<string, unknown>;
    const completed = taskData.completed;

    if (completed) {
      // Find the original task to get its CTA
      const allTasks = issueId ? getTasksForIssue(events, issueId) : [];
      const originalTask = allTasks.find((task) => task.id === taskId);
      const taskCTA = originalTask?.cta || "Taak";

      if (completed) {
        return (
          <div className="p-0">
            <p className="m-0 mb-2 leading-relaxed">
              <strong>✅ Taak voltooid: {taskCTA}</strong>
            </p>
            <div className="text-sm text-text-secondary">
              {originalTask?.description || "Taak is gemarkeerd als voltooid"}
            </div>
          </div>
        );
      }
    }

    return (
      <div className="p-0">
        <p className="m-0 leading-relaxed">
          <strong>📝 Taak bijgewerkt</strong>
        </p>
      </div>
    );
  }

  // For create events, get the current state of this specific task
  const allTasks = issueId ? getTasksForIssue(events, issueId) : [];
  const currentTask = allTasks.find((task) => task.id === taskId);

  if (!currentTask) {
    // Fallback to event data if task not found
    const taskData = (data.item_data || data) as Record<string, unknown>;
    return (
      <div className="p-0">
        <p className="m-0 leading-relaxed">
          {String(taskData.description || "Taak informatie niet beschikbaar")}
        </p>
      </div>
    );
  }

  const { description, cta, completed, deadline } = currentTask;

  const getUrgencyColor = (deadline: string) => {
    const urgencyClass = getTaskUrgencyClass(deadline);
    switch (urgencyClass) {
      case "deadline-overdue":
        return "#dc3545";
      case "deadline-urgent":
        return "#fd7e14";
      case "deadline-soon":
        return "#ffc107";
      case "deadline-normal":
        return "#28a745";
      default:
        return "#6c757d";
    }
  };

  if (completed) {
    return (
      <div className="p-0">
        <p className="m-0 mb-2 leading-relaxed">
          <strong>✅ Taak voltooid: {cta}</strong>
        </p>
        <div className="text-sm text-text-secondary">{description}</div>
      </div>
    );
  }

  // Show the active task interface
  return (
    <div className="p-0">
      {deadline && (
        <div className="mb-3">
          <span
            className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold text-white"
            style={{ backgroundColor: getUrgencyColor(deadline) }}
          >
            Deadline: {formatTaskDeadline(deadline)}
          </span>
        </div>
      )}
      <p className="m-0 mb-4 leading-relaxed">{description}</p>
      <div className="mt-2 flex gap-2">
        <ActionButton
          variant="secondary"
          onClick={() => {
            // This will be handled by the parent component
            console.log("Complete task:", currentTask.id);
          }}
        >
          {cta}
        </ActionButton>
      </div>
    </div>
  );
};

export default TaskPlugin;
