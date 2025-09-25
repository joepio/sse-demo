import React, { useState } from "react";
import type { CloudEvent } from "../types";
import Card, { CardHeader, CardContent } from "./Card";

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
        type: "https://api.example.com/events/timeline/item/created/v1",
        time: new Date().toISOString(),
        datacontenttype: "application/json",
        data: {
          item_type: "comment",
          item_id: `comment-${Date.now()}`,
          actor: "user@example.com", // In a real app, this would come from auth
          timestamp: new Date().toISOString(),
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
    <div className="flex mb-8 relative z-20">
      <div className="flex-shrink-0 mr-4 md:mr-3 w-10 md:w-8">
        <div
          className="w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold text-sm md:text-xs border-2"
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
        <Card>
          <CardHeader>
            <h3 className="m-0 text-sm font-semibold text-text-primary">
              Bericht schrijven
            </h3>
          </CardHeader>

          <form onSubmit={handleCommentSubmit}>
            <CardContent>
              {commentError && (
                <div
                  className="px-4 py-3 mb-4 text-sm border-l-4 bg-bg-error text-text-error"
                  style={{ borderLeftColor: "var(--text-error)" }}
                >
                  <strong>Fout:</strong> {commentError}
                </div>
              )}
              <textarea
                className="w-full min-h-[120px] border-none outline-none resize-y text-sm leading-relaxed placeholder:opacity-60"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
                placeholder="Voeg een opmerking toe..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                disabled={isSubmittingComment}
              />
            </CardContent>

            <CardHeader>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all duration-150 border bg-button-primary-bg text-text-inverse border-button-primary-bg hover:bg-button-primary-hover hover:border-button-primary-hover disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!commentText.trim() || isSubmittingComment}
                >
                  Verzenden
                </button>
              </div>
            </CardHeader>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CommentForm;
