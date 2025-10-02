import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import { EventHeader, CloudEventModal } from "../shared/TimelineEventUI";

const StatusChangePlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const [showEventModal, setShowEventModal] = useState(false);

  const newStatus = data.status || data.new_value || "unknown";
  const changeText = `status gewijzigd naar "${newStatus}"`;

  return (
    <>
      <EventHeader
        actor={event.actor}
        timeLabel={timeInfo.relative}
        onTimeClick={() => setShowEventModal(true)}
      />
      <div className="text-sm sm:text-base lg:text-lg xl:text-xl" style={{ color: "var(--text-secondary)" }}>
        {changeText}
      </div>

      <CloudEventModal
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        cloudEvent={event.originalEvent}
        schemaUrl={(data as any)?.schema as string | undefined}
      />
    </>
  );
};

export default StatusChangePlugin;
