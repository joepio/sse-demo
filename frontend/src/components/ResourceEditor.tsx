import { useState, useEffect } from "react";
import JsonView from "@uiw/react-json-view";
import Modal from "./Modal";
import type { CloudEvent, BaseEntity } from "../types";

interface ResourceEditorProps<T extends BaseEntity = BaseEntity> {
  isOpen: boolean;
  onClose: () => void;
  resource: T | null;
  resourceType: string;
  onSave: (event: CloudEvent) => Promise<void>;
  readOnlyFields?: string[];
  maxWidth?: string;
  getTitle?: (resource: T) => string;
  getSubtitle?: (resource: T) => string;
}

const ResourceEditor = <T extends BaseEntity>({
  isOpen,
  onClose,
  resource,
  resourceType,
  onSave,
  readOnlyFields = ["id", "created_at"],
  maxWidth = "800px",
  getTitle,
  getSubtitle,
}: ResourceEditorProps<T>) => {
  const [jsonData, setJsonData] = useState<T>({} as T);
  const [originalData, setOriginalData] = useState<T>({} as T);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  }>({ text: "", type: "success" });

  // Initialize JSON data when modal opens or resource changes
  useEffect(() => {
    if (resource && isOpen) {
      const resourceData = { ...resource };
      setJsonData(resourceData);
      setOriginalData(resourceData);
      setMessage({ text: "", type: "success" });
    }
  }, [resource, isOpen]);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: "", type: "success" });
    }, 3000);
  };

  const calculatePatch = (original: T, modified: T): Partial<T> => {
    const patch: any = {};

    // Check for changes and additions
    for (const key in modified) {
      if (readOnlyFields.includes(key)) continue;
      if (modified[key] !== original[key]) {
        patch[key] = modified[key];
      }
    }

    // Check for deletions (keys that existed in original but not in modified)
    for (const key in original) {
      if (readOnlyFields.includes(key)) continue;
      if (!(key in modified)) {
        patch[key] = null; // JSON Merge Patch uses null to delete
      }
    }

    return patch;
  };

  const handleSave = async () => {
    if (!resource) return;

    const patch = calculatePatch(originalData, jsonData);

    // If no changes, don't send patch
    if (Object.keys(patch).length === 0) {
      showMessage("No changes detected", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const cloudEvent: CloudEvent = {
        specversion: "1.0",
        id: crypto.randomUUID(),
        source: `/${resourceType}s`,
        subject: resource.id,
        type: `com.example.${resourceType}.patch`,
        time: new Date().toISOString(),
        datacontenttype: "application/merge-patch+json",
        data: patch,
      };

      await onSave(cloudEvent);
      showMessage(
        `${resourceType} ${resource.id} updated successfully!`,
        "success",
      );

      // Close modal after successful update
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : `Failed to update ${resourceType}`,
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setJsonData({ ...originalData });
    setMessage({ text: "", type: "success" });
  };

  const handleClose = () => {
    setMessage({ text: "", type: "success" });
    onClose();
  };

  const handleJsonChange = (value: any) => {
    // Preserve read-only fields
    const updatedValue = { ...value };
    readOnlyFields.forEach((field) => {
      if (field in originalData) {
        (updatedValue as Record<string, unknown>)[field] = (
          originalData as Record<string, unknown>
        )[field];
      }
    });
    setJsonData(updatedValue);
  };

  const getDefaultTitle = (resource: T): string => {
    const capitalizedType =
      resourceType.charAt(0).toUpperCase() + resourceType.slice(1);

    // Try common title fields
    if ("title" in resource && resource.title) {
      return `Edit ${capitalizedType}: ${resource.title}`;
    }
    if ("name" in resource && resource.name) {
      return `Edit ${capitalizedType}: ${resource.name}`;
    }

    return `Edit ${capitalizedType} #${resource.id}`;
  };

  const getDefaultSubtitle = (resource: T): string => {
    const parts: string[] = [];

    // Common status field
    if ("status" in resource && resource.status) {
      parts.push(`Status: ${resource.status}`);
    }

    // Common author/assignee fields
    if ("author" in resource && resource.author) {
      parts.push(`Author: ${resource.author}`);
    } else if ("assignee" in resource && resource.assignee) {
      parts.push(`Assignee: ${resource.assignee}`);
    }

    // Priority field
    if ("priority" in resource && resource.priority) {
      parts.push(`Priority: ${resource.priority}`);
    }

    // Tags field
    if (
      "tags" in resource &&
      Array.isArray(resource.tags) &&
      resource.tags.length > 0
    ) {
      parts.push(`Tags: ${resource.tags.join(", ")}`);
    }

    // Creation date
    if (resource.created_at) {
      const date = new Date(resource.created_at);
      parts.push(`Created: ${date.toLocaleDateString()}`);
    }

    // Version field
    if ("version" in resource && resource.version) {
      parts.push(`Version: ${resource.version}`);
    }

    // Content length for documents/messages
    if ("content" in resource && typeof resource.content === "string") {
      const wordCount = resource.content
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      if (wordCount > 0) {
        parts.push(`Words: ${wordCount}`);
      }
    }

    // Reactions count for messages
    if (
      "reactions" in resource &&
      typeof resource.reactions === "object" &&
      resource.reactions
    ) {
      const reactionCount = Object.values(
        resource.reactions as Record<string, number>,
      ).reduce((sum, count) => sum + count, 0);
      if (reactionCount > 0) {
        parts.push(`Reactions: ${reactionCount}`);
      }
    }

    return parts.length > 0 ? parts.join(" • ") : `ID: ${resource.id}`;
  };

  if (!resource) return null;

  const title = getTitle ? getTitle(resource) : getDefaultTitle(resource);
  const subtitle = getSubtitle
    ? getSubtitle(resource)
    : getDefaultSubtitle(resource);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxWidth={maxWidth}
    >
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            fontSize: "0.9rem",
            color: "#6c757d",
            marginBottom: "1rem",
          }}
        >
          {subtitle}
        </div>
      </div>

      <div
        style={{
          marginBottom: "1rem",
          padding: "1rem",
          background: "#f8f9fa",
          borderRadius: "4px",
          border: "1px solid #e9ecef",
        }}
      >
        <h5 style={{ margin: "0 0 0.5rem 0" }}>JSON Editor</h5>
        <p style={{ margin: "0", fontSize: "0.85rem", color: "#6c757d" }}>
          Edit the JSON below. Changes will be applied as a JSON Merge Patch.
          Set fields to <code>null</code> to remove them.
          {readOnlyFields.length > 0 && (
            <>
              <br />
              <strong>Read-only fields:</strong>{" "}
              {readOnlyFields.map((field, index) => (
                <span key={field}>
                  <code>{field}</code>
                  {index < readOnlyFields.length - 1 && ", "}
                </span>
              ))}
            </>
          )}
        </p>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "4px",
          overflow: "hidden",
          marginBottom: "1rem",
          position: "relative",
        }}
      >
        <JsonView
          value={jsonData}
          onChange={handleJsonChange}
          style={{
            backgroundColor: "#ffffff",
            fontSize: "14px",
            minHeight: "200px",
          }}
          indentWidth={15}
          collapsed={false}
          displayObjectSize={false}
          displayDataTypes={false}
          enableClipboard={true}
        />

        {readOnlyFields.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              background: "rgba(255, 193, 7, 0.9)",
              color: "#856404",
              padding: "0.25rem 0.5rem",
              borderRadius: "3px",
              fontSize: "0.75rem",
              fontWeight: "bold",
            }}
          >
            Some fields are read-only
          </div>
        )}
      </div>

      {message.text && (
        <div
          style={{
            padding: "0.75rem",
            borderRadius: "4px",
            marginBottom: "1rem",
            backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da",
            color: message.type === "success" ? "#155724" : "#721c24",
            border:
              message.type === "success"
                ? "1px solid #c3e6cb"
                : "1px solid #f5c6cb",
            fontSize: "0.9rem",
          }}
        >
          {message.text}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          justifyContent: "flex-end",
          paddingTop: "1rem",
          borderTop: "1px solid #e9ecef",
        }}
      >
        <button
          onClick={handleReset}
          disabled={isSubmitting}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          Reset
        </button>
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#fff",
            color: "#333",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: isSubmitting ? "#6c757d" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
          }}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div
        style={{
          marginTop: "1rem",
          padding: "0.75rem",
          backgroundColor: "#e3f2fd",
          borderRadius: "4px",
          fontSize: "0.85rem",
          color: "#1565c0",
        }}
      >
        <strong>💡 Tip:</strong> This editor supports JSON Merge Patch (RFC
        7396). Only changed fields will be sent to the server. Use{" "}
        <code>null</code> to delete fields.
      </div>
    </Modal>
  );
};

export default ResourceEditor;
