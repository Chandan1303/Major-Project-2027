import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useField } from '../context/FieldContext';
import Brand from './Brand';
import { alertApi } from '../services/api';

// Navigation for Standard Farmers / Users
const USER_NAV = [
  { group: 'Main', items: [
    { label: 'Home',             path: '/home',        icon: '🏠' },
    { label: 'Dashboard',        path: '/dashboard',   icon: '📊' },
  ]},
  { group: 'Farm Management', items: [
    { label: 'My Farm & Fields', path: '/farms',       icon: '🏡' },
    { label: 'Interactive Map',  path: '/farm-map',    icon: '🗺️' },
  ]},
  { group: 'AI & Intelligence', items: [
    { label: 'AI Yield Predict', path: '/prediction',  icon: '🌾' },
    { label: 'Explainable AI',   path: '/insights',    icon: '🤖' },
    { label: 'What-If Simulator',path: '/simulator',   icon: '🔮' },
    { label: 'Crop Intelligence',path: '/crop-intel',  icon: '🌿' },
    { label: 'ML Performance',   path: '/ml-performance', icon: '🧠' },
  ]},
  { group: 'Environment', items: [
    { label: 'Environment Hub',  path: '/environment', icon: '🌍' },
    { label: 'Weather Forecast', path: '/weather',     icon: '☁️' },
    { label: 'Soil Analysis',    path: '/soil',        icon: '🪨' },
  ]},
  { group: 'Analytics & Risk', items: [
    { label: 'Variety Intel',    path: '/varieties',   icon: '🔬' },
    { label: 'Loss & Risk',      path: '/yield-loss',  icon: '📉' },
    { label: 'Yield Analytics',  path: '/analytics',   icon: '📈' },
  ]},
  { group: 'Advisory & Tools', items: [
    { label: 'Agri Reports',     path: '/reports',     icon: '📄' },
    { label: 'AI Chat Assistant',path: '/chat',        icon: '💬' },
    { label: 'Early Warnings',   path: '/alerts',      icon: '🔔' },
  ]},
  { group: 'Account', items: [
    { label: 'Profile Settings', path: '/profile',     icon: '👤' },
    { label: 'System About',     path: '/about',       icon: 'ℹ️'  },
  ]},
];

// Navigation for Agricultural Extension Officers
const OFFICER_NAV = [
  { group: 'Extension Oversight', items: [
    { label: 'Officer Dashboard', path: '/officer',                    icon: '🏛️' },
    { label: 'High-Risk Fields',  path: '/officer?tab=high_risk',      icon: '⚠️' },
    { label: 'Regional Farms',    path: '/farms',                      icon: '🏡' },
    { label: 'Interactive Map',   path: '/farm-map',                   icon: '🗺️' },
  ]},
  { group: 'Agronomic Analytics', items: [
    { label: 'Yield Predictions', path: '/prediction',                 icon: '🌾' },
    { label: 'Loss & Risk Audit', path: '/yield-loss',                 icon: '📉' },
    { label: 'Variety Intel',     path: '/varieties',                  icon: '🔬' },
    { label: 'ML Benchmarks',     path: '/ml-performance',             icon: '🧠' },
    { label: 'Territory Trends',  path: '/analytics',                  icon: '📈' },
    { label: 'Field Dossiers',    path: '/reports',                    icon: '📄' },
  ]},
  { group: 'Account', items: [
    { label: 'Officer Profile',   path: '/profile',                    icon: '👤' },
    { label: 'System Info',       path: '/about',                      icon: 'ℹ️'  },
  ]},
];

// Navigation for Administrators
const ADMIN_NAV = [
  { group: 'Administration', items: [
    { label: 'Admin Dashboard',   path: '/dashboard',                   icon: '📊', tab: 'overview' },
    { label: 'User Management',   path: '/dashboard?tab=users',         icon: '👥', tab: 'users' },
    { label: 'ML Benchmarks',     path: '/dashboard?tab=ml',            icon: '🧠', tab: 'ml' },
    { label: 'Varieties Registry',path: '/dashboard?tab=varieties',     icon: '🌾', tab: 'varieties' },
    { label: 'Predictions Audit', path: '/dashboard?tab=predictions',   icon: '📈', tab: 'predictions' },
    { label: 'System Alerts',     path: '/dashboard?tab=alerts',        icon: '🔔', tab: 'alerts' },
  ]},
  { group: 'Account', items: [
    { label: 'Admin Profile',     path: '/profile',                     icon: '👤' },
    { label: 'System Info',       path: '/about',                       icon: 'ℹ️'  },
  ]},
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { allFields, selectedFieldId, selectField } = useField();
  const sidebarRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'officer';
  const navItems = isAdmin ? ADMIN_NAV : isOfficer ? OFFICER_NAV : USER_NAV;

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
  }, [location.pathname, location.search]);

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

  const isActive = (itemPath) => {
    const currentFull = location.pathname + location.search;
    if (itemPath === '/dashboard') {
      return location.pathname === '/dashboard' && (!location.search || location.search === '?tab=overview');
    }
    if (itemPath.includes('?')) {
      return currentFull === itemPath;
    }
    return location.pathname === itemPath;
  };

  const roleColor = isAdmin ? '#7c3aed' : isOfficer ? '#0284c7' : '#2d7a3e';
  const roleTitle = isAdmin ? 'Administrator' : isOfficer ? 'Agricultural Officer' : 'Sugarcane Grower';

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${isAdmin ? 'admin-shell' : ''}`}>
      {/* ── Sidebar ── */}
      <aside ref={sidebarRef} className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
          <button className="sidebar-collapse-btn" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {!collapsed && (
          <div style={{
            margin: '0 12px 10px',
            padding: '6px 10px',
            background: isAdmin ? '#f3e8ff' : isOfficer ? '#e0f2fe' : '#f0fdf4',
            borderRadius: 8,
            border: `1px solid ${isAdmin ? '#e9d5ff' : isOfficer ? '#bae6fd' : '#bbf7d0'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ fontSize: 13 }}>{isAdmin ? '🛡️' : isOfficer ? '🏛️' : '🌾'}</span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: roleColor,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              {roleTitle}
            </span>
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map(group => (
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
              <div
                className="sidebar-avatar"
                style={{
                  background: roleColor,
                  boxShadow: `0 0 10px ${roleColor}40`
                }}
              >
                {isAdmin ? '🛡️' : isOfficer ? '🏛️' : (user?.name?.[0]?.toUpperCase() || 'U')}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.name || roleTitle}</span>
                <span
                  className="sidebar-user-role"
                  style={{
                    color: roleColor,
                    fontWeight: 600,
                    letterSpacing: '0.02em'
                  }}
                >
                  {roleTitle}
                </span>
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

          {/* Global Active Field Connection Selector */}
          {!isAdmin && allFields.length > 0 && (
            <div className="topbar-field-selector" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '4px 10px',
              borderRadius: 8,
              fontSize: 12
            }}>
              <span style={{ fontSize: 14 }}>📍</span>
              <span style={{ color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Active Field:</span>
              <select
                value={selectedFieldId || ''}
                onChange={(e) => selectField(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer',
                  outline: 'none',
                  fontSize: 12
                }}
                title="Active field propagates across all intelligence and analytics modules"
              >
                {allFields.map(fld => (
                  <option key={fld.id} value={fld.id}>
                    {fld.farm_name} › {fld.name} ({fld.sugarcane_variety || 'Co 86032'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="topbar-right">
            {isAdmin && (
              <span
                className="status-badge"
                style={{
                  background: '#f3e8ff',
                  color: '#7c3aed',
                  border: '1px solid #e9d5ff',
                  marginRight: '6px',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                <span className="pulsing-dot purple" style={{ width: 6, height: 6 }} /> Admin Active
              </span>
            )}
            {isOfficer && (
              <span
                className="status-badge"
                style={{
                  background: '#e0f2fe',
                  color: '#0284c7',
                  border: '1px solid #bae6fd',
                  marginRight: '6px',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                <span className="pulsing-dot" style={{ width: 6, height: 6, background: '#0284c7' }} /> Extension Officer
              </span>
            )}
            <button className="topbar-alert-btn" onClick={() => navigate(isAdmin ? '/dashboard?tab=alerts' : '/alerts')} title="Alert Center">
              🔔 {unread > 0 && <span className="topbar-badge">{unread}</span>}
            </button>
            <div
              className="topbar-user"
              onClick={() => navigate('/profile')}
              title="View Profile"
              style={{
                background: roleColor,
                color: '#ffffff',
                fontWeight: 700
              }}
            >
              {isAdmin ? '🛡️' : isOfficer ? '🏛️' : (user?.name?.[0]?.toUpperCase() || 'U')}
            </div>
          </div>
        </header>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
