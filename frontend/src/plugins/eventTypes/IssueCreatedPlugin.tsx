import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import { CloudEventModal } from "../shared/TimelineEventUI";
import { Button } from "../../components/ActionButton";

const IssueCreatedPlugin: React.FC<EventPluginProps> = ({
  event,
  timeInfo,
}) => {
  const [showEventModal, setShowEventModal] = useState(false);

  const changeText = "zaak aangemaakt";

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

      <CloudEventModal
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        cloudEvent={event.originalEvent}
        schemaUrl={(event.originalEvent.data as any)?.schema as string | undefined}
      />
    </>
  );
};

export default IssueCreatedPlugin;
