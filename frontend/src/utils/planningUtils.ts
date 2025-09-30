import type { CloudEvent, PlanningMoment, ExtendedPlanning } from "../types";

/**
 * Extract planning items from events for a specific issue
 */
export const getPlanningForIssue = (
  events: CloudEvent[],
  issueId: string
): Map<string, ExtendedPlanning> => {
  const planningMap = new Map<string, ExtendedPlanning>();

  // Filter json.commit events for planning
  const relevantEvents = events.filter(
    (event) =>
      event.subject === issueId &&
      event.type === "json.commit" &&
      event.data &&
      typeof event.data === "object" &&
      event.data !== null &&
      ((event.data as Record<string, unknown>).schema as string)?.endsWith(
        "/Planning"
      )
  );

  for (const event of relevantEvents) {
    const data = event.data as Record<string, unknown>;
    const planningId = String(data.resource_id || data.item_id);

    const resourceData = data.resource_data || data.item_data;
    const patch = data.patch;

    if (resourceData) {
      // Create new planning
      const itemData = resourceData as Record<string, unknown>;
      planningMap.set(planningId, {
        id: planningId,
        title: String(itemData.title) || "",
        description: String(itemData.description) || "",
        moments: (itemData.moments as PlanningMoment[]) || [],
        actor: String(data.actor) || "system",
        timestamp: event.time || new Date().toISOString(),
      } as ExtendedPlanning);
    } else if (patch) {
      // Update existing planning
      const existingPlanning = planningMap.get(planningId);
      if (existingPlanning) {
        const patchData = patch as Record<string, unknown>;

        // Check for deletion
        if (patchData._deleted === true) {
          planningMap.delete(planningId);
          continue;
        }

        const updatedPlanning = { ...existingPlanning };

        // Apply patch fields
        if (patchData.title) {
          updatedPlanning.title = String(patchData.title);
        }
        if (patchData.description) {
          updatedPlanning.description = String(patchData.description);
        }
        if (patchData.moments) {
          updatedPlanning.moments = patchData.moments as PlanningMoment[];
        }

        // Update timestamp
        updatedPlanning.timestamp = event.time || new Date().toISOString();

        planningMap.set(planningId, updatedPlanning);
      }
    }
  }

  return planningMap;
};

/**
 * Get the latest active planning for an issue (one that has current or planned items)
 */
export const getLatestPlanningForIssue = (
  events: CloudEvent[],
  issueId: string
): ExtendedPlanning | null => {
  const planningItems = getPlanningForIssue(events, issueId);
  const planningArray = Array.from(planningItems.values());

  // Find planning with current or planned items (not all completed)
  const activePlanning = planningArray
    .filter((planning) =>
      planning.moments.some((moment) => moment.status !== "completed")
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  return activePlanning.length > 0 ? activePlanning[0] : null;
};

/**
 * Get progress information for a planning
 */
export const getPlanningProgress = (
  planning: ExtendedPlanning
): {
  completed: number;
  current: number;
  planned: number;
  total: number;
  currentMoment: PlanningMoment | null;
  nextMoment: PlanningMoment | null;
} => {
  const completed = planning.moments.filter(
    (m) => m.status === "completed"
  ).length;
  const current = planning.moments.filter((m) => m.status === "current").length;
  const planned = planning.moments.filter((m) => m.status === "planned").length;
  const total = planning.moments.length;

  const currentMoment =
    planning.moments.find((m) => m.status === "current") || null;
  const nextMoment =
    planning.moments.find((m) => m.status === "planned") || null;

  return {
    completed,
    current,
    planned,
    total,
    currentMoment,
    nextMoment,
  };
};

/**
 * Check if a planning has any active (current or planned) moments
 */
export const isPlanningActive = (planning: ExtendedPlanning): boolean => {
  return planning.moments.some((moment) => moment.status !== "completed");
};

/**
 * Sort planning moments by date
 */
export const sortPlanningMoments = (
  moments: PlanningMoment[]
): PlanningMoment[] => {
  return [...moments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

/**
 * Get formatted status text for a planning moment
 */
export const getPlanningMomentStatusText = (
  status: "completed" | "current" | "planned"
): string => {
  switch (status) {
    case "completed":
      return "Afgerond";
    case "current":
      return "Huidig";
    case "planned":
      return "Gepland";
    default:
      return "Onbekend";
  }
};

/**
 * Calculate planning completion percentage
 */
export const getPlanningCompletionPercentage = (
  planning: ExtendedPlanning
): number => {
  if (planning.moments.length === 0) return 0;

  const completedCount = planning.moments.filter(
    (m) => m.status === "completed"
  ).length;
  return Math.round((completedCount / planning.moments.length) * 100);
};

/**
 * Check if planning status should be shown for an issue
 * Returns true if there's active planning (not fully completed) with at least one moment
 */
export const shouldShowPlanningStatus = (
  events: CloudEvent[],
  issueId: string
): boolean => {
  const latestPlanning = getLatestPlanningForIssue(events, issueId);

  if (!latestPlanning || latestPlanning.moments.length === 0) {
    return false;
  }

  // Show if there are any current or planned moments (not all completed)
  return latestPlanning.moments.some((moment) => moment.status !== "completed");
};
