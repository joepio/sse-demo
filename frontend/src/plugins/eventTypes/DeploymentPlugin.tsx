import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import Modal from "../../components/Modal";
import { Button } from "../../components/ActionButton";

const DeploymentPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const [showEventModal, setShowEventModal] = useState(false);

  const version = String(data.version) || "unknown";
  const environment =
    typeof data.environment === "string" ? data.environment : "";
  const changeText = `deployed version ${version}${environment ? ` to ${environment}` : ""}`;

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
          {data.commit_hash && (
            <span className="ml-2 text-xs sm:text-sm lg:text-sm xl:text-base opacity-75">
              (Commit: <code>{String(data.commit_hash).substring(0, 8)}</code>)
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

export default DeploymentPlugin;
