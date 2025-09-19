import React from "react";
import type { EventPluginProps } from "./types";

const SystemEventPlugin: React.FC<EventPluginProps> = ({ data }) => {
  return (
    <div className="timeline-content-generic">
      <p>System event occurred</p>
      <details>
        <summary>Event data</summary>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
};

export default SystemEventPlugin;
