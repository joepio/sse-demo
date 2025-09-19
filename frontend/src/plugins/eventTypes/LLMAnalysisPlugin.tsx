import React from "react";
import type { EventPluginProps } from "./types";

const LLMAnalysisPlugin: React.FC<EventPluginProps> = ({ data }) => {
  return (
    <div className="timeline-content-llm">
      <div className="llm-prompt">
        <strong>Prompt:</strong> {data.prompt || "No prompt provided"}
      </div>
      <div className="llm-response">
        <strong>Response:</strong>
        <p>{data.response || "No response"}</p>
      </div>
      <div className="llm-meta">
        <small>
          Model: {String(data.model) || "unknown"}
          {typeof data.confidence === "number" &&
            ` • Confidence: ${Math.round(data.confidence * 100)}%`}
        </small>
      </div>
    </div>
  );
};

export default LLMAnalysisPlugin;
