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
    <div
      className="mb-4 sm:mb-5 lg:mb-6 xl:mb-8"
      style={{ position: "relative", zIndex: 1 }}
      data-testid="active-planning-section"
    >
      <SectionLabel>Planning</SectionLabel>
      <Card padding="sm" id={latestPlanning.id}>
        <PlanningCard planning={latestPlanning} zaakId={zaakId} />
      </Card>
    </div>
  );
};

export default ActivePlanningSection;
