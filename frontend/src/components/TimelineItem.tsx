import React, { useState } from "react";
import Modal from "./Modal";
import type {
  TimelineEvent,
  TimelineItemType,
  TimelineItemData,
} from "../types";

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

  const getRelativeTime = (date: Date) => {
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

    switch (itemType) {
      case "comment":
        // Handle nested item_data structure for timeline comments
        const commentData = data.item_data || data;
        const content = commentData.content || data.content;
        const mentions = commentData.mentions || data.mentions;
        const editedAt = commentData.edited_at || data.edited_at;

        return (
          <div className="timeline-content-comment">
            <p>{content || "No content"}</p>
            {mentions && mentions.length > 0 && (
              <div className="mentions">
                <small>Mentions: {mentions.join(", ")}</small>
              </div>
            )}
            {editedAt && (
              <small className="edited-indicator">
                Edited {getRelativeTime(new Date(editedAt))}
              </small>
            )}
          </div>
        );

      case "status_change":
        return (
          <div className="timeline-content-status">
            <p>
              Changed <strong>{data.field || "status"}</strong> from{" "}
              <span className="old-value">
                {String(data.old_value) || "unknown"}
              </span>{" "}
              to{" "}
              <span className="new-value">
                {String(data.new_value) || "unknown"}
              </span>
            </p>
            {data.reason && (
              <p className="reason">Reason: {String(data.reason)}</p>
            )}
          </div>
        );

      case "llm_analysis":
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
                Model: {data.model || "unknown"}
                {data.confidence &&
                  ` • Confidence: ${Math.round(data.confidence * 100)}%`}
              </small>
            </div>
          </div>
        );

      case "deployment":
        return (
          <div className="timeline-content-deployment">
            <p>
              Deployed version <strong>{data.version || "unknown"}</strong>
              {data.environment && ` to ${data.environment}`}
            </p>
            {data.commit_hash && (
              <div className="commit-info">
                <small>
                  Commit: <code>{data.commit_hash.substring(0, 8)}</code>
                </small>
              </div>
            )}
          </div>
        );

      case "issue_created":
        return (
          <div className="timeline-content-issue-created">
            <p>
              <strong>{String(data.title) || "Issue created"}</strong>
            </p>
            {(() => {
              const description = data.description;
              return typeof description === "string" && description ? (
                <p>{description}</p>
              ) : null;
            })()}
            <div className="issue-meta">
              <small>
                Status: {String(data.status) || "open"}
                {(() => {
                  const priority = data.priority;
                  return typeof priority === "string" && priority
                    ? ` • Priority: ${priority}`
                    : "";
                })()}
                {(() => {
                  const assignee = data.assignee;
                  return typeof assignee === "string" && assignee
                    ? ` • Assigned to: ${assignee}`
                    : "";
                })()}
              </small>
            </div>
          </div>
        );

      case "issue_updated":
        // Generate a clean summary of changes
        const changeKeys = Object.entries(data)
          .filter(
            ([key, value]) =>
              key !== "item_type" &&
              key !== "item_id" &&
              key !== "actor" &&
              key !== "timestamp",
          )
          .map(([key, value]) => key);

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

      case "issue_deleted":
        return (
          <div className="timeline-content-issue-deleted">
            <p>Issue deleted</p>
            {data.reason && <p>Reason: {String(data.reason)}</p>}
          </div>
        );

      default:
        return (
          <div className="timeline-content-generic">
            <p>System event occurred</p>
            <details>
              <summary>Event data</summary>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </details>
          </div>
        );
    }
  };

  const timeInfo = formatTimestamp(event.timestamp);
  const icon = getEventIcon(itemType, event.type);
  const title = getEventTitle(itemType, event.type);

  // For issue updates, render as a compact single line
  if (itemType === "issue_updated") {
    // Generate a clean summary of changes
    const changeKeys = Object.entries((event.data || {}) as TimelineItemData)
      .filter(
        ([key, value]) =>
          key !== "item_type" &&
          key !== "item_id" &&
          key !== "actor" &&
          key !== "timestamp",
      )
      .map(([key, value]) => key);

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
                <time
                  className="timestamp"
                  dateTime={event.timestamp}
                  title={`${timeInfo.date} at ${timeInfo.time}`}
                  onClick={() => setShowEventModal(true)}
                >
                  {timeInfo.relative}
                </time>
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
              <time
                className="timestamp"
                dateTime={event.timestamp}
                title={`${timeInfo.date} at ${timeInfo.time}`}
                onClick={() => setShowEventModal(true)}
              >
                {timeInfo.relative}
              </time>
            </div>
          </div>
        )}
        {!title && (
          <div
            className="timeline-header-minimal"
            onClick={() => setShowEventModal(true)}
          >
            <div className="timeline-meta">
              {event.actor && event.actor !== "system" && (
                <span className="actor">{event.actor}</span>
              )}
              <time
                className="timestamp"
                dateTime={event.timestamp}
                title={`${timeInfo.date} at ${timeInfo.time}`}
              >
                {timeInfo.relative}
              </time>
            </div>
          </div>
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
