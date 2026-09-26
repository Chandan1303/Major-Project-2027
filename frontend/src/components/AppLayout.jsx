import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Brand from './Brand';

const navItems = [
  { label: 'Home',        path: '/home',       icon: '🏠' },
  { label: 'Dashboard',   path: '/dashboard',  icon: '📊' },
  { label: 'Predict',     path: '/prediction', icon: '🌾' },
  { label: 'Crop Health', path: '/crop-health',icon: '🛰️' },
  { label: 'Weather',     path: '/weather',    icon: '☁️' },
  { label: 'Soil',        path: '/soil',       icon: '🪨' },
  { label: 'Varieties',   path: '/varieties',  icon: '🔬' },
  { label: 'Yield Loss',  path: '/yield-loss', icon: '📉' },
  { label: 'AI Insights', path: '/insights',   icon: '🤖' },
  { label: 'Farm Mgmt',   path: '/farms',      icon: '🏡' },
  { label: 'Reports',     path: '/reports',    icon: '📄' },
  { label: 'About',       path: '/about',      icon: 'ℹ️' },
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const signout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'sidebar-link-active' : ''}`}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name || 'User'}</span>
              <span className="sidebar-user-email">{user?.email || ''}</span>
            </div>
          </div>
          <button className="sidebar-signout" onClick={signout}>Sign out</button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Main area */}
      <div className="app-main">
        {/* Top bar (mobile) */}
        <header className="app-topbar">
          <button className="topbar-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
          <Brand />
          <div className="topbar-user">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
        </header>
        <div className="app-content">
          {children}
        </div>
      </div>
    </div>
  );
}
