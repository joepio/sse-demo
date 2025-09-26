import React from "react";
import { formatTaskDeadline, getTaskUrgencyClass } from "../utils/taskUtils";

interface DeadlineBadgeProps {
  deadline: string | null;
  variant?: "full" | "compact";
  showLabel?: boolean;
}

const DeadlineBadge: React.FC<DeadlineBadgeProps> = ({
  deadline,
  variant = "full",
  showLabel = true,
}) => {
  if (!deadline) {
    return null;
  }

  const urgencyClass = getTaskUrgencyClass(deadline);
  const formattedDeadline = formatTaskDeadline(deadline);

  const getUrgencyColor = (urgencyClass: string) => {
    switch (urgencyClass) {
      case "deadline-overdue":
        return "#dc3545";
      case "deadline-urgent":
        return "#fd7e14";
      case "deadline-soon":
        return "#ffc107";
      case "deadline-normal":
        return "#28a745";
      default:
        return "#6c757d";
    }
  };

  const backgroundColor = getUrgencyColor(urgencyClass);

  if (variant === "compact") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded font-medium text-sm lg:text-base xl:text-lg"
        style={{
          backgroundColor: "var(--bg-secondary)",
          color: "var(--text-secondary)",
        }}
      >
        {formattedDeadline}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded text-sm lg:text-base xl:text-lg font-semibold text-white"
      style={{ backgroundColor }}
    >
      {showLabel && "Deadline: "}
      {formattedDeadline}
    </span>
  );
};

export default DeadlineBadge;
