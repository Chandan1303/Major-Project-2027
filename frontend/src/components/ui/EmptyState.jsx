import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There are currently no records to display.',
  actionLabel,
  actionText,
  onAction,
  className = ''
}) {
  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    if (typeof Icon === 'function' || (typeof Icon === 'object' && (Icon.$$typeof || Icon.render))) {
      const IconComponent = Icon;
      return <IconComponent size={36} strokeWidth={1.5} />;
    }
    return <span style={{ fontSize: 32 }}>{Icon}</span>;
  };

  const btnLabel = actionLabel || actionText;

  return (
    <div className={`empty-state-card ${className}`}>
      <div className="esc-icon-wrap">
        {renderIcon()}
      </div>
      <h3 className="esc-title">{title}</h3>
      <p className="esc-desc">{description}</p>
      {btnLabel && onAction && (
        <button className="btn-primary esc-btn" onClick={onAction}>
          {btnLabel}
        </button>
      )}
    </div>
  );
}
