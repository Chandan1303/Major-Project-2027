import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  MapPin,
  Map,
  Sparkles,
  Brain,
  Sliders,
  Sprout,
  Cpu,
  Globe,
  CloudSun,
  Layers,
  Dna,
  TrendingDown,
  LineChart,
  FileText,
  MessageSquare,
  Bell,
  User,
  Info,
  Shield,
  Landmark,
  AlertTriangle,
  Users,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  X,
  Leaf
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useField } from '../context/FieldContext';
import { useTheme } from '../context/ThemeContext';
import Brand from './Brand';
import { alertApi } from '../services/api';

// Navigation for Standard Farmers / Users
const USER_NAV = [
  { group: 'Main', items: [
    { label: 'Dashboard',        path: '/dashboard',   icon: LayoutDashboard },
  ]},
  { group: 'Farm Management', items: [
    { label: 'My Farm & Fields', path: '/farms',       icon: MapPin },
  ]},
  { group: 'AI & Intelligence', items: [
    { label: 'AI Yield Predict', path: '/prediction',  icon: Sparkles, highlight: true },
    { label: 'Explainable AI',   path: '/insights',    icon: Brain },
    { label: 'Crop Intelligence',path: '/crop-intel',  icon: Sprout },
    { label: 'Crop Health NDVI', path: '/crop-health', icon: Leaf },
  ]},
  { group: 'Environment', items: [
    { label: 'Weather Forecast', path: '/weather',     icon: CloudSun },
    { label: 'Soil Analysis',    path: '/soil',        icon: Layers },
  ]},
  { group: 'Analytics & Risk', items: [
    { label: 'Variety Intel',    path: '/varieties',   icon: Dna },
    { label: 'Loss & Risk',      path: '/yield-loss',  icon: TrendingDown },
    { label: 'Yield Analytics',  path: '/analytics',   icon: LineChart },
  ]},
  { group: 'Account', items: [
    { label: 'Profile Settings', path: '/profile',     icon: User },
    { label: 'System About',     path: '/about',       icon: Info },
  ]},
];

// Navigation for Agricultural Extension Officers
const OFFICER_NAV = [
  { group: 'Extension Oversight', items: [
    { label: 'Officer Dashboard', path: '/officer',                    icon: Landmark },
    { label: 'High-Risk Fields',  path: '/officer?tab=high_risk',      icon: AlertTriangle },
    { label: 'Regional Farms',    path: '/farms',                      icon: MapPin },
  ]},
  { group: 'Agronomic Analytics', items: [
    { label: 'Yield Predictions', path: '/prediction',                 icon: Sparkles },
    { label: 'Loss & Risk Audit', path: '/yield-loss',                 icon: TrendingDown },
    { label: 'Variety Intel',     path: '/varieties',                  icon: Dna },
    { label: 'Territory Trends',  path: '/analytics',                  icon: LineChart },
  ]},
  { group: 'Account', items: [
    { label: 'Officer Profile',   path: '/profile',                    icon: User },
    { label: 'System Info',       path: '/about',                      icon: Info },
  ]},
];

// Navigation for Administrators
const ADMIN_NAV = [
  { group: 'Administration', items: [
    { label: 'Admin Dashboard',   path: '/dashboard',                   icon: LayoutDashboard, tab: 'overview' },
    { label: 'User Management',   path: '/dashboard?tab=users',         icon: Users, tab: 'users' },
    { label: 'ML Benchmarks',     path: '/dashboard?tab=ml',            icon: Cpu, tab: 'ml' },
    { label: 'Varieties Registry',path: '/dashboard?tab=varieties',     icon: Dna, tab: 'varieties' },
    { label: 'Predictions Audit', path: '/dashboard?tab=predictions',   icon: Activity, tab: 'predictions' },
    { label: 'System Alerts',     path: '/dashboard?tab=alerts',        icon: Bell, tab: 'alerts' },
  ]},
  { group: 'Account', items: [
    { label: 'Admin Profile',     path: '/profile',                     icon: User },
    { label: 'System Info',       path: '/about',                       icon: Info },
  ]},
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { allFields, selectedFieldId, selectField } = useField();
  const { theme, toggleTheme, isDark } = useTheme();
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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
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

  const roleColor = isAdmin ? '#8b5cf6' : isOfficer ? '#0284c7' : '#10b981';
  const roleBadgeBg = isAdmin ? 'rgba(139, 92, 246, 0.12)' : isOfficer ? 'rgba(2, 132, 199, 0.12)' : 'rgba(16, 185, 129, 0.12)';
  const roleBadgeBorder = isAdmin ? 'rgba(139, 92, 246, 0.25)' : isOfficer ? 'rgba(2, 132, 199, 0.25)' : 'rgba(16, 185, 129, 0.25)';
  const roleTitle = isAdmin ? 'Administrator' : isOfficer ? 'Extension Officer' : 'Sugarcane Grower';
  const RoleIcon = isAdmin ? Shield : isOfficer ? Landmark : Sprout;

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${isAdmin ? 'admin-shell' : ''}`}>
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
                    {item.path === '/alerts' && unread > 0 && (
                      <span className="nav-badge animate-pulse">{unread}</span>
                    )}
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
                {user?.name?.[0]?.toUpperCase() || (isAdmin ? 'A' : isOfficer ? 'O' : 'U')}
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
            {!isAdmin && allFields.length > 0 && (
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
                  {allFields.map(fld => (
                    <option key={fld.id} value={fld.id}>
                      {fld.farm_name} › {fld.name} ({fld.sugarcane_variety || 'Co 86032'})
                    </option>
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

            {isAdmin && (
              <span className="status-badge admin-badge">
                <span className="pulsing-dot purple" /> Admin Console
              </span>
            )}
            {isOfficer && (
              <span className="status-badge officer-badge">
                <span className="pulsing-dot blue" /> Extension Officer
              </span>
            )}

            {/* Alerts Center Button */}
            <button
              className="topbar-icon-btn topbar-alert-btn"
              onClick={() => navigate(isAdmin ? '/dashboard?tab=alerts' : '/alerts')}
              title="Alerts Center"
              aria-label="Alerts Center"
            >
              <Bell size={18} />
              {unread > 0 && <span className="topbar-badge">{unread}</span>}
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
              <span>{user?.name?.[0]?.toUpperCase() || (isAdmin ? 'A' : isOfficer ? 'O' : 'U')}</span>
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
