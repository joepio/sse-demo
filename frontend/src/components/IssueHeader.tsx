import React from "react";
import type { Issue } from "../types";
import ActionButton from "./ActionButton";

interface IssueHeaderProps {
  issue: Issue;
  onEdit: () => void;
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
      className="mb-8 p-6 rounded-xl border"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-primary)",
      }}
    >
      <div className="mb-6 md:mb-4">
        <h1 className="text-3xl md:text-2xl font-semibold text-text-primary mb-3 leading-tight flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
          {String(issue.title) || "Zaak zonder titel"}
        </h1>

        <div className="flex items-center gap-3 mb-4">
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-text-inverse capitalize"
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

      <div className="mb-6">
        <p className="text-base leading-relaxed text-text-primary m-0">
          {String(issue.description) || "Geen beschrijving beschikbaar."}
        </p>
      </div>

      <div className="flex flex-wrap gap-6 md:gap-3 mb-6 md:flex-col">
        <div className="text-sm text-text-tertiary">
          <strong className="text-text-primary">Toegewezen aan:</strong>{" "}
          {String(issue.assignee) || "Niet toegewezen"}
        </div>
        {issue.created_at && (
          <div className="text-sm text-text-tertiary">
            <strong className="text-text-primary">Aangemaakt:</strong>{" "}
            {new Date(String(issue.created_at)).toLocaleDateString("nl-NL")}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <ActionButton variant="secondary" onClick={onEdit}>
          Bewerken
        </ActionButton>
        <ActionButton
          variant="secondary"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Verwijderen..." : "Verwijderen"}
        </ActionButton>
      </div>
    </div>
  );
};

export default IssueHeader;
