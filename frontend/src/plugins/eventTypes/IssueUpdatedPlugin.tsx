import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import { CloudEventModal } from "../shared/TimelineEventUI";
import { Button } from "../../components/ActionButton";

const IssueUpdatedPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const [showEventModal, setShowEventModal] = useState(false);

  // Generate a clean summary of changes from item_data
  const itemData = data.item_data as Record<string, unknown>;
  const changeKeys = itemData
    ? Object.keys(itemData).filter(
        (key) => key !== "id" && key !== "created_at" && key !== "updated_at",
      )
    : [];

  let changeText: string;
  if (changeKeys.length === 0) {
    changeText = "zaak bijgewerkt";
  } else if (changeKeys.length === 1) {
    const key = changeKeys[0];
    const value = itemData[key];
    let valueText = String(value);

    // Special handling for common fields
    if (key === "title") {
      if (valueText.length > 30) {
        valueText = valueText.substring(0, 30) + "...";
      }
      changeText = `titel gewijzigd naar "${valueText}"`;
    } else if (key === "status") {
      changeText = `status gewijzigd naar "${valueText}"`;
    } else if (key === "assignee") {
      changeText =
        value && value !== null
          ? `toegewezen aan ${valueText}`
          : "toewijzing verwijderd";
    } else {
      if (valueText.length > 30) {
        valueText = valueText.substring(0, 30) + "...";
      }
      changeText = `${key} gewijzigd naar "${valueText}"`;
    }
  } else if (changeKeys.length === 2) {
    changeText = `${changeKeys[0]} en ${changeKeys[1]} gewijzigd`;
  } else {
    changeText = `${changeKeys.length} velden gewijzigd`;
  }

  return (
    <>
      <div className="flex items-center justify-between w-full py-2">
        <span
          className="text-sm sm:text-base lg:text-lg xl:text-xl"
          style={{ color: "var(--text-secondary)" }}
        >
          {event.actor && event.actor !== "system" && (
            <strong style={{ color: "var(--text-primary)" }}>
              {event.actor}
            </strong>
          )}{" "}
          {changeText}
        </span>
        <Button
          variant="link"
          size="sm"
          title={`${timeInfo.date} at ${timeInfo.time}`}
          onClick={() => setShowEventModal(true)}
        >
          {timeInfo.relative}
        </Button>
      </div>

      <CloudEventModal
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        cloudEvent={event.originalEvent}
        schemaUrl={(event.originalEvent.data as any)?.schema as string | undefined}
      />
    </>
  );
};

export default IssueUpdatedPlugin;
