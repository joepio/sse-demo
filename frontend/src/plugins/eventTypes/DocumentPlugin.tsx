import React, { useState } from "react";
import type { EventPluginProps } from "./types";
import type { Document } from "../../types";
import Card, { CardContent } from "../../components/Card";
import Modal from "../../components/Modal";

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
        <Card>
          <CardContent>
            <div className="flex items-center justify-between gap-4 w-full mb-3">
              {event.actor && event.actor !== "system" && (
                <span className="font-semibold text-sm">{event.actor}</span>
              )}
              <button
                type="button"
                className="text-xs hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors duration-150"
                style={{ color: "var(--text-tertiary)" }}
                title={`${timeInfo.date} at ${timeInfo.time}`}
                onClick={() => setShowEventModal(true)}
              >
                {timeInfo.relative}
              </button>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="m-0 mb-2 leading-relaxed text-text-primary">
                <strong>🗑️ Document verwijderd</strong>
              </p>
              <div
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Document ID: {documentId}
              </div>
            </div>
          </CardContent>
        </Card>

        <Modal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          title="CloudEvent"
          maxWidth="800px"
        >
          <pre
            className="border rounded-md p-4 font-mono text-xs leading-relaxed overflow-x-auto m-0 whitespace-pre-wrap break-words"
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
        <Card>
          <CardContent>
            <div className="flex items-center justify-between gap-4 w-full mb-3">
              {event.actor && event.actor !== "system" && (
                <span className="font-semibold text-sm">{event.actor}</span>
              )}
              <button
                type="button"
                className="text-xs hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors duration-150"
                style={{ color: "var(--text-tertiary)" }}
                title={`${timeInfo.date} at ${timeInfo.time}`}
                onClick={() => setShowEventModal(true)}
              >
                {timeInfo.relative}
              </button>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="m-0 mb-2 leading-relaxed text-text-primary">
                <strong>📝 Document bijgewerkt</strong>
              </p>
              <div
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Document ID: {documentId}
              </div>
            </div>
          </CardContent>
        </Card>

        <Modal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          title="CloudEvent"
          maxWidth="800px"
        >
          <pre
            className="border rounded-md p-4 font-mono text-xs leading-relaxed overflow-x-auto m-0 whitespace-pre-wrap break-words"
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
        <Card>
          <CardContent>
            <div className="flex items-center justify-between gap-4 w-full mb-3">
              {event.actor && event.actor !== "system" && (
                <span className="font-semibold text-sm">{event.actor}</span>
              )}
              <button
                type="button"
                className="text-xs hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors duration-150"
                style={{ color: "var(--text-tertiary)" }}
                title={`${timeInfo.date} at ${timeInfo.time}`}
                onClick={() => setShowEventModal(true)}
              >
                {timeInfo.relative}
              </button>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="m-0 mb-2 leading-relaxed text-text-primary">
                <strong>📄 Nieuw document toegevoegd</strong>
              </p>
              <div
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Document informatie niet volledig beschikbaar
              </div>
            </div>
          </CardContent>
        </Card>

        <Modal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          title="CloudEvent"
          maxWidth="800px"
        >
          <pre
            className="border rounded-md p-4 font-mono text-xs leading-relaxed overflow-x-auto m-0 whitespace-pre-wrap break-words"
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
      <Card>
        <CardContent>
          <div className="flex items-center justify-between gap-4 w-full mb-3">
            {event.actor && event.actor !== "system" && (
              <span className="font-semibold text-sm">{event.actor}</span>
            )}
            <button
              type="button"
              className="text-xs hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors duration-150"
              style={{ color: "var(--text-tertiary)" }}
              title={`${timeInfo.date} at ${timeInfo.time}`}
              onClick={() => setShowEventModal(true)}
            >
              {timeInfo.relative}
            </button>
          </div>

          <div className="prose prose-sm max-w-none">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">📄</span>
                <div>
                  <h4
                    className="font-semibold m-0 leading-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {documentData.title}
                  </h4>
                  {documentData.size && (
                    <p
                      className="text-sm m-0 mt-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {formatFileSize(documentData.size)}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all duration-150 border"
                style={{
                  backgroundColor: "var(--button-secondary-bg)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-primary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--button-secondary-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--button-secondary-bg)";
                }}
              >
                <span>⬇️</span>
                Download
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="CloudEvent"
        maxWidth="800px"
      >
        <pre
          className="border rounded-md p-4 font-mono text-xs leading-relaxed overflow-x-auto m-0 whitespace-pre-wrap break-words"
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
