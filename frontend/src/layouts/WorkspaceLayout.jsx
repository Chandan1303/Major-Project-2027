import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import { useAuth } from '../context/AuthContext';

const Glyph = ({ name }) => {
  const paths = {
    overview: <><rect x="3.5" y="3.5" width="7" height="7" rx="1" /><rect x="13.5" y="3.5" width="7" height="7" rx="1" /><rect x="3.5" y="13.5" width="7" height="7" rx="1" /><rect x="13.5" y="13.5" width="7" height="7" rx="1" /></>,
    forecast: <><path d="M12 20v-8" /><path d="M12 14c-5 0-8-2.6-8-7 5 0 8 2.6 8 7Z" /><path d="M12 11c0-4.3 2.6-7 7-7 0 4.4-2.7 7-7 7Z" /></>,
    exit: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
};

export default function WorkspaceLayout({ active, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar" aria-label="Workspace navigation">
        <div className="workspace-brand"><Brand /></div>
        <div className="workspace-nav-label">WORKSPACE</div>
        <nav className="workspace-nav">
          <NavLink to="/dashboard" className={active === 'dashboard' ? 'workspace-link active' : 'workspace-link'}>
            <Glyph name="overview" />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/prediction" className={active === 'prediction' ? 'workspace-link active' : 'workspace-link'}>
            <Glyph name="forecast" />
            <span>Yield forecast</span>
          </NavLink>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-account">
          <div className="account-avatar" aria-hidden="true">{initials}</div>
          <div className="account-copy">
            <span className="account-name">{user?.name || 'Account'}</span>
            <span className="account-caption">SugarYield workspace</span>
          </div>
          <button type="button" className="icon-button signout-icon" onClick={signout} aria-label="Sign out" title="Sign out">
            <Glyph name="exit" />
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="breadcrumb"><span>Workspace</span><i>/</i><strong>{active === 'prediction' ? 'Yield forecast' : 'Overview'}</strong></div>
          <div className="topbar-status"><span className="status-dot" /> Session active</div>
        </header>
        {children}
      </div>
    </div>
  );
}