import React from 'react';

interface DocumentationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  variant?: 'primary' | 'nav' | 'back';
}

const DocumentationLink: React.FC<DocumentationLinkProps> = ({
  href,
  children,
  className = '',
  target,
  rel,
  variant = 'primary'
}) => {
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = "var(--link-hover)";
    if (variant === 'nav' || variant === 'back') {
      e.currentTarget.style.textDecoration = "underline";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = "var(--link-primary)";
    if (variant === 'nav' || variant === 'back') {
      e.currentTarget.style.textDecoration = "none";
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'nav':
        return 'block';
      case 'back':
        return 'inline-flex items-center text-sm font-medium mb-4';
      default:
        return '';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          color: "var(--link-primary)",
          textDecoration: 'underline'
        };
      default:
        return { color: "var(--link-primary)" };
    }
  };

  const combinedClassName = `${getVariantClasses()} ${className}`.trim();

  return (
    <a
      href={href}
      className={combinedClassName}
      style={getVariantStyles()}
      target={target}
      rel={rel}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </a>
  );
};

export default DocumentationLink;
