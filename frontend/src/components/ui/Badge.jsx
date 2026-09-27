import React from 'react';

export default function Badge({
  children,
  variant = 'default', // default | low | medium | high | critical | success | warning | info
  dot = false,
  className = '',
  size = 'md' // sm | md | lg
}) {
  return (
    <span className={`badge-pill badge-${variant} badge-${size} ${className}`}>
      {dot && <span className={`badge-dot badge-dot-${variant}`} />}
      {children}
    </span>
  );
}
