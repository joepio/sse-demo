import React, { useState } from "react";
import type { ExtendedTask } from "../types";
import ActionButton, { Button } from "./ActionButton";
import { useSSE } from "../contexts/SSEContext";
import DeadlineBadge from "./DeadlineBadge";
import SchemaEditForm from "./SchemaEditForm";

interface TaskCardProps {
  task: ExtendedTask;
  zaakId: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, zaakId }) => {
  const { completeTask, sendEvent } = useSSE();
  const [showEditModal, setShowEditModal] = useState(false);

  if (task.completed) {
    return (
      <div className="p-0">
        <p className="m-0 mb-2 leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl">
          <strong>✅ Taak voltooid: {task.cta}</strong>
        </p>
        <div className="text-sm sm:text-base lg:text-lg xl:text-xl text-text-secondary">
          {task.description}
        </div>
      </div>
    );
  }

  // Show the active task interface
  return (
    <>
      <div className="p-0">
        <div className="flex justify-between items-start mb-4">
          <p
            className="m-0 leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl flex-1"
            data-testid="task-description"
          >
            {task.description}
          </p>
          <Button
            variant="icon"
            size="sm"
            onClick={() => setShowEditModal(true)}
            title="Taak bewerken"
          >
            ✏️
          </Button>
        </div>
        <div className="mt-2 flex gap-2 items-center">
          <ActionButton
            variant="secondary"
            onClick={() => {
              completeTask(task.id, zaakId);
            }}
            data-testid="task-cta"
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

      <SchemaEditForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        itemType="task"
        itemId={task.id}
        initialData={{
          description: task.description,
          cta: task.cta,
          deadline: task.deadline,
          url: task.url,
        }}
        onSubmit={sendEvent}
        zaakId={zaakId}
      />
    </>
  );
};

export default TaskCard;
