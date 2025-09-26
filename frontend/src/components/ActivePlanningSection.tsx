import React from "react";
import type { CloudEvent } from "../types";
import { getLatestPlanningForIssue } from "../utils/planningUtils";
import SectionLabel from "./SectionLabel";
import PlanningCard from "./PlanningCard";
import Card from "./Card";

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
      <Card padding="md">
        <PlanningCard planning={latestPlanning} />
      </Card>
    </div>
  );
};

export default ActivePlanningSection;
