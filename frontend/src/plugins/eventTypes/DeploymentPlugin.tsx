import React from "react";
import type { EventPluginProps } from "./types";
import { EventPluginWrapper } from "../shared/TimelineEventUI";

const DeploymentPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const version = String(data.version) || "unknown";
  const environment =
    typeof data.environment === "string" ? data.environment : "";
  const changeText = `deployed version ${version}${environment ? ` to ${environment}` : ""}`;

  return (
    <EventPluginWrapper
      event={event}
      data={data}
      timeInfo={timeInfo}
    >
      <strong><i className="fa-solid fa-rocket" aria-hidden="true"></i> {changeText}</strong>
      {data.commit_hash && (
        <span className="ml-2 text-xs sm:text-sm lg:text-sm xl:text-base opacity-75">
          (Commit: <code>{String(data.commit_hash).substring(0, 8)}</code>)
        </span>
      )}
    </EventPluginWrapper>
  );
};

export default DeploymentPlugin;
