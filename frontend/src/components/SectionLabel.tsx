import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

const SectionLabel: React.FC<SectionLabelProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`text-xs uppercase font-semibold tracking-wider mb-3 ml-0 ${className}`.trim()}
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
    </div>
  );
};

export default SectionLabel;
