import React from "react";
import type { CloudEvent } from "../types";
import { getUncompletedTasksForIssue } from "../utils/taskUtils";
import { useSSE } from "../contexts/SSEContext";
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
  const { items } = useSSE();
  const openTasks = getUncompletedTasksForIssue(events, zaakId, items);

  if (openTasks.length === 0) return null;

  return (
    <div
      className="mb-4 sm:mb-5 lg:mb-6 xl:mb-8"
      style={{ position: "relative", zIndex: 1 }}
      data-testid="active-task-section"
    >
      <SectionLabel>Mijn taken</SectionLabel>
      <div className="space-y-3">
        {openTasks.map((task) => (
          <Card key={`task-${task.id}`} padding="sm" id={task.id} data-testid="task-card">
            <TaskCard task={task} zaakId={zaakId} />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ActiveTaskSection;
