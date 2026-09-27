import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  change,
  changeUp,
  color = '#10b981',
  subtitle,
  onClick,
  className = '',
  loading = false
}) {
  if (loading) {
    return (
      <div className={`stat-card stat-card-loading ${className}`}>
        <div className="skeleton-line skeleton-title" style={{ width: '40%' }} />
        <div className="skeleton-line skeleton-value" style={{ width: '60%', height: 28, margin: '8px 0' }} />
        <div className="skeleton-line skeleton-caption" style={{ width: '50%' }} />
      </div>
    );
  }

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    if (typeof Icon === 'function' || (typeof Icon === 'object' && (Icon.$$typeof || Icon.render))) {
      const IconComponent = Icon;
      return <IconComponent size={20} strokeWidth={2} />;
    }
    return Icon;
  };

  return (
    <div
      className={`stat-card ${onClick ? 'stat-card-clickable' : ''} ${className}`}
      onClick={onClick}
      style={{ '--card-accent': color }}
    >
      <div className="sc-top">
        <div
          className="sc-icon-wrap"
          style={{
            background: `linear-gradient(135deg, ${color}20, ${color}08)`,
            color: color,
            borderColor: `${color}30`
          }}
        >
          {renderIcon()}
        </div>
        {change !== undefined && change !== null && (
          <div className={`sc-trend-pill ${changeUp ? 'sc-trend-up' : 'sc-trend-down'}`}>
            {changeUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{change}</span>
          </div>
        )}
      </div>

      <div className="sc-body">
        <span className="sc-label">{label}</span>
        <div className="sc-value-row">
          <span className="sc-value">{value ?? '—'}</span>
          {unit && <span className="sc-unit">{unit}</span>}
        </div>
        {subtitle && <span className="sc-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
