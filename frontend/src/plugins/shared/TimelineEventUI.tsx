import React from "react";
import { Button } from "../../components/ActionButton";
import Modal from "../../components/Modal";
import InfoHelp from "../../components/InfoHelp";

export interface EventHeaderProps {
  actor?: string;
  timeLabel: string;
  onTimeClick: () => void;
  rightExtra?: React.ReactNode; // e.g., edit button
}

export const EventHeader: React.FC<EventHeaderProps> = ({
  actor,
  timeLabel,
  onTimeClick,
  rightExtra,
}) => (
  <div className="flex items-center justify-between gap-4 w-full mb-3">
    {actor && actor !== "system" ? (
      <span className="font-semibold text-sm sm:text-base lg:text-lg xl:text-xl">{actor}</span>
    ) : (
      <span />
    )}
    <div className="flex items-center gap-2">
      {rightExtra}
      <Button variant="link" size="sm" onClick={onTimeClick}>
        {timeLabel}
      </Button>
    </div>
  </div>
);

interface CloudEventModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  cloudEvent: unknown;
  schemaUrl?: string;
}

export const CloudEventModal: React.FC<CloudEventModalProps> = ({
  open,
  onClose,
  title = "CloudEvent",
  cloudEvent,
  schemaUrl,
}) => (
  <Modal isOpen={open} onClose={onClose} title={title} maxWidth="800px">
    <div className="relative">
      <InfoHelp variant="cloudevent" schemaUrl={schemaUrl} />
      <pre
        className="border rounded-md p-4 font-mono text-xs sm:text-sm lg:text-base xl:text-lg leading-relaxed overflow-x-auto m-0 whitespace-pre-wrap break-words"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          borderColor: "var(--border-primary)",
          color: "var(--text-primary)",
        }}
      >
        {JSON.stringify(cloudEvent, null, 2)}
      </pre>
    </div>
  </Modal>
);
