import React, { useState } from "react";
import type { CloudEvent } from "../types";
import Card from "./Card";
import { Button } from "./ActionButton";

interface CommentFormProps {
  zaakId: string;
  onSubmit: (event: CloudEvent) => Promise<void>;
}

const CommentForm: React.FC<CommentFormProps> = ({ zaakId, onSubmit }) => {
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      // Create a timeline comment event
      const commentEvent: CloudEvent = {
        specversion: "1.0",
        id: crypto.randomUUID(),
        source: `frontend-demo-event`,
        subject: zaakId,
        type: "item.created",
        time: new Date().toISOString(),
        datacontenttype: "application/json",
        data: {
          item_type: "comment",
          item_id: `comment-${Date.now()}`,
          actor: "user@example.com", // In a real app, this would come from auth
          item_data: {
            content: commentText.trim(),
            parent_id: null,
            mentions: [],
          },
        },
      };

      // Send the comment event to the server
      await onSubmit(commentEvent);
      setCommentText("");
    } catch (error) {
      console.error("Failed to submit comment:", error);
      setCommentError(
        error instanceof Error ? error.message : "Opmerking verzenden mislukt",
      );
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div
      className="flex mb-8 lg:mb-12 xl:mb-16 relative z-20"
      data-testid="comment-form"
    >
      <div className="flex-shrink-0 mr-3 sm:mr-4 lg:mr-4 xl:mr-5 w-10 sm:w-8 lg:w-10 xl:w-12">
        <div
          className="w-10 h-10 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-full flex items-center justify-center font-semibold text-sm sm:text-xs lg:text-sm xl:text-base border-2"
          style={{
            backgroundColor: "var(--text-primary)",
            color: "var(--text-inverse)",
            borderColor: "var(--bg-primary)",
          }}
        >
          U
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <Card padding="sm">
          <div className="mb-3">
            <h3
              className="m-0 text-sm sm:text-base lg:text-lg xl:text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Bericht schrijven
            </h3>
          </div>

          <form onSubmit={handleCommentSubmit}>
            <div>
              {commentError && (
                <div
                  className="px-4 py-3 mb-4 text-sm border-l-4 bg-bg-error text-text-error"
                  style={{ borderLeftColor: "var(--text-error)" }}
                >
                  <strong>Fout:</strong> {commentError}
                </div>
              )}
              <textarea
                className="w-full min-h-[120px] sm:min-h-[140px] lg:min-h-[160px] border outline-none resize-y text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed placeholder:opacity-60 mb-4 transition-colors duration-200"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-primary)",
                }}
                placeholder="Voeg een opmerking toe..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-focus)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-primary)";
                }}
                rows={4}
                disabled={isSubmittingComment}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!commentText.trim() || isSubmittingComment}
                  loading={isSubmittingComment}
                >
                  Verzenden
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CommentForm;
