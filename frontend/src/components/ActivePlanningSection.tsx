import React from "react";
import type { CloudEvent } from "../types";
import { getPlanningForIssue } from "../utils/planningUtils";
import { useSSE } from "../contexts/SSEContext";
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
  const { items } = useSSE();
  const planningItems = getPlanningForIssue(events, zaakId, items);
  const planningArray = Array.from(planningItems.values());

  if (planningArray.length === 0) return null;

  return (
    <div
      className="mb-4 sm:mb-5 lg:mb-6 xl:mb-8"
      style={{ position: "relative", zIndex: 1 }}
      data-testid="active-planning-section"
    >
      <SectionLabel>Planning</SectionLabel>
      {planningArray.map((planning) => (
        <div key={`planning-${planning.id}`} className="mb-3">
          <Card padding="sm" id={planning.id}>
            <PlanningCard planning={planning} zaakId={zaakId} />
          </Card>
        </div>
      ))}
    </div>
  );
};

export default ActivePlanningSection;
