import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import Modal from "../../components/Modal";

const SystemEventPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const [showEventModal, setShowEventModal] = useState(false);

  const getChangeText = (): string => {
    const itemTypeStr = String(
      data.item_type || event.originalEvent.type || "",
    );

    if (itemTypeStr.includes("status")) {
      const newStatus = data.status || data.new_value || "unknown";
      return `status gewijzigd naar "${newStatus}"`;
    } else if (itemTypeStr.includes("field")) {
      return "veld bijgewerkt";
    } else if (itemTypeStr.includes("system")) {
      return "systeem update";
    } else if (
      itemTypeStr.includes("llm") ||
      itemTypeStr.includes("analysis")
    ) {
      return "AI-analyse uitgevoerd";
    } else if (itemTypeStr.includes("planning")) {
      return "planning gewijzigd";
    } else if (itemTypeStr.includes("task") && event.type === "created") {
      return "taak aangemaakt";
    } else if (itemTypeStr.includes("task") && event.type === "updated") {
      // For completed tasks, show completion message
      const taskData = (data.patch || data.item_data || {}) as Record<
        string,
        unknown
      >;
      if (taskData.completed) {
        const taskCTA = String(taskData.cta || "Taak");
        return `taak voltooid: ${taskCTA}`;
      } else {
        return "taak bijgewerkt";
      }
    } else if (
      itemTypeStr.includes("issue") &&
      itemTypeStr.includes("created")
    ) {
      return "zaak aangemaakt";
    } else if (
      itemTypeStr.includes("issue") &&
      itemTypeStr.includes("updated")
    ) {
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

      if (changeKeys.length === 0) {
        return "zaak bijgewerkt";
      } else if (changeKeys.length === 1) {
        const key = changeKeys[0];
        const value = Object.entries(data).find(([k]) => k === key)?.[1];
        let valueText = String(value);
        if (valueText.length > 30) {
          valueText = valueText.substring(0, 30) + "...";
        }
        return `${key} gewijzigd naar "${valueText}"`;
      } else if (changeKeys.length === 2) {
        return `${changeKeys[0]} en ${changeKeys[1]} gewijzigd`;
      } else {
        return `${changeKeys.length} velden gewijzigd`;
      }
    }

    return "systeem event";
  };

  return (
    <>
      <div className="flex items-center justify-between w-full py-2">
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {event.actor && event.actor !== "system" && (
            <strong style={{ color: "var(--text-primary)" }}>
              {event.actor}
            </strong>
          )}{" "}
          {getChangeText()}
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

export default SystemEventPlugin;
