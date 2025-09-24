import React from "react";
import type { EventPluginProps } from "./types";

const TextOnlyPreviewPlugin: React.FC<EventPluginProps> = ({ data }) => {
  const itemData = (data.item_data || {}) as Record<string, unknown>;

  // Extract the text content based on the event type and data structure
  const getTextContent = (): string => {
    // Handle different event types that should show as simple text updates
    if (data.item_type === "status_change") {
      const field = itemData.field || "status";
      const oldValue = itemData.old_value || "unknown";
      const newValue = itemData.new_value || "unknown";
      const reason = itemData.reason;

      let text = `${field} gewijzigd van "${oldValue}" naar "${newValue}"`;
      if (reason) {
        text += ` - ${reason}`;
      }
      return text;
    }

    if (data.item_type === "field_update") {
      const field = itemData.field || "field";
      const oldValue = itemData.old_value || "";
      const newValue = itemData.new_value || "";

      if (field === "assignee") {
        return oldValue
          ? `Toegewezen aan ${newValue} (was: ${oldValue})`
          : `Toegewezen aan ${newValue}`;
      }

      if (field === "priority") {
        return `Prioriteit gewijzigd naar ${newValue}`;
      }

      return `${field} gewijzigd naar "${newValue}"`;
    }

    if (data.item_type === "system_update") {
      return itemData.message || "Systeem update";
    }

    if (data.item_type === "llm_analysis") {
      const response = itemData.response;
      if (typeof response === "string") {
        // Truncate long responses for preview
        return response.length > 200
          ? `${response.substring(0, 200)}...`
          : response;
      }
      return "AI-analyse uitgevoerd";
    }

    if (data.item_type === "planning") {
      return "planning gewijzigd";
    }

    // Fallback for any other text content
    if (itemData.content && typeof itemData.content === "string") {
      return itemData.content;
    }

    if (itemData.message && typeof itemData.message === "string") {
      return itemData.message;
    }

    if (itemData.description && typeof itemData.description === "string") {
      return itemData.description;
    }

    // Final fallback
    return "Update uitgevoerd";
  };

  const textContent = getTextContent();

  return (
    <div className="p-0">
      <div className="prose prose-sm max-w-none">
        <p className="m-0 leading-relaxed text-text-primary">{textContent}</p>

        {/* Show additional metadata if available */}
        {itemData.confidence && (
          <div className="mt-2">
            <small className="text-text-tertiary text-xs">
              Betrouwbaarheid:{" "}
              {Math.round((itemData.confidence as number) * 100)}%
            </small>
          </div>
        )}

        {itemData.model && (
          <div className="mt-1">
            <small className="text-text-tertiary text-xs">
              Model: {itemData.model}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextOnlyPreviewPlugin;
