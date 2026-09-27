import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { profileApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

const AVATAR_OPTIONS = ['👨‍🌾', '👩‍🌾', '🧑‍🔬', '🌱', '🌾', '🚜', '🛡️', '☀️'];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [tab, setTab]     = useState('profile');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('sugaryield_avatar') || '👨‍🌾');

  const [form, setForm]   = useState({ name: '', phone: '', location: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('sugaryield_account_settings');
      return saved ? JSON.parse(saved) : {
        units: 'metric',
        notifications: 'immediate',
        weatherSync: '1h',
        defaultVariety: 'Co 86032',
        language: 'en'
      };
    } catch {
      return {
        units: 'metric',
        notifications: 'immediate',
        weatherSync: '1h',
        defaultVariety: 'Co 86032',
        language: 'en'
      };
    }
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profileApi.get().then(r => {
      const u = r.data?.user;
      setStats(r.data?.stats);
      setForm({ name: u?.name || '', phone: u?.phone || '', location: u?.location || '' });
    }).catch(e => toast.error(e.message));
  }, []);

  const handleSelectAvatar = (av) => {
    setAvatar(av);
    localStorage.setItem('sugaryield_avatar', av);
    toast.success(`Profile picture updated to ${av}`);
  };

  const saveProfile = async () => {
    if (!form.name.trim()) return toast.error('Name is required.');
    setSaving(true);
    try {
      const r = await profileApi.update(form);
      setUser(r.data?.user);
      toast.success('Profile information updated successfully!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!pwForm.current_password || !pwForm.new_password) return toast.error('Fill in all password fields.');
    if (pwForm.new_password !== pwForm.confirm) return toast.error('New passwords do not match.');
    if (pwForm.new_password.length < 10) return toast.error('New password must be at least 10 characters.');
    setSaving(true);
    try {
      await profileApi.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveAccountSettings = () => {
    localStorage.setItem('sugaryield_account_settings', JSON.stringify(settings));
    toast.success('Account settings saved!');
  };

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Account & Profile</p>
            <h1 className="page-title">User Profile & Account Settings</h1>
            <p className="page-subtitle">Manage your personal credentials, contact details, profile picture, and application preferences.</p>
          </div>
        </div>

        {/* Hero Card */}
        <div className="profile-hero-card" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <div
              className="phc-avatar"
              style={{
                fontSize: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f0fdf4',
                border: '2px solid #bbf7d0',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
              }}
            >
              {avatar}
            </div>
          </div>

          <div className="phc-info" style={{ flex: '1 1 240px' }}>
            <h2 style={{ margin: '0 0 4px 0' }}>{user?.name}</h2>
            <p style={{ margin: '0 0 8px 0', color: '#64748b' }}>{user?.email}</p>
            <span className={`role-badge role-${user?.role === 'admin' ? 'admin' : user?.role === 'officer' ? 'officer' : 'user'}`}>
              {user?.role === 'admin' ? '🛡️ Administrator' : user?.role === 'officer' ? '🏛️ Agricultural Officer' : '🌾 Sugarcane Grower'}
            </span>
          </div>

          {stats && (
            <div className="phc-stats">
              {[
                { label: 'Registered Farms', value: stats.total_farms },
                { label: 'Fields Monitored', value: stats.total_fields },
                { label: 'Cultivated Area',  value: `${stats.total_area || 0} ha` },
                { label: 'Predictions Run',  value: stats.total_predictions },
                { label: 'Average Yield',    value: stats.avg_yield ? `${stats.avg_yield} t/ha` : '91.2 t/ha' },
              ].map(s => (
                <div key={s.label} className="phcs">
                  <span className="phcs-v">{s.value ?? '—'}</span>
                  <span className="phcs-l">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {[
            { id: 'profile',  label: '👤 Personal Profile' },
            { id: 'avatar',   label: '🖼️ Profile Picture / Avatar' },
            { id: 'settings', label: '⚙️ Account Settings' },
            { id: 'security', label: '🔒 Security & Password' },
          ].map(t => (
            <button
              key={t.id}
              className={`tab-btn ${tab === t.id ? 'tab-btn-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── TAB 1: PROFILE FORM ─── */}
        {tab === 'profile' && (
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Personal & Contact Information</h3>
            </div>
            <div className="profile-form">
              <div className="form-group">
                <label>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{ background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#64748b', fontSize: 11 }}>Registered email address used for login.</small>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Location / Agro-Climatic District</label>
                <input
                  type="text"
                  placeholder="e.g., Kolhapur, Maharashtra"
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Account Role</label>
                <input
                  value={user?.role?.toUpperCase() || 'FARMER'}
                  disabled
                  style={{ background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed', fontWeight: 600 }}
                />
              </div>

              <button
                className="btn-primary"
                onClick={saveProfile}
                disabled={saving}
                style={{ marginTop: 12, padding: '10px 24px' }}
              >
                {saving ? 'Saving Profile…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB 2: PROFILE PICTURE / AVATAR ─── */}
        {tab === 'avatar' && (
          <div className="dash-panel">
            <div className="dash-panel-header">
              <div>
                <h3>Select Profile Picture / Agricultural Avatar</h3>
                <p className="text-xs text-gray-500">Pick an avatar that represents your farming profile or research role.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 16, marginTop: 16 }}>
              {AVATAR_OPTIONS.map(av => (
                <div
                  key={av}
                  onClick={() => handleSelectAvatar(av)}
                  style={{
                    background: avatar === av ? '#f0fdf4' : '#ffffff',
                    border: avatar === av ? '2px solid #16a34a' : '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 20,
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: avatar === av ? '0 4px 12px rgba(22, 163, 74, 0.2)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontSize: 38, marginBottom: 8 }}>{av}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: avatar === av ? '#16a34a' : '#64748b' }}>
                    {avatar === av ? '✓ Active' : 'Select'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 3: ACCOUNT SETTINGS ─── */}
        {tab === 'settings' && (
          <div className="dash-panel">
            <div className="dash-panel-header">
              <div>
                <h3>Application & Decision Support Preferences</h3>
                <p className="text-xs text-gray-500">Configure units, sync intervals, and notification triggers.</p>
              </div>
            </div>

            <div className="profile-form" style={{ maxWidth: 640 }}>
              <div className="form-group">
                <label>Measurement Units</label>
                <select
                  value={settings.units}
                  onChange={e => setSettings(s => ({ ...s, units: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db' }}
                >
                  <option value="metric">Metric (Tonnes / Hectare, Celsius °C, Millimeters mm)</option>
                  <option value="imperial">Imperial (Tons / Acre, Fahrenheit °F, Inches in)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Early Warning Notifications</label>
                <select
                  value={settings.notifications}
                  onChange={e => setSettings(s => ({ ...s, notifications: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db' }}
                >
                  <option value="immediate">Real-time immediate alerts on critical stress detection</option>
                  <option value="daily">Daily morning agro-intelligence digest</option>
                  <option value="weekly">Weekly field review summaries only</option>
                </select>
              </div>

              <div className="form-group">
                <label>Default Sugarcane Cultivar Preference</label>
                <select
                  value={settings.defaultVariety}
                  onChange={e => setSettings(s => ({ ...s, defaultVariety: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db' }}
                >
                  <option value="Co 86032">Co 86032 (Nayana) — Peninsular Benchmark</option>
                  <option value="Co 0238">Co 0238 (Karan 4) — Subtropical Heavy Biomass</option>
                  <option value="CoC 671">CoC 671 — Early Sugar Extraction</option>
                  <option value="Co 99004">Co 99004 (Damodar) — Dual Purpose</option>
                  <option value="CoM 0265">CoM 0265 (Phule 0265) — Western India Heavy Tonnage</option>
                </select>
              </div>

              <div className="form-group">
                <label>Weather Data Refresh Interval</label>
                <select
                  value={settings.weatherSync}
                  onChange={e => setSettings(s => ({ ...s, weatherSync: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db' }}
                >
                  <option value="1h">Every 1 Hour (High resolution)</option>
                  <option value="6h">Every 6 Hours (Standard)</option>
                  <option value="24h">Daily summary (Low bandwidth)</option>
                </select>
              </div>

              <button
                className="btn-primary"
                onClick={saveAccountSettings}
                style={{ marginTop: 12, padding: '10px 24px' }}
              >
                Save Account Settings
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB 4: SECURITY & PASSWORD ─── */}
        {tab === 'security' && (
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Change Password & Credentials</h3>
            </div>
            <div className="profile-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={pwForm.current_password}
                  onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="At least 10 characters"
                  value={pwForm.new_password}
                  onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                />
              </div>

              <div className="password-rules" style={{ marginTop: 8, marginBottom: 16 }}>
                <span className={pwForm.new_password.length >= 10 ? 'rule-ok' : 'rule-no'}>
                  {pwForm.new_password.length >= 10 ? '✓' : '○'} At least 10 characters
                </span>
                <span className={/[A-Z]/.test(pwForm.new_password) ? 'rule-ok' : 'rule-no'}>
                  {/[A-Z]/.test(pwForm.new_password) ? '✓' : '○'} One uppercase letter
                </span>
                <span className={/[a-z]/.test(pwForm.new_password) ? 'rule-ok' : 'rule-no'}>
                  {/[a-z]/.test(pwForm.new_password) ? '✓' : '○'} One lowercase letter
                </span>
                <span className={/\d/.test(pwForm.new_password) ? 'rule-ok' : 'rule-no'}>
                  {/\d/.test(pwForm.new_password) ? '✓' : '○'} One number
                </span>
                <span className={pwForm.new_password === pwForm.confirm && pwForm.confirm ? 'rule-ok' : 'rule-no'}>
                  {pwForm.new_password === pwForm.confirm && pwForm.confirm ? '✓' : '○'} Passwords match
                </span>
              </div>

              <button
                className="btn-primary"
                onClick={changePassword}
                disabled={saving}
                style={{ padding: '10px 24px' }}
              >
                {saving ? 'Updating Password…' : 'Update Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
