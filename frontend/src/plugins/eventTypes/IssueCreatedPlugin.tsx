import React from "react";
import type { EventPluginProps } from "./types";

const IssueCreatedPlugin: React.FC<EventPluginProps> = ({ data }) => {
  return (
    <div className="timeline-content-issue-created">
      <p>
        <strong>{String(data.title) || "Zaak aangemaakt"}</strong>
      </p>
      {(() => {
        const description = data.description;
        return typeof description === "string" && description ? (
          <p>{description}</p>
        ) : null;
      })()}
      <div className="issue-meta">
        <small>
          Status:{" "}
          {String(data.status) === "open"
            ? "Open"
            : String(data.status) || "open"}
          {(() => {
            const priority = data.priority;
            const priorityText =
              priority === "high"
                ? "Hoog"
                : priority === "medium"
                  ? "Gemiddeld"
                  : priority === "low"
                    ? "Laag"
                    : priority;
            return typeof priority === "string" && priority
              ? ` • Prioriteit: ${priorityText}`
              : "";
          })()}
          {(() => {
            const assignee = data.assignee;
            return typeof assignee === "string" && assignee
              ? ` • Toegewezen aan: ${String(assignee)}`
              : "";
          })()}
        </small>
      </div>
    </div>
  );
};

export default IssueCreatedPlugin;
