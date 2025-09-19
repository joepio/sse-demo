import React from "react";
import type { EventPluginProps } from "./types";

const StatusChangePlugin: React.FC<EventPluginProps> = ({ data }) => {
  return (
    <div className="timeline-content-status">
      <p>
        Changed <strong>{data.field || "status"}</strong> from{" "}
        <span className="old-value">{String(data.old_value) || "unknown"}</span>{" "}
        to{" "}
        <span className="new-value">{String(data.new_value) || "unknown"}</span>
      </p>
      {data.reason && <p className="reason">Reason: {String(data.reason)}</p>}
    </div>
  );
};

export default StatusChangePlugin;
