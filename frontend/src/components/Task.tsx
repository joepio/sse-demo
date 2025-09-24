import React, { useState } from "react";
import type { Task as TaskType } from "../types";
import "./Task.css";

interface TaskProps {
  task: TaskType;
  onComplete: (taskId: string) => void;
  variant?: "full" | "compact";
  showActor?: boolean;
}

const Task: React.FC<TaskProps> = ({
  task,
  onComplete,
  variant = "full",
  showActor = true,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete(task.id);
    } finally {
      setIsCompleting(false);
    }
  };

  if (task.completed) {
    return (
      <div className={`task task-completed task-${variant}`}>
        <div className="task-content">
          <div className="task-header">
            <span className="task-status">✓ Voltooid</span>
            {showActor && <span className="task-actor">door {task.actor}</span>}
          </div>
          <div className="task-description">{task.description}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`task task-active task-${variant}`}>
      <div className="task-content">
        {task.deadline && (
          <div className="task-deadline">
            {new Date(task.deadline).toLocaleDateString("nl-NL")}
          </div>
        )}
        <div className="task-body">
          <p className="task-description">{task.description}</p>
        </div>

        <div className="task-actions">
          <button
            onClick={handleComplete}
            className="task-complete-button"
            disabled={isCompleting}
            title="Markeer als voltooid"
          >
            {task.cta}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Task;
