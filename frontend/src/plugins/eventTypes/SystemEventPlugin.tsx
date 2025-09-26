import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import Modal from "../../components/Modal";
import { Button } from "../../components/ActionButton";

const SystemEventPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const [showEventModal, setShowEventModal] = useState(false);

  const getChangeText = (): string => {
    const itemType = data.item_type as string;
    const eventType = event.originalEvent.type;

    // Handle different item types with meaningful messages
    switch (itemType) {
      case "task":
        if (eventType === "item.created") {
          return "taak aangemaakt";
        } else if (eventType === "item.updated") {
          const patchData = data.patch as Record<string, unknown>;
          if (patchData?.completed) {
            return "taak voltooid";
          }
          return "taak bijgewerkt";
        } else if (eventType === "item.deleted") {
          return "taak verwijderd";
        }
        break;

      case "comment":
        if (eventType === "item.created") {
          return "reactie toegevoegd";
        } else if (eventType === "item.updated") {
          return "reactie gewijzigd";
        } else if (eventType === "item.deleted") {
          return "reactie verwijderd";
        }
        break;

      case "planning":
        if (eventType === "item.created") {
          return "planning aangemaakt";
        } else if (eventType === "item.updated") {
          return "planning bijgewerkt";
        } else if (eventType === "item.deleted") {
          return "planning verwijderd";
        }
        break;

      case "issue":
        if (eventType === "item.created") {
          return "zaak aangemaakt";
        } else if (eventType === "item.updated") {
          // For issue updates, show which fields changed
          const itemData = data.item_data as Record<string, unknown>;
          if (itemData) {
            const changeKeys = Object.keys(itemData).filter(
              (key) =>
                key !== "id" && key !== "created_at" && key !== "updated_at",
            );

            if (changeKeys.length === 1) {
              const key = changeKeys[0];
              const value = itemData[key];
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
          }
          return "zaak bijgewerkt";
        } else if (eventType === "item.deleted") {
          return "zaak verwijderd";
        }
        break;

      default:
        // Fallback for unknown item types
        if (eventType === "item.created") {
          return `${itemType} aangemaakt`;
        } else if (eventType === "item.updated") {
          return `${itemType} bijgewerkt`;
        } else if (eventType === "item.deleted") {
          return `${itemType} verwijderd`;
        }
        break;
    }

    return "systeem event";
  };

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
          {getChangeText()}
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

      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="CloudEvent"
        maxWidth="800px"
      >
        <pre
          className="border rounded-md p-4 font-mono text-xs sm:text-sm lg:text-base xl:text-lg leading-relaxed overflow-x-auto m-0 whitespace-pre-wrap break-words"
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
