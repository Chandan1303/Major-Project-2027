import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { profileApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [tab, setTab]     = useState('profile');
  const [form, setForm]   = useState({ name:'', phone:'', location:'' });
  const [pwForm, setPwForm] = useState({ current_password:'', new_password:'', confirm:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profileApi.get().then(r => {
      const u = r.data?.user;
      setStats(r.data?.stats);
      setForm({ name: u?.name||'', phone: u?.phone||'', location: u?.location||'' });
    }).catch(e => toast.error(e.message));
  }, []);

  const saveProfile = async () => {
    if (!form.name.trim()) return toast.error('Name is required.');
    setSaving(true);
    try {
      const r = await profileApi.update(form);
      setUser(r.data?.user);
      toast.success('Profile updated!');
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!pwForm.current_password || !pwForm.new_password) return toast.error('Fill in all password fields.');
    if (pwForm.new_password !== pwForm.confirm) return toast.error('New passwords do not match.');
    if (pwForm.new_password.length < 10) return toast.error('New password must be at least 10 characters.');
    setSaving(true);
    try {
      await profileApi.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed successfully!');
      setPwForm({ current_password:'', new_password:'', confirm:'' });
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Account</p>
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">Manage your account details, preferences, and security settings.</p>
          </div>
        </div>

        {/* Avatar + quick stats */}
        <div className="profile-hero-card">
          <div className="phc-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="phc-info">
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
            <span className={`role-badge role-${user?.role || 'user'}`}>{user?.role || 'user'}</span>
          </div>
          {stats && (
            <div className="phc-stats">
              {[
                { label:'Farms',        value: stats.total_farms },
                { label:'Fields',       value: stats.total_fields },
                { label:'Area (ha)',    value: stats.total_area },
                { label:'Predictions',  value: stats.total_predictions },
                { label:'Avg Yield',    value: stats.avg_yield ? `${stats.avg_yield} t/ha` : '—' },
              ].map(s => (
                <div key={s.label} className="phcs"><span className="phcs-v">{s.value ?? '—'}</span><span className="phcs-l">{s.label}</span></div>
              ))}
            </div>
          )}
        </div>

        <div className="tab-bar">
          {[{id:'profile',label:'Profile'},{id:'security',label:'Security'}].map(t => (
            <button key={t.id} className={`tab-btn ${tab===t.id?'tab-btn-active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="dash-panel">
            <div className="dash-panel-header"><h3>Personal Information</h3></div>
            <div className="profile-form">
              {[
                { key:'name',     label:'Full Name',    type:'text',  ph:'Your full name',    required: true },
                { key:'phone',    label:'Phone Number', type:'tel',   ph:'+91 98765 43210' },
                { key:'location', label:'Location',     type:'text',  ph:'e.g., Kolhapur, Maharashtra' },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label>{f.label}{f.required && <span style={{color:'#ef4444'}}> *</span>}</label>
                  <input type={f.type} placeholder={f.ph} value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} />
                </div>
              ))}
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={user?.email || ''} disabled style={{ background:'#f9fafb', color:'#9ca3af' }} />
                <small>Email cannot be changed here.</small>
              </div>
              <div className="form-group">
                <label>Account Type</label>
                <input value={user?.role || 'user'} disabled style={{ background:'#f9fafb', color:'#9ca3af', textTransform:'capitalize' }} />
              </div>
              <div className="form-group">
                <label>Member Since</label>
                <input value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle:'long' }) : '—'} disabled style={{ background:'#f9fafb', color:'#9ca3af' }} />
              </div>
              <button className="btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="dash-panel">
            <div className="dash-panel-header"><h3>Change Password</h3></div>
            <div className="profile-form">
              {[
                { key:'current_password', label:'Current Password', type:'password', ph:'Your current password' },
                { key:'new_password',     label:'New Password',     type:'password', ph:'At least 10 characters' },
                { key:'confirm',          label:'Confirm Password', type:'password', ph:'Repeat new password' },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label>{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={pwForm[f.key]} onChange={e => setPwForm(p => ({...p, [f.key]: e.target.value}))} />
                </div>
              ))}
              <div className="password-rules">
                <span className={pwForm.new_password.length >= 10 ? 'rule-ok' : 'rule-no'}>✓ At least 10 characters</span>
                <span className={/[A-Z]/.test(pwForm.new_password) ? 'rule-ok' : 'rule-no'}>✓ One uppercase letter</span>
                <span className={/[a-z]/.test(pwForm.new_password) ? 'rule-ok' : 'rule-no'}>✓ One lowercase letter</span>
                <span className={/\d/.test(pwForm.new_password) ? 'rule-ok' : 'rule-no'}>✓ One number</span>
                <span className={pwForm.new_password === pwForm.confirm && pwForm.confirm ? 'rule-ok' : 'rule-no'}>✓ Passwords match</span>
              </div>
              <button className="btn-primary" onClick={changePassword} disabled={saving}>{saving ? 'Changing…' : 'Change Password'}</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
