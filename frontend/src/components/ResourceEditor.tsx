import { useState, useEffect } from "react";
import Modal from "./Modal";
import type { CloudEvent, BaseEntity } from "../types";

interface ResourceEditorProps<T extends BaseEntity = BaseEntity> {
  isOpen: boolean;
  onClose: () => void;
  resource: T | null;
  resourceType: string;
  onSave: (event: CloudEvent) => Promise<void>;
}

const ResourceEditor = <T extends BaseEntity>({
  isOpen,
  onClose,
  resource,
  resourceType,
  onSave,
}: ResourceEditorProps<T>) => {
  const [jsonText, setJsonText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (resource && isOpen) {
      setJsonText(JSON.stringify(resource, null, 2));
    }
  }, [resource, isOpen]);

  const handleSave = async () => {
    if (!resource) return;

    try {
      const newData = JSON.parse(jsonText);
      setIsSubmitting(true);

      // Map resource types to event types
      let eventType: string;
      switch (resourceType) {
        case "issue":
          eventType = "issue.updated";
          break;
        default:
          // For unsupported resource types, use a generic event
          eventType = "item.updated";
          break;
      }

      const cloudEvent: CloudEvent = {
        specversion: "1.0",
        id: crypto.randomUUID(),
        source: `/${resourceType}s`,
        subject: resource.id,
        type: eventType,
        time: new Date().toISOString(),
        datacontenttype: "application/merge-patch+json",
        data: newData,
      };

      await onSave(cloudEvent);
      onClose();
    } catch {
      alert("Ongeldige JSON of opslaan mislukt");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!resource) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${resourceType === "issue" ? "Zaak" : resourceType} bewerken`}
    >
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        style={{
          width: "100%",
          height: "300px",
          fontFamily: "monospace",
          fontSize: "14px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          padding: "1rem",
          marginBottom: "1rem",
          resize: "vertical",
        }}
      />

      <div
        style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}
      >
        <button
          className="btn btn-secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Annuleren
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Opslaan..." : "Opslaan"}
        </button>
      </div>
    </Modal>
  );
};

export default ResourceEditor;
