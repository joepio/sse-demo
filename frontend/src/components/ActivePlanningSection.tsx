import React from "react";
import type { CloudEvent } from "../types";
import { getLatestPlanningForIssue } from "../utils/planningUtils";
import SectionLabel from "./SectionLabel";
import PlanningCard from "./PlanningCard";

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

  return (
    <div className="mb-6 md:mb-8" style={{ position: "relative", zIndex: 1 }}>
      <SectionLabel>Planning</SectionLabel>
      <div
        className="border rounded-xl p-4"
        style={{
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border-primary)",
        }}
      >
        <PlanningCard planning={latestPlanning} />
      </div>
    </div>
  );
};

export default ActivePlanningSection;
