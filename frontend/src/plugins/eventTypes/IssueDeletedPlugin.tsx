import React from "react";
import type { EventPluginProps } from "./types";
import { EventPluginWrapper } from "../shared/TimelineEventUI";

const IssueDeletedPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const changeText = "zaak verwijderd";

  return (
    <EventPluginWrapper
      event={event}
      data={data}
      timeInfo={timeInfo}
    >
      <span>{changeText}</span>
      {data.reason && (
        <span className="ml-2 text-xs sm:text-sm lg:text-sm xl:text-base opacity-75">
          (Reden: {String(data.reason)})
        </span>
      )}
    </EventPluginWrapper>
  );
};

export default IssueDeletedPlugin;
