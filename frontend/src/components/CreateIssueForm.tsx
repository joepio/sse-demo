import React, { useState } from "react";
import type { CloudEvent, IssueFormData } from "../types";

interface CreateIssueFormProps {
  onCreateIssue: (event: CloudEvent) => Promise<void>;
}

const CreateIssueForm: React.FC<CreateIssueFormProps> = ({ onCreateIssue }) => {
  const [formData, setFormData] = useState<IssueFormData>({
    title: "",
    description: "",
    priority: "",
    assignee: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const issueId = crypto.randomUUID();
      const issueData: any = {
        id: issueId,
        title: formData.title.trim(),
        status: "open",
        created_at: new Date().toISOString(),
      };

      if (formData.description.trim()) {
        issueData.description = formData.description.trim();
      }

      if (formData.priority) {
        issueData.priority = formData.priority;
      }

      if (formData.assignee.trim()) {
        issueData.assignee = formData.assignee.trim();
      }

      const cloudEvent: CloudEvent = {
        specversion: "1.0",
        id: crypto.randomUUID(),
        source: "/issues",
        subject: issueId,
        type: "com.example.issue.create",
        time: new Date().toISOString(),
        datacontenttype: "application/json",
        data: issueData,
      };

      await onCreateIssue(cloudEvent);

      // Reset form on success
      setFormData({
        title: "",
        description: "",
        priority: "",
        assignee: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>Create New Issue</h3>
      <form
        onSubmit={handleSubmit}
        style={{
          marginBottom: "2rem",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Issue title"
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
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description (optional)"
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <option value="">Priority (optional)</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            type="email"
            name="assignee"
            value={formData.assignee}
            onChange={handleInputChange}
            placeholder="Assignee email (optional)"
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>

        {error && (
          <div
            style={{
              color: "#dc3545",
              fontSize: "0.9rem",
              marginBottom: "1rem",
              padding: "0.5rem",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "4px",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: isSubmitting ? "#6c757d" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            fontSize: "1rem",
          }}
        >
          {isSubmitting ? "Creating..." : "Create Issue"}
        </button>
      </form>
    </div>
  );
};

export default CreateIssueForm;
