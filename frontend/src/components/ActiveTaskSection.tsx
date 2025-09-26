import React from "react";
import type { CloudEvent } from "../types";
import { getLatestTaskForIssue } from "../utils/taskUtils";
import SectionLabel from "./SectionLabel";
import TaskCard from "./TaskCard";

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
    <div className="mb-6 md:mb-8" style={{ position: "relative", zIndex: 1 }}>
      <SectionLabel>Mijn taak</SectionLabel>
      <div
        className="border rounded-xl p-6 md:p-4"
        style={{
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border-primary)",
        }}
      >
        <TaskCard task={latestTask} zaakId={zaakId} />
      </div>
    </div>
  );
};

export default ActiveTaskSection;
