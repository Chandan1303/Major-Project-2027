import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Brand from './Brand';
import { alertApi } from '../services/api';

const NAV = [
  { group: 'Main',        items: [
    { label: 'Home',             path: '/home',        icon: '🏠' },
    { label: 'Dashboard',        path: '/dashboard',   icon: '📊' },
  ]},
  { group: 'Farm',        items: [
    { label: 'My Farm',          path: '/farms',       icon: '🏡' },
    { label: 'Farm Map',         path: '/farm-map',    icon: '🗺️' },
  ]},
  { group: 'Intelligence', items: [
    { label: 'AI Yield Predict', path: '/prediction',  icon: '🌾' },
    { label: 'What-If Simulator',path: '/simulator',   icon: '🔮' },
    { label: 'Crop Intelligence',path: '/crop-intel',  icon: '🌿' },
    { label: 'AI Insights',      path: '/insights',    icon: '🤖' },
  ]},
  { group: 'Environment', items: [
    { label: 'Environment',      path: '/environment', icon: '🌍' },
    { label: 'Weather',          path: '/weather',     icon: '☁️' },
    { label: 'Soil Analysis',    path: '/soil',        icon: '🪨' },
  ]},
  { group: 'Analytics',   items: [
    { label: 'Variety Intel',    path: '/varieties',   icon: '🔬' },
    { label: 'Loss & Risk',      path: '/yield-loss',  icon: '📉' },
    { label: 'Analytics',        path: '/analytics',   icon: '📈' },
  ]},
  { group: 'Tools',       items: [
    { label: 'Reports',          path: '/reports',     icon: '📄' },
    { label: 'AI Chat',          path: '/chat',        icon: '💬' },
    { label: 'Alerts',           path: '/alerts',      icon: '🔔' },
  ]},
  { group: 'Account',     items: [
    { label: 'Profile',          path: '/profile',     icon: '👤' },
    { label: 'About',            path: '/about',       icon: 'ℹ️'  },
  ]},
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const sidebarRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    alertApi.list().then(r => setUnread(r.data?.unread_count || 0)).catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const savedScroll = Number(sidebar.dataset.scrollTop || 0);
    if (!Number.isNaN(savedScroll)) {
      sidebar.scrollTop = savedScroll;
    }
  }, [location.pathname]);

  const handleNav = (path) => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      sidebar.dataset.scrollTop = String(sidebar.scrollTop);
    }
    navigate(path);
    setMobileOpen(false);
  };

  const signout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* ── Sidebar ── */}
      <aside ref={sidebarRef} className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
          <button className="sidebar-collapse-btn" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(group => (
            <div key={group.group} className="nav-group">
              {!collapsed && <span className="nav-group-label">{group.group}</span>}
              {group.items.map(item => (
                <button
                  key={item.path}
                  className={`sidebar-link ${isActive(item.path) ? 'sidebar-link-active' : ''}`}
                  onClick={() => handleNav(item.path)}
                  title={item.label}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {!collapsed && <span className="sidebar-label">{item.label}</span>}
                  {item.path === '/alerts' && unread > 0 && (
                    <span className="nav-badge">{unread}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.name || 'User'}</span>
                <span className="sidebar-user-role">{user?.role || 'user'}</span>
              </div>
            </div>
          )}
          <button className="sidebar-signout" onClick={signout} title="Sign out">
            {collapsed ? '⏏' : '⏏ Sign out'}
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* ── Main ── */}
      <div className="app-main">
        <header className="app-topbar">
          <button className="topbar-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
          <div className="topbar-brand-mobile"><Brand /></div>
          <div className="topbar-right">
            <button className="topbar-alert-btn" onClick={() => navigate('/alerts')}>
              🔔 {unread > 0 && <span className="topbar-badge">{unread}</span>}
            </button>
            <div className="topbar-user" onClick={() => navigate('/profile')}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
