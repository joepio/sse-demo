import React from "react";
import { Button } from "./ActionButton";
import { generateUUID } from "../utils/uuid";

interface SchemaFieldProps {
  fieldName: string;
  fieldSchema: any;
  currentSchema: any;
  value: any;
  onChange: (field: string, value: any) => void;
  selectedType?: string;
  idPrefix?: string;
}

/**
 * Renders a form field based on JSON Schema definition
 * Supports: strings, textareas, dates, emails, URLs, booleans, numbers, arrays, enums
 */
const SchemaField: React.FC<SchemaFieldProps> = ({
  fieldName,
  fieldSchema,
  currentSchema,
  value,
  onChange,
  selectedType = "",
  idPrefix = "field",
}) => {
  const isRequired = currentSchema.required?.includes(fieldName) || false;
  const fieldProps =
    fieldSchema && "properties" in fieldSchema
      ? fieldSchema.properties?.[fieldName]
      : null;

  if (!fieldProps) return null;

  const fieldId = `${idPrefix}-${fieldName}`;
  const fieldLabel =
    fieldProps.title ||
    fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace("_", " ");
  const fieldDescription = fieldProps.description;

  // Skip read-only fields
  if (["id", "created_at", "updated_at"].includes(fieldName)) {
    return null;
  }

  const renderInput = () => {
    // Handle enums (dropdowns)
    if (fieldProps.allOf?.[0]?.["$ref"]?.includes("Status") || fieldProps.enum) {
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
            onChange={(e) => onChange(fieldName, e.target.value)}
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
        onChange(fieldName, [...moments, newMoment]);
      };

      const updateMoment = (index: number, field: string, newValue: string) => {
        const updatedMoments = moments.map((moment: any, i: number) =>
          i === index ? { ...moment, [field]: newValue } : moment,
        );
        onChange(fieldName, updatedMoments);
      };

      const removeMoment = (index: number) => {
        const updatedMoments = moments.filter((_: any, i: number) => i !== index);
        onChange(fieldName, updatedMoments);
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
                    onChange={(e) => updateMoment(index, "date", e.target.value)}
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
                    onChange={(e) => updateMoment(index, "title", e.target.value)}
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
                    onChange={(e) => updateMoment(index, "status", e.target.value)}
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
            onChange={(e) => onChange(fieldName, e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">{fieldDescription || "Ja"}</span>
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
            onChange(fieldName, arrayValue);
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

    // Handle numbers
    if (fieldProps.type === "number" || fieldProps.type === "integer") {
      return (
        <input
          type="number"
          id={fieldId}
          value={value}
          onChange={(e) =>
            onChange(
              fieldName,
              fieldProps.type === "integer"
                ? parseInt(e.target.value) || 0
                : parseFloat(e.target.value) || 0,
            )
          }
          required={isRequired}
          placeholder={fieldDescription || ""}
          className="w-full px-3 py-2 border rounded-md text-sm"
          style={{
            backgroundColor: "var(--bg-primary)",
            borderColor: "var(--border-primary)",
            color: "var(--text-primary)",
          }}
        />
      );
    }

    // Handle text areas for long content (based on field name or format)
    if (
      fieldName === "description" ||
      fieldName === "content" ||
      fieldProps.format === "textarea"
    ) {
      const getPlaceholder = () => {
        if (fieldDescription) return fieldDescription;
        if (fieldName === "description") {
          const lowerType = selectedType.toLowerCase();
          return lowerType === "issue"
            ? "Beschrijf de zaak: wat is er aan de hand, welke stappen zijn al ondernomen, wat is het gewenste resultaat?"
            : lowerType === "task"
              ? "Beschrijf wat er gedaan moet worden, eventuele voorwaarden of context"
              : lowerType === "planning"
                ? "Algemene beschrijving van de planning en doelstellingen"
                : "Beschrijf hier de details...";
        }
        if (fieldName === "content") {
          return "Typ uw reactie of opmerking hier...";
        }
        return "Typ uw reactie...";
      };

      return (
        <textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(fieldName, e.target.value)}
          required={isRequired}
          rows={4}
          placeholder={getPlaceholder()}
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
    if (fieldName === "deadline" || fieldName === "date" || fieldProps.format === "date") {
      return (
        <input
          type="date"
          id={fieldId}
          value={value}
          onChange={(e) => onChange(fieldName, e.target.value)}
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

    // Handle date-time
    if (fieldProps.format === "date-time") {
      return (
        <input
          type="datetime-local"
          id={fieldId}
          value={value ? new Date(value).toISOString().slice(0, -1) : ""}
          onChange={(e) =>
            onChange(fieldName, new Date(e.target.value).toISOString())
          }
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
          onChange={(e) => onChange(fieldName, e.target.value)}
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
          onChange={(e) => onChange(fieldName, e.target.value)}
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
      if (fieldDescription) return fieldDescription;
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
        onChange={(e) => onChange(fieldName, e.target.value)}
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
        {isRequired && (
          <span className="ml-1" style={{ color: "var(--text-error)" }}>
            *
          </span>
        )}
      </label>
      {fieldDescription && !fieldProps.type?.includes("boolean") && (
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {fieldDescription}
        </p>
      )}
      {renderInput()}
    </div>
  );
};

export default SchemaField;
