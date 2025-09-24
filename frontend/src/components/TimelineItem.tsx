import { useState } from "react";
import Modal from "./Modal";
import Card, { CardHeader, CardContent } from "./Card";
import type {
  TimelineEvent,
  TimelineItemType,
  TimelineItemData,
} from "../types";
import { getEventPlugin } from "../plugins/eventTypes";

interface TimelineItemProps {
  event: TimelineEvent;
  itemType: TimelineItemType;
  isFirst: boolean;
  isLast: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ event, itemType }) => {
  const [showEventModal, setShowEventModal] = useState(false);
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("nl-NL"),
      time: date.toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      relative: getRelativeTime(date),
    };
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "zojuist";
    if (minutes < 60) return `${minutes}m geleden`;
    if (hours < 24) return `${hours}u geleden`;
    if (days < 7) return `${days}d geleden`;
    return date.toLocaleDateString("nl-NL");
  };

  const getEventIcon = (
    type: TimelineItemType,
    eventType: "created" | "updated" | "deleted",
  ) => {
    const baseIcons = {
      comment: "💬",
      status_change: "🔄",
      llm_analysis: "🤖",
      deployment: "🚀",
      system_event: "⚙️",
      issue_created: "📝",
      issue_updated: "✏️",
      issue_deleted: "🗑️",
      task: "📋",
    };

    const icon = baseIcons[type] || "📋";

    if (eventType === "deleted") return "❌";
    if (eventType === "updated") return "✏️";

    return icon;
  };

  const getEventTitle = (
    type: TimelineItemType,
    eventType: "created" | "updated" | "deleted",
  ) => {
    // Show proper title for comments with commenter info
    if (type === "comment") return "Opmerking";

    // For tasks, try to show the CTA in the title
    if (type === "task") {
      const eventData = (event.data || {}) as any;
      const taskData = eventData.item_data || {};
      if (taskData.cta) {
        if (eventType === "updated") {
          // Check if task was completed
          if (taskData.completed) {
            return `Taak Voltooid: ${taskData.cta}`;
          } else {
            return `Taak Bijgewerkt: ${taskData.cta}`;
          }
        } else {
          return `Nieuwe Taak: ${taskData.cta}`;
        }
      }
    }

    const titles = {
      comment: "Opmerking",
      status_change: "Status Wijziging",
      llm_analysis: "AI Analyse",
      deployment: "Uitrol",
      system_event: "Systeem Event",
      issue_created: "Zaak Aangemaakt",
      issue_updated: "Zaak Bijgewerkt",
      issue_deleted: "Zaak Verwijderd",
      task: "Nieuwe Taak",
    };

    const baseTitle = titles[type] || "Event";

    // Don't add redundant "Updated" for issue_updated events
    if (type === "issue_updated") return "Issue Updated";

    if (eventType === "deleted") return `${baseTitle} Deleted`;
    if (eventType === "updated") return `${baseTitle} Updated`;

    return baseTitle;
  };

  const renderEventContent = () => {
    const data = (event.data || {}) as TimelineItemData;
    const timeInfo = formatTimestamp(event.timestamp);

    // Use plugin system for content rendering
    const PluginComponent = getEventPlugin(itemType);
    return <PluginComponent event={event} data={data} timeInfo={timeInfo} />;
  };

  const timeInfo = formatTimestamp(event.timestamp);
  const icon = getEventIcon(itemType, event.type);
  const title = getEventTitle(itemType, event.type);

  // Simple text-only updates for certain event types
  if (
    itemType === "issue_updated" ||
    itemType === "status_change" ||
    itemType === "issue_created" ||
    (itemType === "task" && event.type === "updated")
  ) {
    let changeText: string;

    if (itemType === "status_change") {
      // For status changes, show a specific message
      const data = (event.data || {}) as TimelineItemData;
      const newStatus = data.status || data.new_value || "unknown";
      changeText = `status gewijzigd naar "${newStatus}"`;
    } else if (itemType === "issue_created") {
      changeText = "zaak aangemaakt";
    } else if (itemType === "task" && event.type === "updated") {
      // For completed tasks, show as simple text update
      const eventData = (event.data || {}) as any;
      const taskData = eventData.item_data || {};
      if (taskData.completed && taskData.cta) {
        changeText = `taak voltooid: ${taskData.cta}`;
      } else {
        changeText = "taak bijgewerkt";
      }
    } else {
      // Generate a clean summary of changes for issue updates
      const changeKeys = Object.entries((event.data || {}) as TimelineItemData)
        .filter(
          ([key]) =>
            key !== "item_type" &&
            key !== "item_id" &&
            key !== "actor" &&
            key !== "timestamp",
        )
        .map(([key]) => key);

      if (changeKeys.length === 0) {
        changeText = "zaak bijgewerkt";
      } else if (changeKeys.length === 1) {
        const key = changeKeys[0];
        const value = Object.entries(
          (event.data || {}) as TimelineItemData,
        ).find(([k]) => k === key)?.[1];
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
  }

  // For comments, render as cards but without headers
  if (itemType === "comment") {
    return (
      <>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between gap-4 w-full mb-3">
              {event.actor && event.actor !== "system" && (
                <span
                  className="font-semibold text-sm"
                  style={{ color: "var(--link-primary)" }}
                >
                  {event.actor}
                </span>
              )}
              <button
                type="button"
                className="text-sm hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors duration-150"
                style={{ color: "var(--text-tertiary)" }}
                title={`${timeInfo.date} at ${timeInfo.time}`}
                onClick={() => setShowEventModal(true)}
              >
                {timeInfo.relative}
              </button>
            </div>
            {renderEventContent()}
          </CardContent>
        </Card>

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
  }

  return (
    <>
      <Card>
        {title && (
          <CardHeader>
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-3">
                <span className="text-base">{icon}</span>
                <h4
                  className="text-base font-semibold m-0"
                  style={{ color: "var(--text-primary)" }}
                >
                  {title}
                </h4>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {event.actor && event.actor !== "system" && (
                  <span
                    className="font-semibold"
                    style={{ color: "var(--link-primary)" }}
                  >
                    {event.actor}
                  </span>
                )}
                <button
                  type="button"
                  className="hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors duration-150"
                  style={{ color: "var(--text-tertiary)" }}
                  title={`${timeInfo.date} at ${timeInfo.time}`}
                  onClick={() => setShowEventModal(true)}
                >
                  {timeInfo.relative}
                </button>
              </div>
            </div>
          </CardHeader>
        )}

        {!title && (
          <CardHeader>
            <button
              type="button"
              className="timeline-header-hover w-full cursor-pointer transition-colors duration-150 bg-transparent border-none p-0"
              onClick={() => setShowEventModal(true)}
            >
              <div className="flex items-center justify-between gap-4 w-full">
                {event.actor && event.actor !== "system" && (
                  <span
                    className="font-semibold text-sm"
                    style={{ color: "var(--link-primary)" }}
                  >
                    {event.actor}
                  </span>
                )}
                <span
                  className="text-sm hover:underline"
                  style={{ color: "var(--text-tertiary)" }}
                  title={`${timeInfo.date} at ${timeInfo.time}`}
                >
                  {timeInfo.relative}
                </span>
              </div>
            </button>
          </CardHeader>
        )}

        <CardContent>{renderEventContent()}</CardContent>
      </Card>

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

export default TimelineItem;
