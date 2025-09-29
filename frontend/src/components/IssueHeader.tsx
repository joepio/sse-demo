import type React from "react";
import type { Issue } from "../types";
import Card from "./Card";
import { Button } from "./ActionButton";

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
    <Card padding="md">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl xl:text-2xl font-semibold text-text-primary mb-2 lg:mb-3 xl:mb-4 leading-tight">
            {String(issue.title) || "Zaak zonder titel"}
          </h1>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-1 lg:px-3 lg:py-2 xl:px-3 xl:py-2 text-xs lg:text-xs xl:text-sm font-semibold text-text-inverse capitalize"
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
            <Button variant="icon" size="sm" onClick={onEdit} title="Bewerken">
              ✏️
            </Button>
          )}
          <Button
            variant="icon"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            loading={isDeleting}
            title={isDeleting ? "Verwijderen..." : "Verwijderen"}
          >
            🗑️
          </Button>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-text-primary mb-3">
        {String(issue.description) || "Geen beschrijving beschikbaar."}
      </p>

      <div className="text-xs text-text-tertiary">
        <strong className="text-text-primary">Toegewezen aan:</strong>{" "}
        {String(issue.assignee) || "Niet toegewezen"}
      </div>
    </Card>
  );
};

export default IssueHeader;
