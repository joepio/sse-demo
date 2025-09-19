import React from "react";
import type { EventPluginProps } from "./types";

const IssueDeletedPlugin: React.FC<EventPluginProps> = ({ data }) => {
  return (
    <div className="timeline-content-issue-deleted">
      <p>Zaak verwijderd</p>
      {data.reason && <p>Reden: {String(data.reason)}</p>}
    </div>
  );
};

export default IssueDeletedPlugin;
