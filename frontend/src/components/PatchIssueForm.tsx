import React, { useState } from "react";
import type { CloudEvent, PatchFormData, Issue } from "../types";

interface PatchIssueFormProps {
  issues: Record<string, Issue>;
  onPatchIssue: (event: CloudEvent) => Promise<void>;
}

const PatchIssueForm: React.FC<PatchIssueFormProps> = ({
  issues,
  onPatchIssue,
}) => {
  const [formData, setFormData] = useState<PatchFormData>({
    issueId: "",
    title: "",
    status: "",
    assignee: "",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  }>({ text: "", type: "success" });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage({ text: "", type: "success" });
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: "", type: "success" });
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const issueId = formData.issueId.trim();
    if (!issueId) {
      showMessage("Please enter an issue ID", "error");
      return;
    }

    // Check if issue exists
    if (!issues[issueId]) {
      showMessage("Issue ID not found", "error");
      return;
    }

    // Build merge patch object
    const mergePatch: any = {};

    if (formData.title.trim()) {
      mergePatch.title = formData.title.trim();
    }

    if (formData.status) {
      mergePatch.status = formData.status;
    }

    if (formData.assignee === "") {
      mergePatch.assignee = null; // Remove assignee
    } else if (formData.assignee.trim()) {
      mergePatch.assignee = formData.assignee.trim();
    }

    if (formData.description.trim()) {
      mergePatch.description = formData.description.trim();
    }

    if (Object.keys(mergePatch).length === 0) {
      showMessage("No changes specified", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const cloudEvent: CloudEvent = {
        specversion: "1.0",
        id: crypto.randomUUID(),
        source: "/issues",
        subject: issueId,
        type: "com.example.issue.patch",
        time: new Date().toISOString(),
        datacontenttype: "application/merge-patch+json",
        data: mergePatch,
      };

      await onPatchIssue(cloudEvent);

      showMessage(`Issue ${issueId} patched successfully!`, "success");

      // Clear form
      setFormData({
        issueId: "",
        title: "",
        status: "",
        assignee: "",
        description: "",
      });
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "Failed to patch issue",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "2rem",
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h3>Issue Patcher</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            type="text"
            name="issueId"
            value={formData.issueId}
            onChange={handleInputChange}
            placeholder="Issue ID (e.g., 123)"
            required
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="New title (optional)"
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <option value="">-- Keep status --</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            type="text"
            name="assignee"
            value={formData.assignee}
            onChange={handleInputChange}
            placeholder="Assignee (or leave empty to remove)"
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="New description (optional)"
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: isSubmitting ? "#6c757d" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            fontSize: "1rem",
            marginBottom: message.text ? "1rem" : 0,
          }}
        >
          {isSubmitting ? "Patching..." : "Patch Issue"}
        </button>

        {message.text && (
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              backgroundColor:
                message.type === "success" ? "#d4edda" : "#f8d7da",
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
      </form>
    </div>
  );
};

export default PatchIssueForm;
