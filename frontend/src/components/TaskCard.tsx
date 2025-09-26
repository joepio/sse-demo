import React from "react";
import type { ExtendedTask } from "../types";
import ActionButton from "./ActionButton";
import { useSSE } from "../contexts/SSEContext";
import DeadlineBadge from "./DeadlineBadge";

interface TaskCardProps {
  task: ExtendedTask;
  zaakId: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, zaakId }) => {
  const { completeTask } = useSSE();

  if (task.completed) {
    return (
      <div className="p-0">
        <p className="m-0 mb-2 leading-relaxed">
          <strong>✅ Taak voltooid: {task.cta}</strong>
        </p>
        <div className="text-sm text-text-secondary">{task.description}</div>
      </div>
    );
  }

  // Show the active task interface
  return (
    <div className="p-0">
      <p className="m-0 mb-4 leading-relaxed">{task.description}</p>
      <div className="mt-2 flex gap-2 items-center">
        <ActionButton
          variant="secondary"
          onClick={() => {
            completeTask(task.id, zaakId);
          }}
        >
          {task.cta}
        </ActionButton>
        {task.deadline && (
          <DeadlineBadge
            deadline={task.deadline}
            variant="full"
            showLabel={true}
          />
        )}
      </div>
    </div>
  );
};

export default TaskCard;
