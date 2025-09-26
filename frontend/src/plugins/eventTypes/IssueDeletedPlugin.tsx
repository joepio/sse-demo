import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import Modal from "../../components/Modal";
import { Button } from "../../components/ActionButton";

const IssueDeletedPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const [showEventModal, setShowEventModal] = useState(false);

  const changeText = "zaak verwijderd";

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
          {data.reason && (
            <span className="ml-2 text-xs sm:text-sm lg:text-sm xl:text-base opacity-75">
              (Reden: {String(data.reason)})
            </span>
          )}
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

export default IssueDeletedPlugin;
