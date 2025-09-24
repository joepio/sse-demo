import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "subtle";
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default"
}) => {
  const baseClasses = "rounded-lg overflow-hidden";

  const variantClasses = variant === "subtle"
    ? "border-0 bg-transparent"
    : "border";

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`.trim()}
      style={variant === "default" ? {
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-primary)",
      } : undefined}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ""
}) => (
  <div
    className={`p-4 md:p-3 border-b ${className}`.trim()}
    style={{
      backgroundColor: "var(--bg-tertiary)",
      borderBottomColor: "var(--border-primary)",
    }}
  >
    {children}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ""
}) => (
  <div
    className={`p-6 md:p-4 ${className}`.trim()}
    style={{ color: "var(--text-primary)" }}
  >
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ""
}) => (
  <div
    className={`px-6 py-3 md:px-4 md:py-2 border-t ${className}`.trim()}
    style={{
      backgroundColor: "var(--bg-tertiary)",
      borderTopColor: "var(--border-primary)",
    }}
  >
    {children}
  </div>
);

export default Card;
