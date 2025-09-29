import type { CloudEvent, ExtendedTask, TimelineItemData } from "../types";

/**
 * Extract tasks from events for a specific issue
 */
export const getTasksForIssue = (
  events: CloudEvent[],
  issueId: string,
): ExtendedTask[] => {
  // Get both created and updated task events
  const taskEvents = events.filter(
    (event) =>
      (event.type === "item.created" || event.type === "item.updated") &&
      event.subject === issueId &&
      event.data &&
      typeof event.data === "object" &&
      (event.data as Record<string, unknown>).item_type === "task",
  );

  // Group events by task ID to handle updates
  const taskMap = new Map<string, ExtendedTask>();

  // Process events in chronological order
  taskEvents
    .sort(
      (a, b) =>
        new Date(a.time || "").getTime() - new Date(b.time || "").getTime(),
    )
    .forEach((event) => {
      const data = event.data as Record<string, unknown>;
      const taskId = data.item_id as string;

      if (event.type === "item.created") {
        // Create new task
        const itemData = data.item_data as TimelineItemData;
        if (itemData.cta && itemData.description && itemData.url) {
          taskMap.set(taskId, {
            id: taskId,
            cta: itemData.cta,
            description: itemData.description,
            url: itemData.url || null,
            completed: itemData.completed || false,
            deadline: itemData.deadline || null,
            actor: String(data.actor || "system"),
            timestamp: event.time || new Date().toISOString(),
          } as ExtendedTask);
        }
      } else if (event.type === "item.updated") {
        // Update existing task
        const existingTask = taskMap.get(taskId);
        if (existingTask) {
          const patch = data.patch as Record<string, unknown>;
          if (patch) {
            // Apply patch to existing task
            const updatedTask = { ...existingTask };
            if (patch.completed !== undefined) {
              updatedTask.completed = patch.completed as boolean;
            }
            if (patch.cta !== undefined) {
              updatedTask.cta = patch.cta as string;
            }
            if (patch.description !== undefined) {
              updatedTask.description = patch.description as string;
            }
            if (patch.url !== undefined) {
              updatedTask.url = patch.url as string;
            }
            if (patch.deadline !== undefined) {
              updatedTask.deadline = patch.deadline as string;
            }
            taskMap.set(taskId, updatedTask);
          }
        }
      }
    });

  return Array.from(taskMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
};

/**
 * Get the latest uncompleted task for an issue
 */
export const getLatestTaskForIssue = (
  events: CloudEvent[],
  issueId: string,
): ExtendedTask | null => {
  const tasks = getTasksForIssue(events, issueId);
  return tasks.find((task) => !task.completed) || null;
};

/**
 * Get all uncompleted tasks for an issue
 */
export const getUncompletedTasksForIssue = (
  events: CloudEvent[],
  issueId: string,
): ExtendedTask[] => {
  const tasks = getTasksForIssue(events, issueId);
  return tasks.filter((task) => !task.completed);
};

/**
 * Create a task completion event
 */
export const createTaskCompletionEvent = (taskId: string): CloudEvent => {
  return {
    specversion: "1.0",
    id: `completion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: "frontend-user-action",
    type: "item.created",
    time: new Date().toISOString(),
    datacontenttype: "application/json",
    data: {
      item_type: "task_completed",
      item_id: `completion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      actor: "user@gemeente.nl",
      item_data: {
        original_task_id: taskId,
        completed_at: new Date().toISOString(),
        message: "Taak voltooid",
      },
    },
  };
};

/**
 * Get task deadline urgency class
 */
export const getTaskUrgencyClass = (deadline: string): string => {
  if (!deadline) return "deadline-none";

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
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
): {
  hasTask: boolean;
  taskCount: number;
  latestTask: ExtendedTask | null;
} => {
  const tasks = getTasksForIssue(events, issueId);
  const uncompletedTasks = tasks.filter((task) => !task.completed);

  return {
    hasTask: uncompletedTasks.length > 0,
    taskCount: uncompletedTasks.length,
    latestTask: uncompletedTasks[0] || null,
  };
};
