import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import Card from "../../components/Card";
import Modal from "../../components/Modal";

const CommentPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const [showEventModal, setShowEventModal] = useState(false);
  const { content, mentions } = (data.item_data || data) as {
    content?: unknown;
    mentions?: unknown[];
  };

  return (
    <>
      <Card padding="sm">
        <div className="flex items-center justify-between gap-4 w-full mb-3">
          {event.actor && event.actor !== "system" && (
            <span className="font-semibold text-sm">{event.actor}</span>
          )}
          <button
            type="button"
            className="text-xs hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors duration-150"
            style={{ color: "var(--text-tertiary)" }}
            title={`${timeInfo.date} at ${timeInfo.time}`}
            onClick={() => setShowEventModal(true)}
          >
            {timeInfo.relative}
          </button>
        </div>
        <div className="prose prose-sm max-w-none">
          <p className="m-0 mb-2 leading-relaxed text-text-primary">
            {typeof content === "string" ? content : "Geen inhoud"}
          </p>
          {Array.isArray(mentions) && mentions.length > 0 && (
            <div className="mt-2">
              <small className="text-text-tertiary text-xs">
                Vermeldingen: {mentions.map(String).join(", ")}
              </small>
            </div>
          )}
        </div>
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

export default CommentPlugin;
