import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

const SectionLabel: React.FC<SectionLabelProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`text-xs lg:text-sm xl:text-base uppercase font-semibold tracking-wider mb-3 lg:mb-4 xl:mb-5 ml-0 ${className}`.trim()}
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
    </div>
  );
};

export default SectionLabel;
