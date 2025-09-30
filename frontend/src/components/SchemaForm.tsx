import React, { useState, useEffect } from "react";
import { fetchSchemaIndex, fetchSchema } from "../types/interfaces";
import { Button } from "./ActionButton";
import SchemaField from "./SchemaField";
import { generateUUID } from "../utils/uuid";
import { createItemCreatedEvent } from "../utils/cloudEvents";
import type { ItemType } from "../types";

interface SchemaFormProps {
  zaakId: string;
  onSubmit: (event: any) => Promise<void>;
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

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  issue: "Een nieuwe zaak aanmaken met titel, beschrijving en status",
  task: "Een actie-item of taak toevoegen met deadline en verantwoordelijke",
  comment: "Een reactie of opmerking plaatsen bij deze zaak",
  planning: "Planning momenten definiëren met data en statussen",
  document: "Een document toevoegen met titel, URL en grootte",
  cloudevent: "Een CloudEvent aanmaken",
  itemeventdata: "Event data voor item-based events",
  issuestatus: "Status van een zaak",
  planningstatus: "Status van een planning moment",
  planningmoment: "Een specifiek moment in een planning",
  itemtype: "Type van een item",
};

const SchemaForm: React.FC<SchemaFormProps> = ({ zaakId, onSubmit }) => {
  const [availableSchemas, setAvailableSchemas] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSchema, setCurrentSchema] = useState<any>(null);

  // Fetch available schemas on component mount
  useEffect(() => {
    const loadAvailableSchemas = async () => {
      try {
        const schemaIndex = await fetchSchemaIndex();
        // Filter out schemas that aren't suitable for creating items
        // Exclude Issue since we have a dedicated CreateIssueForm
        const itemSchemas = schemaIndex.schemas.filter((name) =>
          ["Task", "Comment", "Planning", "Document"].includes(name),
        );
        setAvailableSchemas(itemSchemas);
      } catch (error) {
        console.error("Failed to load available schemas:", error);
        // Fallback to default schemas (excluding issue)
        setAvailableSchemas([
          "task",
          "comment",
          "planning",
          "document",
        ]);
      }
    };
    loadAvailableSchemas();
  }, []);

  // Load schema for the selected type and reset form when type changes
  useEffect(() => {
    setFormData({});
    const loadSchema = async () => {
      try {
        const schema = await fetchSchema(selectedType);
        setCurrentSchema(schema);
      } catch (error) {
        console.error(`Failed to load schema for ${selectedType}:`, error);
        setCurrentSchema(null);
      }
    };

    if (selectedType) {
      loadSchema();
    }
  }, [selectedType]);

  const handleTypeChange = (newType: string) => {
    if (selectedType === newType) {
      // Clicking the same type closes the form
      setSelectedType("");
      setFormData({});
    } else {
      setSelectedType(newType);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const itemId = `${selectedType}-${generateUUID()}`;

      // Create item data following the schema
      const itemData = {
        id: itemId,
        ...formData,
      };

      // Use the schema-based CloudEvent utility
      const event = createItemCreatedEvent(
        selectedType.toLowerCase() as ItemType,
        itemData,
        {
          source: "frontend-create",
          subject: zaakId,
          actor: "frontend-user",
        }
      );

      await onSubmit(event);

      // Reset form
      setFormData({});
      setSelectedType("");
    } catch (error) {
      console.error("Failed to create item:", error);
      alert("Er ging iets mis bij het aanmaken van het item");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="mt-8">
      <div
        className="text-xs uppercase font-semibold tracking-wider mb-4"
        style={{ color: "var(--text-secondary)" }}
      >
        Item Toevoegen
      </div>

      {/* Type Selection Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
        {availableSchemas.map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? "primary" : "secondary"}
            size="md"
            onClick={() => handleTypeChange(type)}
          >
            {DEFAULT_LABELS[type.toLowerCase()] || type}
          </Button>
        ))}
      </div>

      {/* Dynamic Form - only show when a type is selected */}
      {selectedType && (
        <div
          className="border rounded-lg p-6 space-y-6"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-primary)",
          }}
        >
          {/* Type Description */}
          <div>
            <h3
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              {DEFAULT_LABELS[selectedType.toLowerCase()] || selectedType}
            </h3>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {DEFAULT_DESCRIPTIONS[selectedType.toLowerCase()] ||
                `Create a new ${selectedType}`}
            </p>
          </div>

          {/* Dynamic Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {currentSchema &&
                "properties" in currentSchema &&
                currentSchema.properties &&
                Object.keys(currentSchema.properties)
                  .filter(
                    (field) =>
                      !["id", "created_at", "updated_at"].includes(field),
                  ) // Skip auto-generated fields
                  .map((fieldName) => (
                    <SchemaField
                      key={fieldName}
                      fieldName={fieldName}
                      fieldSchema={currentSchema}
                      currentSchema={currentSchema}
                      value={formData[fieldName] || ""}
                      onChange={handleInputChange}
                      selectedType={selectedType}
                      idPrefix="field"
                    />
                  ))}
            </div>

            {/* Form Actions */}
            <div
              className="flex items-center gap-3 pt-4 border-t"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? "Aanmaken..." : "Item Aanmaken"}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setFormData({});
                  setSelectedType("");
                }}
              >
                Annuleren
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SchemaForm;
