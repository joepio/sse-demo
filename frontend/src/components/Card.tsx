import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  const baseClasses = "rounded-lg overflow-hidden border";

  return (
    <div
      className={`${baseClasses} ${className}`.trim()}
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-primary)",
      }}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
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

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`p-6 md:p-4 ${className}`.trim()}
    style={{ color: "var(--text-primary)" }}
  >
    {children}
  </div>
);

export default Card;
