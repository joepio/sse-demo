import React from "react";
import type { EventPluginProps } from "./types";
import { EventPluginWrapper } from "../shared/TimelineEventUI";

const IssueCreatedPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const changeText = "zaak aangemaakt";

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

export default IssueCreatedPlugin;
