import React, { useState, useEffect } from "react";
import { fetchSchema } from "../types/interfaces";
import { Button } from "./ActionButton";
import Modal from "./Modal";
import SchemaField from "./SchemaField";
import InfoHelp from "./InfoHelp";
import { createItemUpdatedEvent, createItemDeletedEvent } from "../utils/cloudEvents";
import { useActor } from "../contexts/ActorContext";
import type { ItemType } from "../types";
import type { CloudEvent } from "../types/interfaces";

interface SchemaEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: string;
  itemId: string;
  initialData: Record<string, unknown>;
  onSubmit: (event: CloudEvent) => Promise<void>;
  zaakId: string;
}

// Default labels for known types
const DEFAULT_LABELS: Record<string, string> = {
  issue: "Zaak",
  task: "Taak",
  comment: "Reactie",
  planning: "Planning",
  document: "Document",
  cloudevent: "CloudEvent",
  jsoncommit: "JSONCommit",
  issuestatus: "IssueStatus",
  planningstatus: "PlanningStatus",
  planningmoment: "PlanningMoment",
  itemtype: "ItemType",
};

const SchemaEditForm: React.FC<SchemaEditFormProps> = ({
  isOpen,
  onClose,
  itemType,
  itemId,
  initialData,
  onSubmit,
  zaakId,
}) => {
  const { actor } = useActor();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentSchema, setCurrentSchema] = useState<Record<string, unknown> | null>(null);

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({ ...initialData });
    }
  }, [isOpen, initialData]);

  // Load schema when itemType changes
  useEffect(() => {
    if (!itemType || !isOpen) return;

    const loadSchema = async () => {
      try {
        // Capitalize the first letter to match backend schema names
        const schemaName =
          itemType.charAt(0).toUpperCase() + itemType.slice(1).toLowerCase();
        console.log(
          `Loading schema for item type: ${itemType} -> ${schemaName}`,
        );
        const schema = await fetchSchema(schemaName);
        console.log(`Loaded schema for ${schemaName}:`, schema);
        setCurrentSchema(schema);
      } catch (error) {
        console.error(`Failed to load schema for ${itemType}:`, error);
        setCurrentSchema(null);
      }
    };

    loadSchema();
  }, [itemType, isOpen]);

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use the schema-based CloudEvent utility for updates with session actor
      const event = createItemUpdatedEvent(
        itemType.toLowerCase() as ItemType,
        itemId,
        formData,
        {
          source: "frontend-edit",
          subject: zaakId,
          actor,
        }
      );

      await onSubmit(event);
      onClose();
    } catch (error) {
      console.error("Failed to update item:", error);
      alert("Er ging iets mis bij het bijwerken van het item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Weet je zeker dat je dit ${typeLabel.toLowerCase()} wilt verwijderen?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      // Use the schema-based CloudEvent utility for deletion with session actor
      const event = createItemDeletedEvent(
        itemType.toLowerCase() as ItemType,
        itemId,
        {
          source: "frontend-delete",
          subject: zaakId,
          actor,
        }
      );

      await onSubmit(event);
      onClose();
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Er ging iets mis bij het verwijderen van het item");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    onClose();
  };


  if (!isOpen) return null;

  const typeLabel = DEFAULT_LABELS[itemType.toLowerCase()] || itemType;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${typeLabel} bewerken`}
      maxWidth="600px"
    >
      <div style={{ backgroundColor: "var(--bg-secondary)" }} className="relative">
        <InfoHelp variant="schemas" anchor="top-right" />
        {currentSchema ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {currentSchema.properties &&
              typeof currentSchema.properties === "object" &&
              currentSchema.properties !== null
                ? Object.keys(currentSchema.properties as Record<string, unknown>)
                    .filter((fieldName) => {
                      // Only show fields that exist in initialData or are in the schema
                      return (
                        Object.prototype.hasOwnProperty.call(initialData, fieldName) ||
                        Object.prototype.hasOwnProperty.call(currentSchema.properties, fieldName)
                      );
                    })
                    .map((fieldName) => (
                      <SchemaField
                        key={fieldName}
                        fieldName={fieldName}
                        fieldSchema={currentSchema}
                        currentSchema={currentSchema}
                        value={formData[fieldName] || ""}
                        onChange={handleInputChange}
                        selectedType={itemType}
                        idPrefix="edit-field"
                      />
                    ))
                : null}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                loading={isDeleting}
              >
                {isDeleting ? "Verwijderen..." : "Verwijderen"}
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleClose}
                  disabled={isSubmitting || isDeleting}
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isSubmitting}
                  disabled={isSubmitting || isDeleting}
                >
                  {isSubmitting ? "Opslaan..." : "Opslaan"}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg mb-2" style={{ color: "var(--text-error)" }}>
              Schema kon niet worden geladen
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Controleer of de backend server draait op poort 8000 en het schema voor "{itemType}" beschikbaar is.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SchemaEditForm;
