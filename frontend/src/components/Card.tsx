import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "md",
}) => {
  const paddingClasses = {
    sm: "p-3",
    md: "p-4 md:p-4",
    lg: "p-6 md:p-4",
  };

  const baseClasses = `${paddingClasses[padding]}`;

  return (
    <div
      className={`${baseClasses} ${className}`.trim()}
      style={{
        backgroundColor: "var(--bg-secondary)",
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
    className={`p-4 ${className}`.trim()}
    style={{
      backgroundColor: "var(--bg-secondary)",
      color: "var(--text-primary)",
    }}
  >
    {children}
  </div>
);

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}> = ({ children, className = "", padding = "md" }) => {
  const paddingClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6 md:p-4",
  };

  return (
    <div
      className={`${paddingClasses[padding]} ${className}`.trim()}
      style={{ color: "var(--text-primary)" }}
    >
      {children}
    </div>
  );
};

export default Card;
