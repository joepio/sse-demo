import React from "react";
import type { EventPluginProps } from "./types";

const IssueDeletedPlugin: React.FC<EventPluginProps> = ({ data }) => {
  return (
    <div className="timeline-content-issue-deleted">
      <p>Issue deleted</p>
      {data.reason && <p>Reason: {String(data.reason)}</p>}
    </div>
  );
};

export default IssueDeletedPlugin;
