import React, { useState, useEffect } from "react";
import { fetchSchemaIndex, fetchSchema } from "../types/interfaces";
import { Button } from "./ActionButton";
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
  const [selectedType, setSelectedType] = useState<string>("comment");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentSchema, setCurrentSchema] = useState<any>(null);

  // Fetch available schemas on component mount
  useEffect(() => {
    const loadAvailableSchemas = async () => {
      try {
        const schemaIndex = await fetchSchemaIndex();
        // Filter out schemas that aren't suitable for creating items
        const itemSchemas = schemaIndex.schemas.filter((name) =>
          ["Issue", "Task", "Comment", "Planning", "Document"].includes(name),
        );
        setAvailableSchemas(itemSchemas);
      } catch (error) {
        console.error("Failed to load available schemas:", error);
        // Fallback to default schemas
        setAvailableSchemas([
          "issue",
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
    setSelectedType(newType);
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
      setShowForm(false);
    } catch (error) {
      console.error("Failed to create item:", error);
      alert("Er ging iets mis bij het aanmaken van het item");
    } finally {
      setIsSubmitting(false);
    }
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

    const fieldId = `field-${fieldName}`;
    const value = formData[fieldName] || "";
    const fieldLabel =
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace("_", " ");
    const fieldDescription = fieldProps.description;

    // Handle different field types
    const renderInput = () => {
      // Handle enums (dropdowns)
      if (
        fieldProps.allOf?.[0]?.["$ref"]?.includes("Status") ||
        fieldProps.enum
      ) {
        if (fieldName === "status" && selectedType === "issue") {
          const statusOptions = [
            { value: "open", label: "Open" },
            { value: "in_progress", label: "In Behandeling" },
            { value: "closed", label: "Gesloten" },
          ];
          return (
            <select
              id={fieldId}
              value={value}
              onChange={(e) => handleInputChange(fieldName, e.target.value)}
              required={isRequired}
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border-primary)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">Selecteer status...</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        }
      }

      // Handle arrays - special case for planning moments
      if (fieldProps.type === "array" && fieldName === "moments") {
        const moments = Array.isArray(value) ? value : [];

        const addMoment = () => {
          const newMoment = {
            id: `moment-${generateUUID()}`,
            date: "",
            title: "",
            status: "planned",
          };
          handleInputChange(fieldName, [...moments, newMoment]);
        };

        const updateMoment = (
          index: number,
          field: string,
          newValue: string,
        ) => {
          const updatedMoments = moments.map((moment: any, i: number) =>
            i === index ? { ...moment, [field]: newValue } : moment,
          );
          handleInputChange(fieldName, updatedMoments);
        };

        const removeMoment = (index: number) => {
          const updatedMoments = moments.filter(
            (_: any, i: number) => i !== index,
          );
          handleInputChange(fieldName, updatedMoments);
        };

        return (
          <div className="space-y-3">
            {moments.map((moment: any, index: number) => (
              <div
                key={index}
                className="border rounded-md p-3 space-y-2"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <div className="flex justify-between items-center">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Planning Moment {index + 1}
                  </span>
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => removeMoment(index)}
                  >
                    Verwijderen
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Datum *
                    </label>
                    <input
                      type="date"
                      value={moment.date || ""}
                      onChange={(e) =>
                        updateMoment(index, "date", e.target.value)
                      }
                      required
                      className="w-full px-2 py-1 border rounded text-xs"
                      style={{
                        backgroundColor: "var(--bg-primary)",
                        borderColor: "var(--border-primary)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Titel *
                    </label>
                    <input
                      type="text"
                      value={moment.title || ""}
                      onChange={(e) =>
                        updateMoment(index, "title", e.target.value)
                      }
                      required
                      placeholder="Bijv. Intake gesprek"
                      className="w-full px-2 py-1 border rounded text-xs"
                      style={{
                        backgroundColor: "var(--bg-primary)",
                        borderColor: "var(--border-primary)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Status
                    </label>
                    <select
                      value={moment.status || "planned"}
                      onChange={(e) =>
                        updateMoment(index, "status", e.target.value)
                      }
                      className="w-full px-2 py-1 border rounded text-xs"
                      style={{
                        backgroundColor: "var(--bg-primary)",
                        borderColor: "var(--border-primary)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="planned">Gepland</option>
                      <option value="current">Huidig</option>
                      <option value="completed">Voltooid</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="xs" onClick={addMoment}>
              + Nieuw planning moment
            </Button>
          </div>
        );
      }

      // Handle booleans (checkboxes)
      if (fieldProps.type === "boolean") {
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              id={fieldId}
              checked={value || false}
              onChange={(e) => handleInputChange(fieldName, e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Ja</span>
          </label>
        );
      }

      // Handle arrays (general case)
      if (fieldProps.type === "array") {
        return (
          <input
            type="text"
            id={fieldId}
            value={Array.isArray(value) ? value.join(", ") : value}
            onChange={(e) => {
              const arrayValue = e.target.value
                ? e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0)
                : [];
              handleInputChange(fieldName, arrayValue);
            }}
            placeholder={
              fieldName === "mentions"
                ? "Bijv. alice@gemeente.nl, bob@gemeente.nl"
                : "Waarden gescheiden door komma's"
            }
            className="w-full px-3 py-2 border rounded-md text-sm"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
          />
        );
      }

      // Handle text areas for long content
      if (fieldName === "description" || fieldName === "content") {
        return (
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            required={isRequired}
            rows={4}
            placeholder={
              fieldName === "description"
                ? selectedType === "issue"
                  ? "Beschrijf de zaak: wat is er aan de hand, welke stappen zijn al ondernomen, wat is het gewenste resultaat?"
                  : selectedType === "task"
                    ? "Beschrijf wat er gedaan moet worden, eventuele voorwaarden of context"
                    : selectedType === "planning"
                      ? "Algemene beschrijving van de planning en doelstellingen"
                      : "Beschrijf hier de details..."
                : fieldName === "content"
                  ? "Typ uw reactie of opmerking hier..."
                  : "Typ uw reactie..."
            }
            className="w-full px-3 py-2 border rounded-md text-sm resize-vertical"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
          />
        );
      }

      // Handle dates
      if (fieldName === "deadline" || fieldName === "date") {
        return (
          <input
            type="date"
            id={fieldId}
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            required={isRequired}
            className="w-full px-3 py-2 border rounded-md text-sm"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
          />
        );
      }

      // Handle emails
      if (
        fieldName === "assignee" ||
        fieldName === "actor" ||
        fieldName === "author"
      ) {
        return (
          <input
            type="email"
            id={fieldId}
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            required={isRequired}
            placeholder="naam@gemeente.nl"
            className="w-full px-3 py-2 border rounded-md text-sm"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
          />
        );
      }

      // Handle URLs
      if (fieldName === "url") {
        return (
          <input
            type="url"
            id={fieldId}
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            required={isRequired}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border rounded-md text-sm"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
          />
        );
      }

      // Default to text input with smart placeholders
      const getPlaceholder = () => {
        if (fieldName === "title") {
          const lowerType = selectedType.toLowerCase();
          return lowerType === "issue"
            ? "Bijv. Vergunningsaanvraag parkeerplaats"
            : lowerType === "task"
              ? "Bijv. Documenten controleren"
              : lowerType === "comment"
                ? "Onderwerp van uw reactie"
                : lowerType === "planning"
                  ? "Bijv. Vergunningsprocedure planning"
                  : lowerType === "document"
                    ? "Bijv. Vergunning document.pdf"
                    : "Titel";
        }
        if (fieldName === "cta") {
          return "Bijv. Documenten uploaden, Formulier invullen, Contact opnemen";
        }
        return `${fieldLabel.toLowerCase()} invoeren...`;
      };

      return (
        <input
          type="text"
          id={fieldId}
          value={value}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          required={isRequired}
          placeholder={getPlaceholder()}
          className="w-full px-3 py-2 border rounded-md text-sm"
          style={{
            backgroundColor: "var(--bg-primary)",
            borderColor: "var(--border-primary)",
            color: "var(--text-primary)",
          }}
        />
      );
    };

    return (
      <div key={fieldName} className="space-y-2">
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {fieldLabel}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        {fieldDescription && (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {fieldDescription}
          </p>
        )}
        {renderInput()}
      </div>
    );
  };

  if (!showForm) {
    return (
      <div className="mt-8">
        <div
          className="text-xs uppercase font-semibold tracking-wider mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          Item Toevoegen
        </div>
        <Button variant="secondary" size="md" onClick={() => setShowForm(true)}>
          + Item Toevoegen
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div
        className="text-xs uppercase font-semibold tracking-wider mb-4"
        style={{ color: "var(--text-secondary)" }}
      >
        Item Toevoegen
      </div>

      <div
        className="border rounded-lg p-6 space-y-6"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-primary)",
        }}
      >
        {/* Type Selection */}
        <div className="space-y-3">
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Type Item
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availableSchemas.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                  selectedType === type
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
                style={
                  selectedType === type
                    ? {}
                    : {
                        backgroundColor: "var(--bg-primary)",
                        borderColor: "var(--border-primary)",
                        color: "var(--text-primary)",
                      }
                }
              >
                {DEFAULT_LABELS[type.toLowerCase()] || type}
              </button>
            ))}
          </div>
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
                .map((fieldName) => renderFormField(fieldName, currentSchema))}
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
                setShowForm(false);
                setFormData({});
                setSelectedType("");
              }}
            >
              Annuleren
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchemaForm;
