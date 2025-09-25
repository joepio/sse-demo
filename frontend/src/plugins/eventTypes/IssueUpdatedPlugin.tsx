import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import Modal from "../../components/Modal";

const IssueUpdatedPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const [showEventModal, setShowEventModal] = useState(false);

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
    changeText = "zaak bijgewerkt";
  } else if (changeKeys.length === 1) {
    const key = changeKeys[0];
    const value = Object.entries(data).find(([k]) => k === key)?.[1];
    let valueText = String(value);
    if (valueText.length > 30) {
      valueText = valueText.substring(0, 30) + "...";
    }
    changeText = `${key} gewijzigd naar "${valueText}"`;
  } else if (changeKeys.length === 2) {
    changeText = `${changeKeys[0]} en ${changeKeys[1]} gewijzigd`;
  } else {
    changeText = `${changeKeys.length} velden gewijzigd`;
  }

  return (
    <>
      <div className="flex items-center justify-between w-full py-2">
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {event.actor && event.actor !== "system" && (
            <strong style={{ color: "var(--text-primary)" }}>
              {event.actor}
            </strong>
          )}{" "}
          {changeText}
        </span>
        <button
          type="button"
          className="text-xs hover:underline bg-transparent border-none p-0 cursor-pointer transition-colors duration-150"
          style={{ color: "var(--text-tertiary)" }}
          title={`${timeInfo.date} at ${timeInfo.time}`}
          onClick={() => setShowEventModal(true)}
        >
          {timeInfo.relative}
        </button>
      </div>

      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="CloudEvent"
        maxWidth="800px"
      >
        <pre
          className="border rounded-md p-4 font-mono text-xs leading-relaxed overflow-x-auto m-0 whitespace-pre-wrap break-words"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            borderColor: "var(--border-primary)",
            color: "var(--text-primary)",
          }}
        >
          {JSON.stringify(event.originalEvent, null, 2)}
        </pre>
      </Modal>
    </>
  );
};

export default IssueUpdatedPlugin;
