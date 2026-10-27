import React from 'react';
import { Sparkles } from 'lucide-react';

export const THEMES = [
  { id: 'emerald', label: 'Emerald Field', icon: '🌿', color: '#10b981' },
  { id: 'golden', label: 'Golden Sunset', icon: '🌅', color: '#f59e0b' },
  { id: 'midnight', label: 'Midnight Cyber', icon: '🌌', color: '#06b6d4' },
  { id: 'sage', label: 'Sage Botanical', icon: '🍃', color: '#14b8a6' },
];

export default function AuthThemeSwitcher({ currentTheme, onSelectTheme }) {
  return (
    <div className="auth-theme-toolbar" role="toolbar" aria-label="Visual theme selector">
      <div className="auth-theme-toolbar-badge" title="Customize theme">
        <Sparkles size={13} className="theme-sparkle-icon" />
        <span className="theme-toolbar-label">Theme</span>
      </div>
      <div className="auth-theme-buttons">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`auth-theme-btn ${currentTheme === t.id ? 'active' : ''}`}
            onClick={() => onSelectTheme(t.id)}
            aria-pressed={currentTheme === t.id}
            title={`Switch to ${t.label} theme`}
          >
            <span className="theme-emoji" aria-hidden="true">{t.icon}</span>
            <span className="theme-name">{t.label}</span>
            <span
              className="theme-dot"
              style={{ backgroundColor: t.color }}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
