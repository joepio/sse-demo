import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import type { Document } from "../../types";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
import { Button } from "../../components/ActionButton";

const DocumentPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const [showEventModal, setShowEventModal] = useState(false);
  const eventData = data as Record<string, unknown>;
  const documentId = eventData.item_id as string;
  const isUpdateEvent = event.originalEvent.type.includes("updated");
  const isDeleteEvent = event.originalEvent.type.includes("deleted");

  // Handle delete events
  if (isDeleteEvent) {
    return (
      <>
        <Card padding="sm">
          <div className="flex items-center justify-between gap-4 w-full mb-3">
            {event.actor && event.actor !== "system" && (
              <span className="font-semibold text-sm sm:text-base lg:text-lg xl:text-xl">
                {event.actor}
              </span>
            )}
            <Button
              variant="link"
              size="sm"
              title={`${timeInfo.date} at ${timeInfo.time}`}
              onClick={() => setShowEventModal(true)}
            >
              {timeInfo.relative}
            </Button>
          </div>
          <div className="prose prose-sm max-w-none">
            <p
              className="m-0 mb-2 leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl"
              style={{ color: "var(--text-primary)" }}
            >
              <strong>🗑️ Document verwijderd</strong>
            </p>
            <div
              className="text-xs sm:text-sm lg:text-sm xl:text-base"
              style={{ color: "var(--text-secondary)" }}
            >
              Document ID: {documentId}
            </div>
          </div>
        </Card>

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
  }

  // Handle update events
  if (isUpdateEvent) {
    return (
      <>
        <Card padding="sm">
          <div className="flex items-center justify-between gap-4 w-full mb-3">
            {event.actor && event.actor !== "system" && (
              <span className="font-semibold text-sm sm:text-base lg:text-lg xl:text-xl">
                {event.actor}
              </span>
            )}
            <Button
              variant="link"
              size="sm"
              title={`${timeInfo.date} at ${timeInfo.time}`}
              onClick={() => setShowEventModal(true)}
            >
              {timeInfo.relative}
            </Button>
          </div>
          <div className="prose prose-sm max-w-none">
            <p
              className="m-0 mb-2 leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl"
              style={{ color: "var(--text-primary)" }}
            >
              <strong>📝 Document bijgewerkt</strong>
            </p>
            <div
              className="text-xs sm:text-sm lg:text-sm xl:text-base"
              style={{ color: "var(--text-secondary)" }}
            >
              Document ID: {documentId}
            </div>
          </div>
        </Card>

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
  }

  // Handle create events - show document card
  const documentData = (eventData.item_data || eventData) as Partial<Document>;

  if (!documentData.title || !documentData.url) {
    return (
      <>
        <Card padding="sm">
          <div className="flex items-center justify-between gap-4 w-full mb-3">
            {event.actor && event.actor !== "system" && (
              <span className="font-semibold text-sm sm:text-base lg:text-lg xl:text-xl">
                {event.actor}
              </span>
            )}
            <Button
              variant="link"
              size="sm"
              title={`${timeInfo.date} at ${timeInfo.time}`}
              onClick={() => setShowEventModal(true)}
            >
              {timeInfo.relative}
            </Button>
          </div>
          <div className="prose prose-sm max-w-none">
            <p
              className="m-0 mb-2 leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl"
              style={{ color: "var(--text-primary)" }}
            >
              <strong>📄 Nieuw document toegevoegd</strong>
            </p>
            <div
              className="text-xs sm:text-sm lg:text-sm xl:text-base"
              style={{ color: "var(--text-secondary)" }}
            >
              Document informatie niet volledig beschikbaar
            </div>
          </div>
        </Card>

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
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = () => {
    if (documentData.url) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = documentData.url;
      link.download = documentData.title || "document";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <Card padding="sm">
        <div className="flex items-center justify-between gap-4 w-full mb-3">
          {event.actor && event.actor !== "system" && (
            <span className="font-semibold text-sm sm:text-base lg:text-lg xl:text-xl">
              {event.actor}
            </span>
          )}
          <Button
            variant="link"
            size="sm"
            title={`${timeInfo.date} at ${timeInfo.time}`}
            onClick={() => setShowEventModal(true)}
          >
            {timeInfo.relative}
          </Button>
        </div>

        <div className="prose prose-sm max-w-none">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-xl">📄</span>
              <div className="flex-1 min-w-0">
                <h4
                  className="font-semibold m-0 leading-tight text-base sm:text-lg lg:text-xl xl:text-2xl"
                  style={{ color: "var(--text-primary)" }}
                >
                  {documentData.title}
                </h4>
                {documentData.size && (
                  <p
                    className="text-xs sm:text-sm lg:text-sm xl:text-base m-0 mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {formatFileSize(documentData.size)}
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={handleDownload}
              className="self-start sm:self-auto flex-shrink-0"
            >
              <span>⬇️</span>
              Download
            </Button>
          </div>
        </div>
      </Card>

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

export default DocumentPlugin;
