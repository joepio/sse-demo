import type { CloudEvent, ExtendedTask, Task } from "../types";
import { createItemUpdatedEvent } from "./cloudEvents";

/**
 * Extract tasks from events for a specific issue using the items store
 */
export const getTasksForIssue = (
  events: CloudEvent[],
  issueId: string,
  items: Record<string, Record<string, unknown>>
): ExtendedTask[] => {
  // Get json.commit events for tasks
  const taskEvents = events.filter(
    (event) =>
      event.type === "json.commit" &&
      event.subject === issueId &&
      event.data &&
      typeof event.data === "object" &&
      ((event.data as Record<string, unknown>).schema as string)?.endsWith(
        "/Task"
      )
  );

  // Get unique task IDs from events
  const taskIds = new Set<string>();
  for (const event of taskEvents) {
    const data = event.data as Record<string, unknown>;
    const taskId = String(data.resource_id || data.item_id);
    if (taskId) {
      taskIds.add(taskId);
    }
  }

  // Get task data from items store and create ExtendedTask
  const tasks: ExtendedTask[] = [];
  for (const taskId of taskIds) {
    const task = items[taskId] as unknown as Task | undefined;
    if (task) {
      // Find the most recent event for this task to get timestamp
      const recentEvent = taskEvents
        .filter((event) => {
          const data = event.data as Record<string, unknown>;
          return String(data.resource_id || data.item_id) === taskId;
        })
        .sort(
          (a, b) =>
            new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()
        )[0];

      const extendedTask: ExtendedTask = {
        ...task,
        id: taskId, // Ensure the ID is set correctly
        timestamp: recentEvent?.time || new Date().toISOString(),
      };

      tasks.push(extendedTask);
    }
  }

  return tasks;
};

/**
 * Get the latest uncompleted task for an issue
 */
export const getLatestTaskForIssue = (
  events: CloudEvent[],
  issueId: string,
  items: Record<string, Record<string, unknown>>
): ExtendedTask | null => {
  const tasks = getTasksForIssue(events, issueId, items);
  return tasks.find((task) => !task.completed) || null;
};

/**
 * Get all uncompleted tasks for an issue
 */
export const getUncompletedTasksForIssue = (
  events: CloudEvent[],
  issueId: string,
  items: Record<string, Record<string, unknown>>
): ExtendedTask[] => {
  const tasks = getTasksForIssue(events, issueId, items);
  return tasks.filter((task) => !task.completed);
};

/**
 * Create a task completion event
 */
export const createTaskCompletionEvent = (
  taskId: string,
  zaakId: string,
  actor: string
): CloudEvent => {
  return createItemUpdatedEvent(
    "task",
    taskId,
    {
      completed: true,
      completed_at: new Date().toISOString(),
      completed_by: actor,
    },
    {
      source: "frontend-user-action",
      subject: zaakId,
      actor: actor,
    }
  );
};

/**
 * Get task deadline urgency class
 */
export const getTaskUrgencyClass = (deadline: string): string => {
  if (!deadline) return "deadline-none";

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "deadline-overdue";
  if (diffDays <= 1) return "deadline-urgent";
  if (diffDays <= 3) return "deadline-soon";
  return "deadline-normal";
};

/**
 * Format task deadline for display
 */
export const formatTaskDeadline = (deadline: string): string => {
  if (!deadline) return "Geen deadline";

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} dagen te laat`;
  } else if (diffDays === 0) {
    return "Vandaag";
  } else if (diffDays === 1) {
    return "Morgen";
  } else if (diffDays <= 7) {
    return `Nog ${diffDays} dagen`;
  } else {
    return deadlineDate.toLocaleDateString("nl-NL");
  }
};

/**
 * Get task summary for an issue (for previews)
 */
export const getTaskSummary = (
  events: CloudEvent[],
  issueId: string,
  items: Record<string, Record<string, unknown>>
): {
  hasTask: boolean;
  taskCount: number;
  latestTask: ExtendedTask | null;
} => {
  const tasks = getTasksForIssue(events, issueId, items);
  const uncompletedTasks = tasks.filter((task) => !task.completed);

  return {
    hasTask: uncompletedTasks.length > 0,
    taskCount: uncompletedTasks.length,
    latestTask: uncompletedTasks[0] || null,
  };
};
