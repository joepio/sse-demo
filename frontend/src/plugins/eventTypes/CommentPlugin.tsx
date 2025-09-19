import React from "react";
import type { EventPluginProps } from "./types";

const CommentPlugin: React.FC<EventPluginProps> = ({ data }) => {
  // Handle nested item_data structure for timeline comments
  const commentData = (data.item_data || data) as Record<string, unknown>;
  const content =
    commentData.content || (data as Record<string, unknown>).content;
  const mentions =
    commentData.mentions || (data as Record<string, unknown>).mentions;

  return (
    <div className="timeline-content-comment">
      <p>{typeof content === "string" ? content : "Geen inhoud"}</p>
      {Array.isArray(mentions) && mentions.length > 0 && (
        <div className="mentions">
          <small>Vermeldingen: {mentions.map(String).join(", ")}</small>
        </div>
      )}
    </div>
  );
};

export default CommentPlugin;
