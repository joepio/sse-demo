import React from 'react';

interface ActionLinkProps {
  children: React.ReactNode;
  href: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  target?: string;
  rel?: string;
  className?: string;
}

const ActionLink: React.FC<ActionLinkProps> = ({
  children,
  href,
  variant = 'primary',
  disabled = false,
  target,
  rel,
  className = '',
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  if (disabled) {
    return (
      <span className={`${classes} disabled`} style={{ cursor: 'not-allowed', opacity: 0.6 }}>
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      className={classes}
      target={target}
      rel={rel}
      style={{ textDecoration: 'none' }}
    >
      {children}
    </a>
  );
};

export default ActionLink;
