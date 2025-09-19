import { useState } from "react";
import Modal from "./Modal";
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

const TimelineItem: React.FC<TimelineItemProps> = ({
  event,
  itemType,
  isFirst,
  isLast,
}) => {
  const [showEventModal, setShowEventModal] = useState(false);
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      relative: getRelativeTime(date),
    };
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
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
    // Don't show title for comments - they should be headerless
    if (type === "comment") return "";

    const titles = {
      comment: "",
      status_change: "Status Change",
      llm_analysis: "AI Analysis",
      deployment: "Deployment",
      system_event: "System Event",
      issue_created: "Issue Created",
      issue_updated: "Issue Updated",
      issue_deleted: "Issue Deleted",
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

  // For issue updates, render as a compact single line
  if (itemType === "issue_updated") {
    // Generate a clean summary of changes
    const changeKeys = Object.entries((event.data || {}) as TimelineItemData)
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
      const value = Object.entries((event.data || {}) as TimelineItemData).find(
        ([k]) => k === key,
      )?.[1];
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
      <>
        <div className="timeline-item-compact">
          <div className="timeline-marker">
            <div className="timeline-icon-small">✏️</div>
            {!isLast && <div className="timeline-line" />}
          </div>
          <div className="timeline-compact-content">
            <div className="timeline-compact-header">
              <div className="timeline-meta">
                <span className="timeline-compact-text">
                  {event.actor && event.actor !== "system" && (
                    <strong>{event.actor}</strong>
                  )}{" "}
                  {changeText}
                </span>
                <button
                  type="button"
                  className="timestamp"
                  title={`${timeInfo.date} at ${timeInfo.time}`}
                  onClick={() => setShowEventModal(true)}
                  style={{ background: "none", border: "none", padding: 0 }}
                >
                  {timeInfo.relative}
                </button>
              </div>
            </div>
          </div>
        </div>

        <Modal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          title="CloudEvent"
          maxWidth="800px"
        >
          <pre className="event-data-json">
            {JSON.stringify(event.originalEvent, null, 2)}
          </pre>

          <style>{`
            .event-data-json {
              background: #f6f8fa;
              border: 1px solid #d1d9e0;
              border-radius: 6px;
              padding: 1rem;
              font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
              font-size: 0.75rem;
              line-height: 1.5;
              overflow-x: auto;
              color: #24292f;
              margin: 0;
              white-space: pre-wrap;
              word-wrap: break-word;
            }

            @media (prefers-color-scheme: dark) {
              .event-data-json {
                background: #161b22;
                color: #f0f6fc;
                border-color: #30363d;
              }
            }
          `}</style>
        </Modal>
      </>
    );
  }

  return (
    <div
      className={`timeline-item ${itemType} event-${event.type} ${isFirst ? "first" : ""} ${isLast ? "last" : ""}`}
    >
      <div className="timeline-marker">
        <div className="timeline-icon">{icon}</div>
        {!isLast && <div className="timeline-line" />}
      </div>

      <div className="timeline-body">
        {title && (
          <div className="timeline-header">
            <h4 className="timeline-title">{title}</h4>
            <div className="timeline-meta">
              {event.actor && event.actor !== "system" && (
                <span className="actor">{event.actor}</span>
              )}
              <button
                type="button"
                className="timestamp"
                title={`${timeInfo.date} at ${timeInfo.time}`}
                onClick={() => setShowEventModal(true)}
                style={{ background: "none", border: "none", padding: 0 }}
              >
                {timeInfo.relative}
              </button>
            </div>
          </div>
        )}
        {!title && (
          <button
            type="button"
            className="timeline-header-minimal"
            onClick={() => setShowEventModal(true)}
            style={{
              cursor: "pointer",
              background: "none",
              border: "none",
              width: "100%",
            }}
          >
            <div className="timeline-meta">
              {event.actor && event.actor !== "system" && (
                <span className="actor">{event.actor}</span>
              )}
              <span
                className="timestamp"
                title={`${timeInfo.date} at ${timeInfo.time}`}
              >
                {timeInfo.relative}
              </span>
            </div>
          </button>
        )}

        <div className="timeline-content">{renderEventContent()}</div>
      </div>

      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="CloudEvent"
        maxWidth="800px"
      >
        <pre className="event-data-json">
          {JSON.stringify(event.originalEvent, null, 2)}
        </pre>

        <style>{`
          .event-data-json {
            background: #f6f8fa;
            border: 1px solid #d1d9e0;
            border-radius: 6px;
            padding: 1rem;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
            font-size: 0.75rem;
            line-height: 1.5;
            overflow-x: auto;
            color: #24292f;
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
          }

          @media (prefers-color-scheme: dark) {
            .event-data-json {
              background: #161b22;
              color: #f0f6fc;
              border-color: #30363d;
            }
          }
        `}</style>
      </Modal>
    </div>
  );
};

export default TimelineItem;
