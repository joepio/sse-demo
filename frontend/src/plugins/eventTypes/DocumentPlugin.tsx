import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import type { Document } from "../../types";
import Card from "../../components/Card";
import { EventHeader, CloudEventModal } from "../shared/TimelineEventUI";
import SchemaEditForm from "../../components/SchemaEditForm";
import { Button } from "../../components/ActionButton";
import { useSSE } from "../../contexts/SSEContext";

const DocumentPlugin: React.FC<EventPluginProps> = ({
  event,
  data,
  timeInfo,
}) => {
  const { sendEvent, items } = useSSE();
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const eventData = data as Record<string, unknown>;

  // Support both new (resource_id) and old (item_id) field names
  const documentId = (eventData.resource_id || eventData.item_id) as string;

  const isUpdateEvent = event.originalEvent.type.includes("updated") ||
                        (event.originalEvent.type === "json.commit" && !!eventData.patch && !eventData.resource_data);
  const isDeleteEvent = event.originalEvent.type.includes("deleted") ||
                        (eventData.patch && typeof eventData.patch === "object" &&
                         (eventData.patch as Record<string, unknown>)._deleted === true);

  // Get the current state of the document from the items store
  const documentData = (items[documentId] ||
                       eventData.resource_data ||
                       eventData.item_data ||
                       eventData) as Partial<Document>;

  // Handle delete events
  if (isDeleteEvent) {
    return (
      <>
        <Card padding="sm" id={documentId}>
          <EventHeader actor={event.actor} timeLabel={timeInfo.relative} onTimeClick={() => setShowEventModal(true)} />
          <div className="prose prose-sm max-w-none">
            <p
              className="m-0 mb-2 leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl"
              style={{ color: "var(--text-primary)" }}
            >
              <strong><i className="fa-solid fa-trash" aria-hidden="true"></i> Document verwijderd</strong>
            </p>
            <div
              className="text-xs sm:text-sm lg:text-sm xl:text-base"
              style={{ color: "var(--text-secondary)" }}
            >
              Document ID: {documentId}
            </div>
          </div>
        </Card>

        <CloudEventModal
          open={showEventModal}
          onClose={() => setShowEventModal(false)}
          cloudEvent={event.originalEvent}
          schemaUrl={(eventData as any)?.schema as string | undefined}
        />
      </>
    );
  }

  // Handle update events
  if (isUpdateEvent) {
    return (
      <>
        <Card padding="sm" id={documentId}>
          <EventHeader actor={event.actor} timeLabel={timeInfo.relative} onTimeClick={() => setShowEventModal(true)} />
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

        <CloudEventModal
          open={showEventModal}
          onClose={() => setShowEventModal(false)}
          cloudEvent={event.originalEvent}
          schemaUrl={(eventData as any)?.schema as string | undefined}
        />
      </>
    );
  }

  // Handle create events - show document card
  if (!documentData.title || !documentData.url) {
    return (
      <>
        <Card padding="sm" id={documentId}>
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
              <strong><i className="fa-regular fa-file-lines" aria-hidden="true"></i> Nieuw document toegevoegd</strong>
            </p>
            <div
              className="text-xs sm:text-sm lg:text-sm xl:text-base"
              style={{ color: "var(--text-secondary)" }}
            >
              Document informatie niet volledig beschikbaar
            </div>
          </div>
        </Card>

        <CloudEventModal
          open={showEventModal}
          onClose={() => setShowEventModal(false)}
          cloudEvent={event.originalEvent}
          schemaUrl={(eventData as any)?.schema as string | undefined}
        />
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
      <Card padding="sm" id={documentId}>
        <div className="flex items-center justify-between gap-4 w-full mb-3">
          {event.actor && event.actor !== "system" && (
            <span className="font-semibold text-sm sm:text-base lg:text-lg xl:text-xl">
              {event.actor}
            </span>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="icon"
              size="sm"
              onClick={() => setShowEditModal(true)}
              title="Bewerken"
            >
              <i className="fa-solid fa-pen" aria-hidden="true"></i>
            </Button>
            <Button
              variant="link"
              size="sm"
              title={`${timeInfo.date} at ${timeInfo.time}`}
              onClick={() => setShowEventModal(true)}
            >
              {timeInfo.relative}
            </Button>
          </div>
        </div>

        <div className="prose prose-sm max-w-none">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-xl"><i className="fa-regular fa-file-lines" aria-hidden="true"></i></span>
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
              <span><i className="fa-solid fa-download" aria-hidden="true"></i></span>
              Download
            </Button>
          </div>
        </div>
      </Card>

      <SchemaEditForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        itemType="document"
        itemId={(documentData as any)?.id || event.id}
        initialData={{
          title: documentData.title,
          url: documentData.url,
          size: documentData.size,
        }}
        onSubmit={sendEvent}
        zaakId={event.originalEvent.subject || ""}
      />

      <CloudEventModal
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        cloudEvent={event.originalEvent}
        schemaUrl={(eventData as any)?.schema as string | undefined}
      />
    </>
  );
};

export default DocumentPlugin;
