import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import { EventHeader, CloudEventModal } from "../shared/TimelineEventUI";

const SystemEventPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const [showEventModal, setShowEventModal] = useState(false);

  const getChangeText = (): string => {
    // Extract item type from schema URL or fall back to item_type field
    let itemType = "unknown";
    const schema = data.schema as string;
    if (schema) {
      const schemaName = schema.split("/").pop();
      if (schemaName) {
        itemType = schemaName.toLowerCase();
      }
    } else if (data.item_type) {
      itemType = data.item_type as string;
    }

    // Determine if this is a create, update, or delete
    const resourceData = data.resource_data || data.item_data;
    const patch = data.patch as Record<string, unknown> | undefined;
    const isCreate = !!resourceData;
    const isDelete = patch && patch._deleted === true;
    const isUpdate = patch && !isDelete;

    // Handle different item types with meaningful messages
    switch (itemType) {
      case "task":
        if (isCreate) {
          return "taak aangemaakt";
        } else if (isUpdate && patch) {
          if (patch.completed) {
            return "taak voltooid";
          }
          return "taak bijgewerkt";
        } else if (isDelete) {
          return "taak verwijderd";
        }
        break;

      case "comment":
        if (isCreate) {
          return "reactie toegevoegd";
        } else if (isUpdate) {
          return "reactie gewijzigd";
        } else if (isDelete) {
          return "reactie verwijderd";
        }
        break;

      case "planning":
        if (isCreate) {
          return "planning aangemaakt";
        } else if (isUpdate) {
          return "planning bijgewerkt";
        } else if (isDelete) {
          return "planning verwijderd";
        }
        break;

      case "issue":
        if (isCreate) {
          return "zaak aangemaakt";
        } else if (isUpdate && patch) {
          // For issue updates, show which fields changed
          const changeKeys = Object.keys(patch).filter(
            (key) =>
              key !== "id" && key !== "created_at" && key !== "updated_at" && !key.startsWith("_"),
          );

          if (changeKeys.length === 1) {
            const key = changeKeys[0];
            const value = patch[key];
            let valueText = String(value);

            // Special handling for common fields
            if (key === "title") {
              if (valueText.length > 30) {
                valueText = valueText.substring(0, 30) + "...";
              }
              return `titel gewijzigd naar "${valueText}"`;
            } else if (key === "status") {
              return `status gewijzigd naar "${valueText}"`;
            } else if (key === "assignee") {
              return value && value !== null
                ? `toegewezen aan ${valueText}`
                : "toewijzing verwijderd";
            } else {
              if (valueText.length > 30) {
                valueText = valueText.substring(0, 30) + "...";
              }
              return `${key} gewijzigd naar "${valueText}"`;
            }
          } else if (changeKeys.length === 2) {
            return `${changeKeys[0]} en ${changeKeys[1]} gewijzigd`;
          } else if (changeKeys.length > 2) {
            return `${changeKeys.length} velden gewijzigd`;
          }
          return "zaak bijgewerkt";
        } else if (isDelete) {
          return "zaak verwijderd";
        }
        break;

      default:
        // Fallback for unknown item types
        if (isCreate) {
          return `${itemType} aangemaakt`;
        } else if (isUpdate) {
          return `${itemType} bijgewerkt`;
        } else if (isDelete) {
          return `${itemType} verwijderd`;
        }
        break;
    }

    return "systeem event";
  };

  return (
    <>
      <EventHeader
        actor={event.actor}
        timeLabel={timeInfo.relative}
        onTimeClick={() => setShowEventModal(true)}
      />
      <div className="text-sm sm:text-base lg:text-lg xl:text-xl" style={{ color: "var(--text-secondary)" }}>
        {getChangeText()}
      </div>

      <CloudEventModal
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        cloudEvent={event.originalEvent}
        schemaUrl={(data as any)?.schema as string | undefined}
      />
    </>
  );
};

export default SystemEventPlugin;
