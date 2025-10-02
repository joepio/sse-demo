import React from "react";
import Card from "./Card";

interface DeletedItemProps {
  itemId: string;
  itemType: string;
  actor: string;
  timeLabel: string;
  onTimeClick: () => void;
  title?: string;
}

const DeletedItem: React.FC<DeletedItemProps> = ({
  itemId,
  itemType,
}) => {
  const getItemTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "document":
        return "Document";
      case "comment":
        return "Comment";
      case "task":
        return "Taak";
      case "planning":
        return "Planning";
      default:
        return "Item";
    }
  };


  return (
    <Card padding="sm" id={itemId}>
      <div className="prose prose-sm max-w-none">
        <p
          className="m-0 mb-2 leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl"
          style={{ color: "var(--text-primary)" }}
        >
          <strong>
            <i className="fa-solid fa-trash" aria-hidden="true"></i>{" "}
            {getItemTypeLabel(itemType)} verwijderd
          </strong>
        </p>

      </div>
    </Card>
  );
};

export default DeletedItem;
