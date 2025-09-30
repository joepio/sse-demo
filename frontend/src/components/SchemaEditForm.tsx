import React, { useState, useEffect } from "react";
import { fetchSchema } from "../types/interfaces";
import { Button } from "./ActionButton";
import Modal from "./Modal";
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

  const renderFormField = (
    fieldName: string,
    fieldSchema: any,
  ): React.ReactNode => {
    const isRequired = currentSchema.required?.includes(fieldName) || false;
    const fieldProps =
      fieldSchema && "properties" in fieldSchema
        ? fieldSchema.properties?.[fieldName]
        : null;

    if (!fieldProps) return null;

    const fieldId = `edit-field-${fieldName}`;
    const value = formData[fieldName] || "";

    // Skip read-only fields like id, created_at, etc.
    if (["id", "created_at"].includes(fieldName)) {
      return null;
    }

    return (
      <div key={fieldName} className="mb-4">
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          {fieldProps.title || fieldName}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>

        {fieldProps.type === "string" && fieldProps.format === "textarea" ? (
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            required={isRequired}
            placeholder={fieldProps.description || ""}
            className="w-full px-3 py-2 border rounded-md resize-vertical"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
            rows={4}
          />
        ) : fieldProps.type === "string" && fieldProps.format === "date" ? (
          <input
            type="date"
            id={fieldId}
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            required={isRequired}
            className="w-full px-3 py-2 border rounded-md"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
          />
        ) : fieldProps.type === "string" &&
          fieldProps.format === "date-time" ? (
          <input
            type="datetime-local"
            id={fieldId}
            value={value ? new Date(value).toISOString().slice(0, -1) : ""}
            onChange={(e) =>
              handleInputChange(
                fieldName,
                new Date(e.target.value).toISOString(),
              )
            }
            required={isRequired}
            className="w-full px-3 py-2 border rounded-md"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
          />
        ) : fieldProps.type === "boolean" ? (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={fieldId}
              checked={Boolean(value)}
              onChange={(e) => handleInputChange(fieldName, e.target.checked)}
              className="mr-2"
            />
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {fieldProps.description || fieldName}
            </span>
          </div>
        ) : fieldProps.type === "number" || fieldProps.type === "integer" ? (
          <input
            type="number"
            id={fieldId}
            value={value}
            onChange={(e) =>
              handleInputChange(
                fieldName,
                fieldProps.type === "integer"
                  ? parseInt(e.target.value) || 0
                  : parseFloat(e.target.value) || 0,
              )
            }
            required={isRequired}
            placeholder={fieldProps.description || ""}
            className="w-full px-3 py-2 border rounded-md"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
          />
        ) : (
          <input
            type="text"
            id={fieldId}
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            required={isRequired}
            placeholder={fieldProps.description || ""}
            className="w-full px-3 py-2 border rounded-md"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
          />
        )}

        {fieldProps.description && (
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            {fieldProps.description}
          </p>
        )}
      </div>
    );
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
                .map((fieldName) => renderFormField(fieldName, currentSchema))}

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
