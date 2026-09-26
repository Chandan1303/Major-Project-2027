import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { alertApi } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const SEV_COLORS = { info:'#3b82f6', low:'#16a34a', medium:'#f59e0b', high:'#ef4444', critical:'#dc2626' };
const SEV_ICONS  = { info:'ℹ️', low:'✅', medium:'⚠️', high:'🔴', critical:'🚨' };
const TYPE_ICONS = { weather:'☁️', soil:'🪨', yield:'📉', pest:'🐛', irrigation:'💧', general:'📢' };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const r = await alertApi.list();
      setAlerts(r.data?.alerts || []);
      setUnread(r.data?.unread_count || 0);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await alertApi.generate();
      setAlerts(r.data?.alerts || []);
      setUnread(r.data?.unread_count || 0);
      toast.success(`${r.data?.generated || 0} alerts generated.`);
    } catch (e) { toast.error(e.message); }
    finally { setGenerating(false); }
  };

  const markRead = async (id) => {
    try {
      await alertApi.markRead(id);
      setAlerts(a => a.map(x => x.id === id ? { ...x, is_read: true } : x));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const markAll = async () => {
    try {
      await alertApi.markAllRead();
      setAlerts(a => a.map(x => ({ ...x, is_read: true })));
      setUnread(0);
      toast.success('All marked as read.');
    } catch (e) { toast.error(e.message); }
  };

  const filtered = alerts.filter(a => filter === 'all' || (filter === 'unread' ? !a.is_read : a.severity === filter));

  if (loading) return <AppLayout><div className="page-loading-center"><div className="loading-spinner" /><p>Loading alerts…</p></div></AppLayout>;

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Early Warning System</p>
            <h1 className="page-title">Alerts & Notifications</h1>
            <p className="page-subtitle">Automated alerts based on your farm conditions, soil data, weather, and predictions.</p>
          </div>
          <div className="header-actions">
            {unread > 0 && <button className="btn-outline" onClick={markAll}>Mark All Read</button>}
            <button className="btn-primary" onClick={generate} disabled={generating}>
              {generating ? '🔄 Generating…' : '🔔 Generate Alerts'}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="stats-grid-4">
          {[
            { label:'Total',    value: alerts.length,                                  color:'#6b7280', icon:'📋' },
            { label:'Unread',   value: unread,                                         color:'#3b82f6', icon:'🔵' },
            { label:'High/Critical', value: alerts.filter(a=>['high','critical'].includes(a.severity)).length, color:'#ef4444', icon:'🔴' },
            { label:'Warnings', value: alerts.filter(a=>a.severity==='medium').length, color:'#f59e0b', icon:'⚠️' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ '--card-accent': s.color }}>
              <div className="sc-icon">{s.icon}</div>
              <div className="sc-body"><span className="sc-label">{s.label}</span><span className="sc-value">{s.value}</span></div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="tab-bar">
          {['all','unread','info','low','medium','high','critical'].map(f => (
            <button key={f} className={`tab-btn ${filter===f?'tab-btn-active':''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
              {f==='unread' && unread > 0 && <span style={{marginLeft:6,background:'#ef4444',color:'white',borderRadius:10,padding:'1px 6px',fontSize:10}}>{unread}</span>}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-page-state">
            <div className="eps-icon">🔔</div>
            <h2>{filter === 'all' ? 'No Alerts' : `No ${filter} alerts`}</h2>
            <p>{filter === 'all' ? 'Click "Generate Alerts" to check your farm conditions.' : 'Try a different filter.'}</p>
          </div>
        ) : (
          <div className="alerts-list">
            {filtered.map(a => (
              <div key={a.id} className={`alert-card ${!a.is_read ? 'alert-unread' : ''}`} style={{ '--alert-color': SEV_COLORS[a.severity] || '#6b7280' }}>
                <div className="ac-icon">{SEV_ICONS[a.severity]} {TYPE_ICONS[a.type] || '📢'}</div>
                <div className="ac-body">
                  <div className="ac-header-row">
                    <span className="ac-title">{a.title}</span>
                    <span className="ac-time">{new Date(a.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                  </div>
                  <p className="ac-msg">{a.message}</p>
                  <div className="ac-tags">
                    <span className="severity-tag" style={{ background:`${SEV_COLORS[a.severity]}18`, color:SEV_COLORS[a.severity] }}>{a.severity}</span>
                    <span className="type-tag">{a.type}</span>
                    {a.is_demo && <span className="demo-tag">Demo</span>}
                  </div>
                </div>
                {!a.is_read && (
                  <button className="ac-read-btn" onClick={() => markRead(a.id)} title="Mark as read">✓</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
