import React from "react";
import type { EventPluginProps } from "./types";
import type { PlanningMoment } from "../../types";

const PlanningPlugin: React.FC<EventPluginProps> = ({ data }) => {
  // Extract planning data from the event
  const planningData = data as {
    item_type: string;
    item_id: string;
    item_data?: {
      title?: string;
      description?: string;
      moments?: PlanningMoment[];
    };
    actor?: string;
    timestamp?: string;
  };

  if (!planningData.item_data) {
    return (
      <div className="text-text-secondary">Geen planning data beschikbaar</div>
    );
  }

  const { title, description, moments = [] } = planningData.item_data;

  // Find current status
  const currentMoment = moments.find((m) => m.status === "current");
  const completedCount = moments.filter((m) => m.status === "completed").length;
  const totalCount = moments.length;

  const getStatusColor = (status: "completed" | "current" | "planned") => {
    switch (status) {
      case "completed":
        return "var(--status-open)"; // Green
      case "current":
        return "var(--status-progress)"; // Yellow/Orange
      case "planned":
        return "var(--border-primary)"; // Gray
      default:
        return "var(--border-primary)";
    }
  };

  const getStatusIcon = (status: "completed" | "current" | "planned") => {
    switch (status) {
      case "completed":
        return "✓";
      case "current":
        return "●";
      case "planned":
        return "○";
      default:
        return "○";
    }
  };

  return (
    <div className="p-0">
      {/* Planning header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📅</span>
          <h4 className="font-medium text-text-primary m-0">
            {title || "Planning"}
          </h4>
        </div>

        {description && (
          <p className="text-sm text-text-secondary m-0 mb-3">{description}</p>
        )}

        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
          <span>Voortgang:</span>
          <span className="font-medium">
            {completedCount} van {totalCount} afgerond
          </span>
          {currentMoment && (
            <>
              <span>•</span>
              <span className="text-text-primary">
                Huidig: {currentMoment.title}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Mini timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-border-primary"></div>

        {/* Timeline moments */}
        <div className="space-y-3">
          {moments.map((moment) => (
            <div key={moment.id} className="flex items-start gap-3 relative">
              {/* Status indicator */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-bg-primary relative z-10"
                style={{
                  color:
                    moment.status === "completed"
                      ? "white"
                      : getStatusColor(moment.status),
                  backgroundColor:
                    moment.status === "completed"
                      ? getStatusColor(moment.status)
                      : "var(--bg-primary)",
                  borderColor: getStatusColor(moment.status),
                }}
              >
                {getStatusIcon(moment.status)}
              </div>

              {/* Moment content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium leading-tight ${
                        moment.status === "completed"
                          ? "text-text-secondary line-through"
                          : moment.status === "current"
                            ? "text-text-primary font-semibold"
                            : "text-text-secondary"
                      }`}
                    >
                      {moment.title}
                    </div>
                  </div>
                  <div className="text-xs text-text-tertiary whitespace-nowrap">
                    {new Date(moment.date).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {moments.length === 0 && (
        <div className="text-text-secondary text-sm italic">
          Geen planning momenten beschikbaar
        </div>
      )}
    </div>
  );
};

export default PlanningPlugin;
