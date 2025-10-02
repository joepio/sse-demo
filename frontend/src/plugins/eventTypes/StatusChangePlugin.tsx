import React from "react";
import type { EventPluginProps } from "./types";
import { EventPluginWrapper } from "../shared/TimelineEventUI";

const StatusChangePlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const newStatus = data.status || data.new_value || "unknown";
  const changeText = `status gewijzigd naar "${newStatus}"`;

  return (
    <EventPluginWrapper
      event={event}
      data={data}
      timeInfo={timeInfo}
    >
      <span>{changeText}</span>
    </EventPluginWrapper>
  );
};

export default StatusChangePlugin;
