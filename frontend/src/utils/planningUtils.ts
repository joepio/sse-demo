import type { CloudEvent, Planning, PlanningMoment } from "../types";

/**
 * Extract planning items from events for a specific issue
 */
export const getPlanningForIssue = (
  events: CloudEvent[],
  issueId: string,
): Map<string, Planning> => {
  const planningMap = new Map<string, Planning>();

  // Filter events for this issue and planning-related events
  const relevantEvents = events.filter(
    (event) =>
      event.subject === issueId &&
      (event.type === "https://api.example.com/events/timeline/item/created/v1" ||
        event.type === "https://api.example.com/events/timeline/item/updated/v1") &&
      event.data &&
      typeof event.data === "object" &&
      event.data !== null &&
      (event.data as any).item_type === "planning",
  );

  for (const event of relevantEvents) {
    const data = event.data as any;
    const planningId = data.item_id;

    if (event.type.includes("created")) {
      // Create new planning
      const itemData = data.item_data || {};
      planningMap.set(planningId, {
        id: planningId,
        title: itemData.title || "",
        description: itemData.description || "",
        moments: itemData.moments || [],
        actor: data.actor || "system",
        timestamp: data.timestamp || event.time || new Date().toISOString(),
      } as Planning);
    } else if (event.type.includes("updated")) {
      // Update existing planning
      const existingPlanning = planningMap.get(planningId);
      if (existingPlanning) {
        const patch = data.patch || {};
        const updatedPlanning = { ...existingPlanning };

        if (patch.title !== undefined) {
          updatedPlanning.title = patch.title as string;
        }
        if (patch.description !== undefined) {
          updatedPlanning.description = patch.description as string;
        }
        if (patch.moments !== undefined) {
          updatedPlanning.moments = patch.moments as PlanningMoment[];
        }

        // Update timestamp
        updatedPlanning.timestamp = data.timestamp || event.time || new Date().toISOString();

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
  issueId: string,
): Planning | null => {
  const planningItems = getPlanningForIssue(events, issueId);
  const planningArray = Array.from(planningItems.values());

  // Find planning with current or planned items (not all completed)
  const activePlanning = planningArray
    .filter((planning) =>
      planning.moments.some((moment) => moment.status !== "completed"),
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return activePlanning.length > 0 ? activePlanning[0] : null;
};

/**
 * Get progress information for a planning
 */
export const getPlanningProgress = (planning: Planning): {
  completed: number;
  current: number;
  planned: number;
  total: number;
  currentMoment: PlanningMoment | null;
  nextMoment: PlanningMoment | null;
} => {
  const completed = planning.moments.filter((m) => m.status === "completed").length;
  const current = planning.moments.filter((m) => m.status === "current").length;
  const planned = planning.moments.filter((m) => m.status === "planned").length;
  const total = planning.moments.length;

  const currentMoment = planning.moments.find((m) => m.status === "current") || null;
  const nextMoment = planning.moments.find((m) => m.status === "planned") || null;

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
export const isPlanningActive = (planning: Planning): boolean => {
  return planning.moments.some((moment) => moment.status !== "completed");
};

/**
 * Sort planning moments by date
 */
export const sortPlanningMoments = (moments: PlanningMoment[]): PlanningMoment[] => {
  return [...moments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Get formatted status text for a planning moment
 */
export const getPlanningMomentStatusText = (status: "completed" | "current" | "planned"): string => {
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
export const getPlanningCompletionPercentage = (planning: Planning): number => {
  if (planning.moments.length === 0) return 0;

  const completedCount = planning.moments.filter((m) => m.status === "completed").length;
  return Math.round((completedCount / planning.moments.length) * 100);
};
