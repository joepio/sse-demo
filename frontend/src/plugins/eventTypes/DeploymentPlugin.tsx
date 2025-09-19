import React from "react";
import type { EventPluginProps } from "./types";

const DeploymentPlugin: React.FC<EventPluginProps> = ({ data }) => {
  return (
    <div className="timeline-content-deployment">
      <p>
        Deployed version <strong>{String(data.version) || "unknown"}</strong>
        {typeof data.environment === "string" && ` to ${data.environment}`}
      </p>
      {data.commit_hash && (
        <div className="commit-info">
          <small>
            Commit: <code>{String(data.commit_hash).substring(0, 8)}</code>
          </small>
        </div>
      )}
    </div>
  );
};

export default DeploymentPlugin;
