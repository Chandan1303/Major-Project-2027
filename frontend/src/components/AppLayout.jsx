import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  MapPin,
  Map,
  Sparkles,
  Sprout,
  CloudSun,
  Layers,
  Dna,
  TrendingDown,
  BookOpen,
  LineChart,
  FileText,
  User,
  Info,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useField } from '../context/FieldContext';
import { useTheme } from '../context/ThemeContext';
import Brand from './Brand';

// Navigation for Sugarcane Yield Decision Support System
const USER_NAV = [
  { group: 'Main', items: [
    { label: 'Home',             path: '/home',        icon: Home },
    { label: 'Dashboard',        path: '/dashboard',   icon: LayoutDashboard },
  ]},
  { group: 'Farm Management', items: [
    { label: 'My Farm & Fields', path: '/farms',       icon: MapPin },
    { label: 'Interactive Map',  path: '/farm-map',    icon: Map },
  ]},
  { group: 'AI & Intelligence', items: [
    { label: 'AI Yield Predict', path: '/prediction',  icon: Sparkles, highlight: true },
    { label: 'Crop Growth Monitor', path: '/crop-intelligence', icon: Sprout },
    { label: 'Variety Growing Guide', path: '/growing-guide', icon: BookOpen },
  ]},
  { group: 'Environment', items: [
    { label: 'NDVI Crop Health', path: '/crop-health', icon: Sprout },
    { label: 'Weather Forecast', path: '/weather',     icon: CloudSun },
    { label: 'Soil Analysis',    path: '/soil',        icon: Layers },
  ]},
  { group: 'Analytics & Risk', items: [
    { label: 'Variety Intel',    path: '/varieties',   icon: Dna },
    { label: 'Loss & Risk',      path: '/yield-loss',  icon: TrendingDown },
    { label: 'Yield Analytics',  path: '/analytics',   icon: LineChart },
    { label: 'Agri Reports',     path: '/reports',     icon: FileText },
  ]},
  { group: 'Account', items: [
    { label: 'Profile Settings', path: '/profile',     icon: User },
    { label: 'System About',     path: '/about',       icon: Info },
  ]},
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { farms, selectedFarm, selectedField, selectedFieldId, selectField } = useField();
  const { theme, toggleTheme, isDark } = useTheme();
  const sidebarRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = USER_NAV;

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const savedScroll = Number(sidebar.dataset.scrollTop || 0);
    if (!Number.isNaN(savedScroll)) {
      sidebar.scrollTop = savedScroll;
    }
  }, [location.pathname, location.search]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const handleNav = (path) => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      sidebar.dataset.scrollTop = String(sidebar.scrollTop);
    }
    if (path === '/prediction') {
      const params = new URLSearchParams();
      const farmId = selectedField?.farm_id || selectedFarm?.id;
      if (farmId) params.set('farm_id', String(farmId));
      if (selectedField?.id) params.set('field_id', String(selectedField.id));
      const query = params.toString();
      navigate(query ? `/prediction?${query}` : path);
    } else {
      navigate(path);
    }
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

  const roleColor = '#10b981';
  const roleBadgeBg = 'rgba(16, 185, 129, 0.12)';
  const roleBadgeBorder = 'rgba(16, 185, 129, 0.25)';
  const roleTitle = 'Sugarcane Grower';
  const RoleIcon = Sprout;

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* ── Sidebar ── */}
      <aside ref={sidebarRef} className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} aria-label="Main Navigation">
        <div className="sidebar-brand">
          <Brand />
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {!collapsed && (
          <div className="sidebar-role-card" style={{
            background: roleBadgeBg,
            borderColor: roleBadgeBorder,
          }}>
            <RoleIcon size={14} style={{ color: roleColor, flexShrink: 0 }} />
            <span className="sidebar-role-text" style={{ color: roleColor }}>
              {roleTitle}
            </span>
            <span className="sidebar-role-online-dot" style={{ background: roleColor }} />
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map(group => (
            <div key={group.group} className="nav-group">
              {!collapsed && <span className="nav-group-label">{group.group}</span>}
              {group.items.map(item => {
                const ItemIcon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    className={`sidebar-link ${active ? 'sidebar-link-active' : ''} ${item.highlight ? 'sidebar-link-highlight' : ''}`}
                    onClick={() => handleNav(item.path)}
                    title={collapsed ? item.label : undefined}
                    data-tooltip={item.label}
                  >
                    <span className="sidebar-icon">
                      <ItemIcon size={17} strokeWidth={active ? 2.2 : 1.8} />
                    </span>
                    {!collapsed && <span className="sidebar-label">{item.label}</span>}
                    {item.highlight && !collapsed && (
                      <span className="nav-ai-pill">AI</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-user" onClick={() => navigate('/profile')} title="View profile" style={{ cursor: 'pointer' }}>
              <div
                className="sidebar-avatar"
                style={{
                  background: `linear-gradient(135deg, ${roleColor}, #059669)`,
                  boxShadow: `0 0 12px ${roleColor}40`
                }}
              >
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.name || roleTitle}</span>
                <span className="sidebar-user-role" style={{ color: roleColor }}>
                  {roleTitle}
                </span>
              </div>
            </div>
          )}
          <button className="sidebar-signout" onClick={signout} title="Sign out" aria-label="Sign out">
            <LogOut size={16} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Main Container ── */}
      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="topbar-menu-btn"
              onClick={() => setMobileOpen(prev => !prev)}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="topbar-brand-mobile">
              <Brand />
            </div>

            {/* Global Active Field Connection Selector */}
            {farms.length > 0 && (
              <div className="topbar-field-selector" title="Active field propagates across all intelligence & analytics modules">
                <div className="tfs-icon-wrap">
                  <MapPin size={13} className="text-emerald-500" />
                </div>
                <span className="tfs-label">Active Field:</span>
                <select
                  value={selectedFieldId || ''}
                  onChange={(e) => selectField(e.target.value)}
                  className="tfs-select"
                >
                  <option value="">No active field</option>
                  {farms.map(farm => (
                    <optgroup key={farm.id} label={farm.name}>
                      {(farm.fields || []).map(field => (
                        <option key={field.id} value={field.id}>
                          {field.name} ({field.sugarcane_variety || 'Variety unavailable'})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="topbar-right">
            {/* Theme Toggle Button */}
            <button
              className="topbar-icon-btn theme-toggle-btn"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
            </button>

            {/* User Profile Avatar */}
            <button
              className="topbar-user"
              onClick={() => navigate('/profile')}
              title={`Logged in as ${user?.name || roleTitle}`}
              aria-label="View Profile"
              style={{
                background: `linear-gradient(135deg, ${roleColor}, #059669)`,
              }}
            >
              <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
            </button>
          </div>
        </header>

        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}
