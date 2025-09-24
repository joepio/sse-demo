import React, { useState } from "react";
import type { Task as TaskType } from "../types";

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

  const isCompact = variant === "compact";

  if (task.completed) {
    return (
      <div
        className={`border border-l-4 rounded-lg transition-all duration-200 ${
          isCompact ? "mb-2" : "mb-4"
        } opacity-80 border-border-primary bg-bg-success`}
        style={{ borderLeftColor: "var(--text-success)" }}
      >
        <div className={`${isCompact ? "p-3" : "p-4"}`}>
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-text-success flex items-center gap-2">
              ✓ Voltooid
            </span>
            {showActor && (
              <span className="text-text-tertiary text-xs">
                door {task.actor}
              </span>
            )}
          </div>
          <div
            className={`text-text-primary leading-relaxed ${
              isCompact ? "text-sm" : "text-base"
            }`}
          >
            {task.description}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border border-l-4 rounded-lg bg-bg-primary hover:border-border-hover hover:shadow-md transition-all duration-200 ${
        isCompact ? "mb-2" : "mb-4"
      } border-border-primary`}
      style={{ borderLeftColor: "var(--link-primary)" }}
    >
      <div className={`${isCompact ? "p-3" : "p-4"}`}>
        {task.deadline && (
          <div className="text-xs text-text-secondary mb-2">
            {new Date(task.deadline).toLocaleDateString("nl-NL")}
          </div>
        )}

        <div className={`${isCompact ? "mb-3" : "mb-4"}`}>
          <p
            className={`text-text-primary leading-relaxed m-0 ${
              isCompact ? "text-sm" : "text-base"
            }`}
          >
            {task.description}
          </p>
        </div>

        <div className="flex gap-3 items-center md:flex-col md:items-stretch">
          <button
            onClick={handleComplete}
            className={`border border-border-primary rounded-md bg-bg-secondary text-text-secondary cursor-pointer transition-all duration-200 hover:border-text-success hover:text-text-success hover:bg-bg-success disabled:opacity-60 disabled:cursor-not-allowed ${
              isCompact
                ? "px-2 py-1.5 text-xs"
                : "px-3 py-2 text-xs md:text-center md:justify-center"
            }`}
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
