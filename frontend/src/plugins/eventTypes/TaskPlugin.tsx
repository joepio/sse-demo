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
  const { completeTask, events } = useSSE();

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
      return (
        <div className="timeline-content-comment">
          <div className="comment-body">
            <p style={{ margin: "0 0 0.5rem 0", lineHeight: "1.5" }}>
              <strong>✅ Taak voltooid</strong>
              <span
                style={{ marginLeft: "0.5rem", color: "var(--text-secondary)" }}
              >
                Taak is gemarkeerd als voltooid
              </span>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="timeline-content-comment">
        <div className="comment-body">
          <p style={{ margin: "0", lineHeight: "1.5" }}>
            <strong>📝 Taak bijgewerkt</strong>
          </p>
        </div>
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
      <div className="timeline-content-comment">
        <div className="comment-body">
          <p style={{ margin: "0", lineHeight: "1.5" }}>
            {String(taskData.description || "Taak informatie niet beschikbaar")}
          </p>
        </div>
      </div>
    );
  }

  const { description, cta, url, completed, deadline } = currentTask;

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
      <div className="timeline-content-comment">
        <div className="comment-body">
          <p style={{ margin: "0 0 0.5rem 0", lineHeight: "1.5" }}>
            <strong>✅ Taak voltooid</strong>
          </p>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {description}
          </div>
        </div>
      </div>
    );
  }

  // Show the active task interface
  return (
    <div className="timeline-content-comment">
      <div className="comment-body">
        {deadline && (
          <div style={{ marginBottom: "0.75rem" }}>
            <span
              className="badge"
              style={{
                fontSize: "0.75rem",
                backgroundColor: getUrgencyColor(deadline),
                color: "white",
              }}
            >
              Deadline: {formatTaskDeadline(deadline)}
            </span>
          </div>
        )}
        <p style={{ margin: "0 0 1rem 0", lineHeight: "1.5" }}>{description}</p>
        <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
          <ActionButton
            variant="secondary"
            onClick={() => completeTask(taskId, event.originalEvent.subject)}
          >
            {cta}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default TaskPlugin;
