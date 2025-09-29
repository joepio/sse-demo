import React from "react";

interface DocumentationSectionProps {
  id?: string;
  title: string;
  emoji?: string;
  level?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}

const DocumentationSection: React.FC<DocumentationSectionProps> = ({
  id,
  title,
  emoji,
  level = 2,
  children,
  className = "",
}) => {
  const getHeadingClasses = () => {
    switch (level) {
      case 1:
        return "text-3xl font-bold mb-2";
      case 2:
        return "text-2xl font-semibold mb-6";
      case 3:
        return "text-xl font-semibold mb-4";
      default:
        return "text-2xl font-semibold mb-6";
    }
  };

  const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;

  return (
    <section id={id} className={className}>
      {React.createElement(
        HeadingTag,
        {
          className: getHeadingClasses(),
          style: {
            color: level === 1 ? "var(--ro-lintblauw)" : "var(--ro-lintblauw)",
          },
        },
        emoji && `${emoji} `,
        title,
      )}
      {children}
    </section>
  );
};

export default DocumentationSection;
