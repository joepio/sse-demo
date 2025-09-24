import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "600px",
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4 md:p-2"
      onClick={(e) => {
        // Only close if clicking the overlay, not the modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-bg-primary rounded-lg shadow-theme-lg w-full max-h-[90vh] overflow-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
        style={{ maxWidth }}
      >
        <div className="flex justify-between items-center p-6 md:p-4 border-b border-border-secondary">
          <h2 className="text-xl font-semibold text-text-primary m-0">
            {title}
          </h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors duration-150 text-2xl leading-none p-0 border-0 bg-transparent cursor-pointer"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="p-6 md:p-4 text-text-primary">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
