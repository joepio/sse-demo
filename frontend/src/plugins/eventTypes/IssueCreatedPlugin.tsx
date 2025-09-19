import React from "react";
import type { EventPluginProps } from "./types";

const IssueCreatedPlugin: React.FC<EventPluginProps> = ({ data }) => {
  return (
    <div className="timeline-content-issue-created">
      <p>
        <strong>{String(data.title) || "Issue created"}</strong>
      </p>
      {(() => {
        const description = data.description;
        return typeof description === "string" && description ? (
          <p>{description}</p>
        ) : null;
      })()}
      <div className="issue-meta">
        <small>
          Status: {String(data.status) || "open"}
          {(() => {
            const priority = data.priority;
            return typeof priority === "string" && priority
              ? ` • Priority: ${String(priority)}`
              : "";
          })()}
          {(() => {
            const assignee = data.assignee;
            return typeof assignee === "string" && assignee
              ? ` • Assigned to: ${String(assignee)}`
              : "";
          })()}
        </small>
      </div>
    </div>
  );
};

export default IssueCreatedPlugin;
