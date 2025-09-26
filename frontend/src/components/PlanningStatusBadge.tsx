import React from "react";
import type { CloudEvent } from "../types";
import {
  getLatestPlanningForIssue,
  getPlanningProgress,
} from "../utils/planningUtils";

interface PlanningStatusBadgeProps {
  events: CloudEvent[];
  issueId: string;
  variant?: "compact" | "detailed";
}

const PlanningStatusBadge: React.FC<PlanningStatusBadgeProps> = ({
  events,
  issueId,
  variant = "compact",
}) => {
  const latestPlanning = getLatestPlanningForIssue(events, issueId);

  if (!latestPlanning) return null;

  const progress = getPlanningProgress(latestPlanning);
  const { completed, total, currentMoment, nextMoment } = progress;
  const completionPercentage =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold border-2"
          style={{
            color: "var(--status-progress)",
            backgroundColor: "var(--bg-primary)",
            borderColor: "var(--status-progress)",
          }}
        >
          ●
        </div>
        <div className="flex items-center gap-2">
          {currentMoment ? (
            <span className="text-text-secondary font-medium">
              {currentMoment.title}
            </span>
          ) : (
            <span className="text-text-secondary font-medium">
              {completed}/{total} afgerond
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-lg border"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
      }}
    >
      <span className="text-xl opacity-80">📅</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-sm font-semibold text-text-primary truncate">
            {latestPlanning.title}
          </div>
          <div className="text-xs text-text-secondary font-medium bg-text-tertiary bg-opacity-10 px-2 py-1 rounded-full">
            {completionPercentage}%
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="w-full h-2 rounded-full mb-3"
          style={{ backgroundColor: "var(--border-primary)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              backgroundColor: "var(--status-open)",
              width: `${completionPercentage}%`,
            }}
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-text-secondary">
          {currentMoment && (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 relative z-10"
                style={{
                  color: "white",
                  backgroundColor: "var(--status-progress)",
                  borderColor: "var(--status-progress)",
                }}
              >
                ●
              </div>
              <span className="font-medium text-text-primary">
                Huidig: {currentMoment.title}
              </span>
            </div>
          )}
          {nextMoment && (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 relative z-10"
                style={{
                  color: "var(--text-tertiary)",
                  backgroundColor: "transparent",
                  borderColor: "var(--border-primary)",
                }}
              >
                ○
              </div>
              <span>Volgende: {nextMoment.title}</span>
            </div>
          )}
          {completed > 0 && (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 relative z-10"
                style={{
                  color: "white",
                  backgroundColor: "var(--status-open)",
                  borderColor: "var(--status-open)",
                }}
              >
                ✓
              </div>
              <span>{completed} voltooid</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanningStatusBadge;
