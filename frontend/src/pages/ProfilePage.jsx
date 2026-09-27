import React, { useEffect, useState } from 'react';
import {
  User, Shield, Settings, Key, Save, Phone, MapPin, Building2,
  Sprout, CheckCircle2, AlertTriangle, Layers, Activity, Lock
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { profileApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import toast, { Toaster } from 'react-hot-toast';

const AVATAR_OPTIONS = ['👨‍🌾', '👩‍🌾', '🧑‍🔬', '🌱', '🌾', '🚜', '🛡️', '☀️'];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [stats, setStats]   = useState(null);
  const [tab, setTab]       = useState('profile');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('sugaryield_avatar') || '👨‍🌾');

  const [form, setForm]     = useState({ name: '', phone: '', location: '' });
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
    toast.success(`Profile picture avatar updated to ${av}`);
  };

  const saveProfile = async () => {
    if (!form.name.trim()) return toast.error('Name is required.');
    setSaving(true);
    try {
      const r = await profileApi.update(form);
      setUser(r.data?.user);
      toast.success('Profile details updated successfully!');
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
      toast.success('Password updated successfully!');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveAccountSettings = () => {
    localStorage.setItem('sugaryield_account_settings', JSON.stringify(settings));
    toast.success('Preferences saved!');
  };

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              <User size={13} /> Agronomist & User Account Administration
            </div>
            <h1 className="page-title" style={{ margin: '0 0 6px' }}>User Profile & Preferences</h1>
            <p className="page-subtitle" style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Manage credentials, telemetry parameters, avatar customization, and security protocols.
            </p>
          </div>
        </div>

        {/* Profile Hero Overview Card */}
        <div
          className="card"
          style={{
            padding: 24,
            borderRadius: 18,
            border: '1px solid var(--border-color)',
            background: 'var(--card-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
            marginBottom: 24
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: 'var(--primary-glow)',
                border: '2px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {avatar}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{user?.name}</h2>
                <Badge variant={user?.role === 'admin' ? 'critical' : user?.role === 'officer' ? 'primary' : 'success'}>
                  {user?.role === 'admin' ? 'Administrator' : user?.role === 'officer' ? 'Agri-Officer' : 'Sugarcane Grower'}
                </Badge>
              </div>
              <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: 13 }}>{user?.email}</p>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                📍 {form.location || 'Maharashtra Regional Basin'}
              </span>
            </div>
          </div>

          {stats && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total_farms}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Holdings</span>
              </div>
              <div style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total_fields}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Parcels</span>
              </div>
              <div style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{stats.total_area || 0} ha</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Cultivated</span>
              </div>
              <div style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total_predictions}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Inferences</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 24 }}>
          {[
            { id: 'profile',  label: 'Personal Dossier', icon: User },
            { id: 'avatar',   label: 'Profile Avatar', icon: Sprout },
            { id: 'settings', label: 'Application Preferences', icon: Settings },
            { id: 'security', label: 'Security & Password', icon: Lock },
          ].map(t => {
            const isSel = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 18px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSel ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: isSel ? 'var(--primary-glow)' : 'var(--card-bg)',
                  color: isSel ? 'var(--primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: PROFILE ─── */}
        {tab === 'profile' && (
          <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Personal & Contact Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, maxWidth: 720 }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Full Name *</label>
                <input
                  className="input-field"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Registered Email</label>
                <input
                  className="input-field"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Contact Phone</label>
                <input
                  className="input-field"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Agro-Climatic District</label>
                <input
                  className="input-field"
                  placeholder="e.g. Kolhapur, Maharashtra"
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                />
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={saveProfile}
              disabled={saving}
              style={{ marginTop: 20, padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={15} />
              <span>{saving ? 'Saving…' : 'Save Modifications'}</span>
            </button>
          </div>
        )}

        {/* ─── TAB 2: AVATAR ─── */}
        {tab === 'avatar' && (
          <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Select Profile Picture / Agricultural Avatar
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>
              Choose a representative agricultural insignia for your session.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 14, maxWidth: 640 }}>
              {AVATAR_OPTIONS.map(av => {
                const isSel = avatar === av;
                return (
                  <div
                    key={av}
                    onClick={() => handleSelectAvatar(av)}
                    style={{
                      background: isSel ? 'var(--primary-glow)' : 'var(--bg-secondary)',
                      border: isSel ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      borderRadius: 14,
                      padding: 18,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{av}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isSel ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {isSel ? '✓ Active' : 'Select'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── TAB 3: SETTINGS ─── */}
        {tab === 'settings' && (
          <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Application & Telemetry Preferences
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>
              Configure unit metrics, notification schedules, and default cultivars.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 620 }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>MEASUREMENT SYSTEM</label>
                <select
                  className="input-field"
                  value={settings.units}
                  onChange={e => setSettings(s => ({ ...s, units: e.target.value }))}
                >
                  <option value="metric">Metric (Tonnes / Hectare, Celsius °C, Millimeters mm)</option>
                  <option value="imperial">Imperial (Tons / Acre, Fahrenheit °F, Inches in)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>NOTIFICATION TIMING</label>
                <select
                  className="input-field"
                  value={settings.notifications}
                  onChange={e => setSettings(s => ({ ...s, notifications: e.target.value }))}
                >
                  <option value="immediate">Real-time alerts on critical risk detection</option>
                  <option value="daily">Daily morning summary digest</option>
                  <option value="weekly">Weekly review report only</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>DEFAULT SUGARCANE CULTIVAR</label>
                <select
                  className="input-field"
                  value={settings.defaultVariety}
                  onChange={e => setSettings(s => ({ ...s, defaultVariety: e.target.value }))}
                >
                  <option value="Co 86032">Co 86032 (Nayana) — Peninsular Benchmark</option>
                  <option value="Co 0238">Co 0238 (Karan 4) — Subtropical Biomass</option>
                  <option value="CoC 671">CoC 671 — High Sucrose Extraction</option>
                  <option value="Co 99004">Co 99004 (Damodar) — Dual Purpose</option>
                  <option value="CoM 0265">CoM 0265 (Phule 0265) — Heavy Tonnage</option>
                </select>
              </div>

              <button
                className="btn-primary"
                onClick={saveAccountSettings}
                style={{ marginTop: 8, padding: '10px 22px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Save size={15} />
                <span>Save Preferences</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB 4: SECURITY ─── */}
        {tab === 'security' && (
          <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Password & Credential Security
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 540 }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Current Password</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Enter current password"
                  value={pwForm.current_password}
                  onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>New Password</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="At least 10 characters"
                  value={pwForm.new_password}
                  onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Confirm New Password</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Re-enter new password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, borderRadius: 10, background: 'var(--bg-secondary)', fontSize: 12 }}>
                <span style={{ color: pwForm.new_password.length >= 10 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {pwForm.new_password.length >= 10 ? '✓' : '○'} At least 10 characters
                </span>
                <span style={{ color: pwForm.new_password === pwForm.confirm && pwForm.confirm ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {pwForm.new_password === pwForm.confirm && pwForm.confirm ? '✓' : '○'} Passwords match
                </span>
              </div>

              <button
                className="btn-primary"
                onClick={changePassword}
                disabled={saving}
                style={{ marginTop: 8, padding: '10px 22px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Key size={15} />
                <span>{saving ? 'Updating…' : 'Update Password'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
