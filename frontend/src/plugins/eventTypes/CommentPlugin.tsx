import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import SchemaEditForm from "../../components/SchemaEditForm";
import { Button } from "../../components/ActionButton";
import { useSSE } from "../../contexts/SSEContext";

const CommentPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const { sendEvent, items } = useSSE();
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Get the current state of the comment from the items store
  const itemId = (data.item_id as string) || "";
  const commentData = items[itemId] || data.item_data || data;

  const { content, mentions } = commentData as {
    content?: unknown;
    mentions?: unknown[];
  };

  return (
    <>
      <Card padding="sm">
        <div className="flex items-center justify-between gap-4 w-full mb-3">
          {event.actor && event.actor !== "system" && (
            <span className="font-semibold text-sm sm:text-base lg:text-lg xl:text-xl">
              {event.actor}
            </span>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="icon"
              size="sm"
              onClick={() => setShowEditModal(true)}
              title="Bewerken"
            >
              ✏️
            </Button>
            <Button
              variant="link"
              size="sm"
              title={`${timeInfo.date} at ${timeInfo.time}`}
              onClick={() => setShowEventModal(true)}
            >
              {timeInfo.relative}
            </Button>
          </div>
        </div>
        <div className="prose max-w-none">
          <p
            className="m-0 mb-2 leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl"
            style={{ color: "var(--text-primary)" }}
          >
            {typeof content === "string" ? content : "Geen inhoud"}
          </p>
          {Array.isArray(mentions) && mentions.length > 0 && (
            <div className="mt-2">
              <small
                className="text-xs sm:text-sm lg:text-sm xl:text-base"
                style={{ color: "var(--text-tertiary)" }}
              >
                Vermeldingen: {mentions.map(String).join(", ")}
              </small>
            </div>
          )}
        </div>
      </Card>

      <SchemaEditForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        itemType="comment"
        itemId={itemId || event.id}
        initialData={commentData}
        onSubmit={sendEvent}
        zaakId={event.originalEvent.subject || ""}
      />

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

export default CommentPlugin;
