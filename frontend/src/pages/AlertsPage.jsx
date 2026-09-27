import React, { useEffect, useState } from 'react';
import {
  Bell, AlertTriangle, CheckCircle2, ShieldAlert, Info, CloudRain,
  Bug, Droplets, TrendingDown, RefreshCw, CheckCheck, Filter, Clock
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { alertApi } from '../services/api';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import toast, { Toaster } from 'react-hot-toast';

const SEV_MAP = {
  info:     { color: '#3b82f6', badge: 'info',     icon: Info },
  low:      { color: '#10b981', badge: 'success',  icon: CheckCircle2 },
  medium:   { color: '#f59e0b', badge: 'warning',  icon: AlertTriangle },
  high:     { color: '#ef4444', badge: 'critical', icon: AlertTriangle },
  critical: { color: '#dc2626', badge: 'critical', icon: ShieldAlert }
};

const TYPE_ICONS = {
  weather:    CloudRain,
  soil:       Droplets,
  yield:      TrendingDown,
  pest:       Bug,
  irrigation: Droplets,
  general:    Bell
};

export default function AlertsPage() {
  const [alerts, setAlerts]         = useState([]);
  const [unread, setUnread]         = useState(0);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter]         = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const r = await alertApi.list();
      setAlerts(r.data?.alerts || []);
      setUnread(r.data?.unread_count || 0);
    } catch (e) {
      toast.error(e.message || 'Failed to fetch telemetry alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await alertApi.generate();
      setAlerts(r.data?.alerts || []);
      setUnread(r.data?.unread_count || 0);
      toast.success(`${r.data?.generated || 0} diagnostic alerts generated.`);
    } catch (e) {
      toast.error(e.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const markRead = async (id) => {
    try {
      await alertApi.markRead(id);
      setAlerts(a => a.map(x => x.id === id ? { ...x, is_read: true } : x));
      setUnread(u => Math.max(0, u - 1));
      toast.success('Marked as read');
    } catch (e) {
      toast.error(e.message || 'Update failed');
    }
  };

  const markAll = async () => {
    try {
      await alertApi.markAllRead();
      setAlerts(a => a.map(x => ({ ...x, is_read: true })));
      setUnread(0);
      toast.success('All alerts acknowledged.');
    } catch (e) {
      toast.error(e.message || 'Bulk update failed');
    }
  };

  const filtered = alerts.filter(a => filter === 'all' || (filter === 'unread' ? !a.is_read : a.severity === filter));
  const highCriticalCount = alerts.filter(a => ['high', 'critical'].includes(a.severity)).length;
  const mediumCount       = alerts.filter(a => a.severity === 'medium').length;

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading-center">
          <div className="loading-spinner" />
          <p>Auditing active telemetry anomalies & alert thresholds…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              <ShieldAlert size={13} /> Automated Real-Time Risk Diagnostics
            </div>
            <h1 className="page-title" style={{ margin: '0 0 6px' }}>Early Warning & Anomaly Alerts</h1>
            <p className="page-subtitle" style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Deterministic threshold checks across meteorological stresses, edaphic moisture deficits, pest phenology, and yield volatility.
            </p>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: 10 }}>
            {unread > 0 && (
              <button className="btn-outline" onClick={markAll} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCheck size={16} /> Mark All Acknowledged
              </button>
            )}
            <button className="btn-primary" onClick={generate} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Auditing Telemetry…' : 'Scan & Generate Alerts'}
            </button>
          </div>
        </div>

        {/* Aggregated KPI Cards */}
        <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 24 }}>
          <StatCard
            label="Total Logged Alerts"
            value={alerts.length}
            unit="events"
            icon={Bell}
            color="emerald"
            subtitle="Historical & current signals"
          />
          <StatCard
            label="Pending Action (Unread)"
            value={unread}
            unit="signals"
            icon={Clock}
            color="blue"
            trend={unread > 0 ? `${unread} require review` : 'All clear'}
            subtitle="Unacknowledged notifications"
          />
          <StatCard
            label="High & Critical Hazards"
            value={highCriticalCount}
            unit="alerts"
            icon={ShieldAlert}
            color="red"
            trend={highCriticalCount > 0 ? 'Urgent attention' : 'Optimal status'}
            subtitle="Immediate agronomic threat"
          />
          <StatCard
            label="Medium Advisory Warnings"
            value={mediumCount}
            unit="advisories"
            icon={AlertTriangle}
            color="amber"
            subtitle="Preventive management events"
          />
        </div>

        {/* Filter Tabs Ribbon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginRight: 6 }}>
            <Filter size={14} /> FILTER:
          </span>
          {['all', 'unread', 'critical', 'high', 'medium', 'low', 'info'].map(f => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: isActive ? 'var(--primary-glow)' : 'var(--card-bg)',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{f.charAt(0).toUpperCase() + f.slice(1)}</span>
                {f === 'unread' && unread > 0 && (
                  <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 20, background: '#ef4444', color: '#fff' }}>
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Alert List Container */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={filter === 'all' ? 'All Systems Functioning Within Normal Parameters' : `No ${filter} Alerts Found`}
            description={filter === 'all' ? 'Trigger "Scan & Generate Alerts" to evaluate real-time weather and edaphic boundaries.' : 'Change filter selection above to inspect other severity tiers.'}
            actionText="Audit Telemetry"
            onAction={generate}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(a => {
              const sev = SEV_MAP[a.severity] || SEV_MAP.info;
              const TypeIcon = TYPE_ICONS[a.type] || Bell;
              const SevIcon = sev.icon;

              return (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: 18,
                    borderRadius: 14,
                    background: a.is_read ? 'var(--card-bg)' : 'var(--bg-secondary)',
                    border: `1px solid ${a.is_read ? 'var(--border-color)' : sev.color + '44'}`,
                    borderLeft: `4px solid ${sev.color}`,
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Left Icon Badge */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: `${sev.color}15`,
                      color: sev.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <TypeIcon size={20} />
                  </div>

                  {/* Body Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {a.title}
                        </h4>
                        {!a.is_read && (
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#ef4444', color: '#fff', textTransform: 'uppercase' }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        {new Date(a.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {a.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Badge variant={sev.badge}>
                        <SevIcon size={12} style={{ marginRight: 4 }} />
                        {a.severity.toUpperCase()}
                      </Badge>

                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        Category: {a.type}
                      </span>

                      {a.is_demo && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                          Synthetic Benchmark
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mark as Read CTA */}
                  {!a.is_read && (
                    <button
                      onClick={() => markRead(a.id)}
                      title="Acknowledge alert"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexShrink: 0
                      }}
                    >
                      <CheckCircle2 size={14} color="var(--primary)" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
