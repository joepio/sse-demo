import React from "react";
import type { CloudEvent } from "../types";
import { getLatestTaskForIssue } from "../utils/taskUtils";
import SectionLabel from "./SectionLabel";
import TaskCard from "./TaskCard";
import Card from "./Card";

interface ActiveTaskSectionProps {
  events: CloudEvent[];
  zaakId: string;
}

const ActiveTaskSection: React.FC<ActiveTaskSectionProps> = ({
  events,
  zaakId,
}) => {
  const latestTask = getLatestTaskForIssue(events, zaakId);

  if (!latestTask) return null;

  return (
    <div
      className="mb-4 sm:mb-5 lg:mb-6 xl:mb-8"
      style={{ position: "relative", zIndex: 1 }}
    >
      <SectionLabel>Mijn taak</SectionLabel>
      <Card padding="sm">
        <TaskCard task={latestTask} zaakId={zaakId} />
      </Card>
    </div>
  );
};

export default ActiveTaskSection;
