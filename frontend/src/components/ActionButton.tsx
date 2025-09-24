import React from "react";

interface ActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  type = "button",
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all duration-150 border disabled:opacity-60 disabled:cursor-not-allowed";

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "var(--button-primary-bg)",
          color: "var(--text-inverse)",
          borderColor: "var(--button-primary-bg)",
        };
      case "secondary":
        return {
          backgroundColor: "var(--button-secondary-bg)",
          color: "var(--text-primary)",
          borderColor: "var(--border-primary)",
        };
      case "danger":
        return {
          backgroundColor: "var(--button-danger-bg)",
          color: "var(--text-inverse)",
          borderColor: "var(--button-danger-bg)",
        };
    }
  };

  const hoverClass =
    variant === "primary"
      ? "btn-primary-hover"
      : variant === "danger"
        ? "btn-danger-hover"
        : "btn-secondary-hover";

  return (
    <button
      type={type}
      className={`${baseClasses} ${hoverClass} ${className}`.trim()}
      style={getVariantStyles()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default ActionButton;
