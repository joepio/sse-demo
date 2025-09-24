import React from "react";
import type { EventPluginProps } from "./types";

const CommentPlugin: React.FC<EventPluginProps> = ({ data }) => {
  const { content, mentions } = (data.item_data || data) as {
    content?: unknown;
    mentions?: unknown[];
  };

  return (
    <div className="p-0">
      <div className="prose prose-sm max-w-none">
        <p className="m-0 mb-2 leading-relaxed text-text-primary">
          {typeof content === "string" ? content : "Geen inhoud"}
        </p>
        {Array.isArray(mentions) && mentions.length > 0 && (
          <div className="mt-2">
            <small className="text-text-tertiary text-xs">
              Vermeldingen: {mentions.map(String).join(", ")}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentPlugin;
