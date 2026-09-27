import React from 'react';

export function Skeleton({ width, height, borderRadius = 8, className = '', style = {} }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: width || '100%',
        height: height || 20,
        borderRadius,
        ...style
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <Skeleton width={42} height={42} borderRadius={12} />
        <div style={{ flex: 1 }}>
          <Skeleton width="40%" height={14} style={{ marginBottom: 6 }} />
          <Skeleton width="60%" height={20} />
        </div>
      </div>
      <Skeleton width="100%" height={80} borderRadius={8} />
    </div>
  );
}
