import type React from "react";
import type { Issue } from "../types";

interface IssueHeaderProps {
  issue: Issue;
  onEdit?: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case "open":
      return "#10B981"; // Green
    case "in_progress":
      return "#F59E0B"; // Yellow
    case "closed":
      return "#6B7280"; // Gray
    default:
      return "#6B7280";
  }
};

const IssueHeader: React.FC<IssueHeaderProps> = ({
  issue,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  return (
    <div
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-primary)",
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-text-primary mb-2 leading-tight">
            {String(issue.title) || "Zaak zonder titel"}
          </h2>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-text-inverse capitalize"
              style={{ backgroundColor: getStatusColor(issue.status) }}
            >
              {issue.status === "in_progress"
                ? "In Behandeling"
                : issue.status === "open"
                  ? "Open"
                  : issue.status === "closed"
                    ? "Gesloten"
                    : issue.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded transition-colors duration-150 text-lg bg-transparent border-none cursor-pointer"
              style={{
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              onClick={onEdit}
              title="Bewerken"
            >
              ✏️
            </button>
          )}
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded transition-colors duration-150 text-lg bg-transparent border-none cursor-pointer"
            style={{
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text-error)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onClick={onDelete}
            disabled={isDeleting}
            title={isDeleting ? "Verwijderen..." : "Verwijderen"}
          >
            🗑️
          </button>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-text-primary mb-3">
        {String(issue.description) || "Geen beschrijving beschikbaar."}
      </p>

      <div className="text-xs text-text-tertiary">
        <strong className="text-text-primary">Toegewezen aan:</strong>{" "}
        {String(issue.assignee) || "Niet toegewezen"}
      </div>
    </div>
  );
};

export default IssueHeader;
