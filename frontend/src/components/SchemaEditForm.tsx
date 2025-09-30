import React, { useState, useEffect } from "react";
import { fetchSchema } from "../types/interfaces";
import { Button } from "./ActionButton";
import Modal from "./Modal";
import SchemaField from "./SchemaField";
import { createItemUpdatedEvent } from "../utils/cloudEvents";
import type { ItemType } from "../types";

interface SchemaEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: string;
  itemId: string;
  initialData: Record<string, any>;
  onSubmit: (event: any) => Promise<void>;
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
  itemeventdata: "ItemEventData",
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
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSchema, setCurrentSchema] = useState<any>(null);

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
        // Create type-specific fallback schemas
        let fallbackSchema = { type: "object", properties: {} };

        switch (itemType.toLowerCase()) {
          case "comment":
            fallbackSchema.properties = {
              content: { type: "string", title: "Inhoud", format: "textarea" },
              mentions: { type: "array", title: "Vermeldingen" },
            };
            break;
          case "task":
            fallbackSchema.properties = {
              description: {
                type: "string",
                title: "Beschrijving",
                format: "textarea",
              },
              cta: { type: "string", title: "Actie" },
              deadline: { type: "string", title: "Deadline", format: "date" },
              url: { type: "string", title: "URL" },
              completed: { type: "boolean", title: "Voltooid" },
            };
            break;
          case "document":
            fallbackSchema.properties = {
              title: { type: "string", title: "Titel" },
              url: { type: "string", title: "URL" },
              size: { type: "number", title: "Grootte" },
            };
            break;
          case "planning":
            fallbackSchema.properties = {
              title: { type: "string", title: "Titel" },
              description: {
                type: "string",
                title: "Beschrijving",
                format: "textarea",
              },
            };
            break;
          default:
            fallbackSchema.properties = {
              title: { type: "string", title: "Titel" },
              description: {
                type: "string",
                title: "Beschrijving",
                format: "textarea",
              },
            };
        }

        console.log(`Using fallback schema for ${itemType}:`, fallbackSchema);
        setCurrentSchema(fallbackSchema);
      }
    };

    loadSchema();
  }, [itemType, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use the schema-based CloudEvent utility for updates
      const event = createItemUpdatedEvent(
        itemType.toLowerCase() as ItemType,
        itemId,
        formData,
        {
          source: "frontend-edit",
          subject: zaakId,
          actor: "frontend-user",
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
      <div style={{ backgroundColor: "var(--bg-secondary)" }}>
        {currentSchema ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {currentSchema.properties &&
              Object.keys(currentSchema.properties)
                .filter((fieldName) => {
                  // Only show fields that exist in initialData or are in the schema
                  return (
                    initialData.hasOwnProperty(fieldName) ||
                    currentSchema.properties.hasOwnProperty(fieldName)
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
                ))}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Opslaan..." : "Opslaan"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4">
            <p style={{ color: "var(--text-secondary)" }}>Schema laden...</p>
            <p
              className="text-sm mt-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              Als dit lang duurt, controleer of de backend server draait op
              poort 8000
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SchemaEditForm;
