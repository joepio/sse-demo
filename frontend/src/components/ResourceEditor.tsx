import { useState, useEffect } from "react";
import Modal from "./Modal";
import type { CloudEvent, BaseEntity, ItemType } from "../types";
import { Button } from "./ActionButton";
import { createItemCreatedEvent } from "../utils/cloudEvents";

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

      // Use the schema-based CloudEvent creation utility
      const cloudEvent = createItemCreatedEvent(
        resourceType as ItemType,
        newData,
        {
          source: `/${resourceType}s`,
          subject: resource.id,
        }
      );

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
        <Button
          variant="secondary"
          size="md"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Annuleren
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? "Opslaan..." : "Opslaan"}
        </Button>
      </div>
    </Modal>
  );
};

export default ResourceEditor;
