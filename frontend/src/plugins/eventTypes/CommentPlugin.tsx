import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import type { Comment } from "../../types";
import Card from "../../components/Card";
import { EventHeader, CloudEventModal } from "../shared/TimelineEventUI";
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
  // Support both new (resource_id) and old (item_id) field names
  const itemId = (data.resource_id || data.item_id) as string;
  const comment = (items[itemId] ||
    data.resource_data ||
    data.item_data ||
    data) as unknown as Comment;

  return (
    <>
      <Card padding="sm" id={itemId}>
        <EventHeader
          actor={event.actor}
          timeLabel={timeInfo.relative}
          onTimeClick={() => setShowEventModal(true)}
          rightExtra={
            <Button variant="icon" size="sm" onClick={() => setShowEditModal(true)} title="Bewerken">
              <i className="fa-solid fa-pen" aria-hidden="true"></i>
            </Button>
          }
        />
        <div className="prose max-w-none">
          <p
            className="m-0 mb-2 leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl"
            style={{ color: "var(--text-primary)" }}
          >
            {comment.content || "Geen inhoud"}
          </p>
          {comment.mentions && comment.mentions.length > 0 && (
            <div className="mt-2">
              <small
                className="text-xs sm:text-sm lg:text-sm xl:text-base"
                style={{ color: "var(--text-tertiary)" }}
              >
                Vermeldingen: {comment.mentions.join(", ")}
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
        initialData={comment as unknown as Record<string, unknown>}
        onSubmit={sendEvent}
        zaakId={event.originalEvent.subject || ""}
      />

      <CloudEventModal
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        cloudEvent={event.originalEvent}
        schemaUrl={(data as any)?.schema as string | undefined}
      />
    </>
  );
};

export default CommentPlugin;
