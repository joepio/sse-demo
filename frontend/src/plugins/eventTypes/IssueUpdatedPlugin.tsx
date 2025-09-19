import React from "react";
import type { EventPluginProps } from "./types";

const IssueUpdatedPlugin: React.FC<EventPluginProps> = ({ data }) => {
  // Generate a clean summary of changes
  const changeKeys = Object.entries(data)
    .filter(
      ([key]) =>
        key !== "item_type" &&
        key !== "item_id" &&
        key !== "actor" &&
        key !== "timestamp",
    )
    .map(([key]) => key);

  let changeText: string;
  if (changeKeys.length === 0) {
    changeText = "updated issue";
  } else if (changeKeys.length === 1) {
    const key = changeKeys[0];
    const value = Object.entries(data).find(([k]) => k === key)?.[1];
    let valueText = String(value);
    if (valueText.length > 30) {
      valueText = valueText.substring(0, 30) + "...";
    }
    changeText = `${key} updated to "${valueText}"`;
  } else if (changeKeys.length === 2) {
    changeText = `${changeKeys[0]} and ${changeKeys[1]} updated`;
  } else {
    changeText = `${changeKeys.length} fields updated`;
  }
  return (
    <div className="timeline-content-issue-updated">
      <p>{changeText}</p>
    </div>
  );
};

export default IssueUpdatedPlugin;
