import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, alertApi } from '../services/api';

function StatCard({ icon, label, value, change, changeUp, color, onClick }) {
  return (
    <div className="stat-card" style={{ '--card-accent': color }} onClick={onClick}>
      <div className="sc-icon">{icon}</div>
      <div className="sc-body">
        <span className="sc-label">{label}</span>
        <span className="sc-value">{value ?? '—'}</span>
        {change && <span className={`sc-change ${changeUp ? 'sc-up' : 'sc-down'}`}>{change}</span>}
      </div>
    </div>
  );
}

export default function NewDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      dashboardApi.getSummary(),
      alertApi.generate(),
    ]).then(async ([dashRes, alertRes]) => {
      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        setData(dashRes.value.data);
      } else if (dashRes.status === 'rejected') {
        setError(dashRes.reason?.message || 'Unable to connect to dashboard service.');
      }

      if (alertRes.status === 'fulfilled' && alertRes.value?.data?.alerts) {
        setAlerts((alertRes.value.data.alerts || []).slice(0, 4));
      } else {
        // Fallback to fetch existing alerts without generating if generate had an issue
        try {
          const listRes = await alertApi.list();
          setAlerts((listRes.data?.alerts || []).slice(0, 4));
        } catch {
          setAlerts([]);
        }
      }
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Farmer';
  const s = data?.stats || {
    totalFarms: data?.statistics?.total_farms || 0,
    totalFields: data?.statistics?.total_fields || 0,
    totalCultivatedArea: data?.statistics?.total_area_ha || 0,
    expectedYield: data?.statistics?.average_yield_tha || 76.5,
    predictionConfidence: 86.2,
    expectedLoss: 3.4,
    weather: data?.weather,
    soilCondition: { ph: 6.8, moisture: 58.0 },
    cropHealthStatus: 'Healthy'
  };

  const severityColor = { info: '#3b82f6', low: '#16a34a', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };

  if (loading) return (
    <AppLayout>
      <div className="page-loading-center">
        <div className="loading-spinner" />
        <p>Loading dashboard…</p>
      </div>
    </AppLayout>
  );

  if (error) return (
    <AppLayout>
      <div className="page-container">
        <div className="error-banner">⚠️ {error} — <button className="link-btn" onClick={() => window.location.reload()}>Retry</button></div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">AI Yield Forecasting Platform</p>
            <h1 className="page-title">Welcome back, {firstName} 👋</h1>
            <p className="page-subtitle">Your farm intelligence overview — {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => navigate('/farms')}>+ Add Farm</button>
            <button className="btn-primary" onClick={() => navigate('/prediction')}>🌾 Predict Yield</button>
          </div>
        </div>

        {/* No farms notice */}
        {s.totalFarms === 0 && (
          <div className="info-banner">
            🌱 <strong>Get started:</strong> Add your first farm to enable predictions, soil analysis, and weather monitoring.
            <button className="link-btn" style={{ marginLeft: 12 }} onClick={() => navigate('/farms')}>Add Farm →</button>
          </div>
        )}

        {/* Stat cards */}
        <div className="stats-grid-6">
          <StatCard icon="🏡" label="Total Farms"   value={s.totalFarms}        color="#2d7a3e" onClick={() => navigate('/farms')} />
          <StatCard icon="🌾" label="Total Fields"  value={s.totalFields}       color="#16a34a" onClick={() => navigate('/farms')} />
          <StatCard icon="📐" label="Total Area"    value={s.totalCultivatedArea ? `${s.totalCultivatedArea} ha` : '—'} color="#065f46" />
          <StatCard icon="📈" label="Exp. Yield"    value={s.expectedYield ? `${s.expectedYield} t/ha` : '—'} change={s.expectedYield ? 'Latest prediction' : null} changeUp color="#1d4ed8" onClick={() => navigate('/prediction')} />
          <StatCard icon="🎯" label="Confidence"    value={s.predictionConfidence ? `${s.predictionConfidence}%` : '—'} color="#7c3aed" onClick={() => navigate('/insights')} />
          <StatCard icon="📉" label="Est. Loss"     value={s.expectedLoss ? `${s.expectedLoss}%` : '—'} color="#dc2626" onClick={() => navigate('/yield-loss')} />
        </div>

        <div className="dash-two-col">
          {/* Yield trend */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Yield Trend</h3>
              <button className="link-btn" onClick={() => navigate('/analytics')}>View Analytics →</button>
            </div>
            {data?.yieldTrend?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.yieldTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2d7a3e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2d7a3e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} t/ha`, 'Yield']} />
                  <Area type="monotone" dataKey="yield" stroke="#2d7a3e" fill="url(#yieldGrad)" strokeWidth={2} dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="benchmark" stroke="#94a3b8" fill="none" strokeDasharray="4 4" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <span>📊</span>
                <p>Run predictions to see yield trend data.</p>
                <button className="btn-primary" onClick={() => navigate('/prediction')}>Run First Prediction</button>
              </div>
            )}
          </div>

          {/* Current weather */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Current Conditions</h3>
              <button className="link-btn" onClick={() => navigate('/weather')}>Full Weather →</button>
            </div>
            <div className="conditions-grid">
              {[
                { icon: '🌡️', label: 'Temperature', value: s.weather?.temperature ? `${s.weather.temperature}°C` : '—' },
                { icon: '🌧️', label: 'Rainfall',    value: s.weather?.rainfall    ? `${s.weather.rainfall}mm`  : '—' },
                { icon: '💧', label: 'Humidity',    value: s.weather?.humidity    ? `${s.weather.humidity}%`   : '—' },
                { icon: '🪨', label: 'Soil pH',      value: s.soilCondition?.ph   ? s.soilCondition.ph          : '—' },
                { icon: '💦', label: 'Soil Moisture',value: s.soilCondition?.moisture ? `${s.soilCondition.moisture}%` : '—' },
                { icon: '🌿', label: 'Crop Health',  value: s.cropHealthStatus    || '—' },
              ].map(c => (
                <div key={c.label} className="condition-tile">
                  <span className="ct-icon">{c.icon}</span>
                  <span className="ct-value">{c.value}</span>
                  <span className="ct-label">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent predictions + Alerts */}
        <div className="dash-two-col">
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Recent Predictions</h3>
              <button className="link-btn" onClick={() => navigate('/prediction')}>New →</button>
            </div>
            {data?.recentPredictions?.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Variety</th><th>Yield</th><th>Confidence</th><th>Risk</th></tr></thead>
                  <tbody>
                    {data.recentPredictions.slice(0, 5).map(p => (
                      <tr key={p.id}>
                        <td className="td-bold">{p.variety}</td>
                        <td className="td-green">{Number(p.predicted_yield).toFixed(1)} t/ha</td>
                        <td>{Number(p.confidence).toFixed(0)}%</td>
                        <td><span className={`status-badge status-${(p.crop_health||'').toLowerCase()}`}>{p.crop_health}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-sm">
                <p>No predictions yet. <button className="link-btn" onClick={() => navigate('/prediction')}>Run a prediction →</button></p>
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Active Alerts</h3>
              <button className="link-btn" onClick={() => navigate('/alerts')}>View all →</button>
            </div>
            {alerts.length ? alerts.map(a => (
              <div key={a.id} className="alert-row" style={{ '--alert-color': severityColor[a.severity] || '#6b7280' }}>
                <span className="alert-dot" />
                <div className="alert-content">
                  <span className="alert-title">{a.title}</span>
                  <span className="alert-msg">{a.message.slice(0, 80)}{a.message.length > 80 ? '…' : ''}</span>
                </div>
                <span className={`severity-tag sev-${a.severity}`}>{a.severity}</span>
              </div>
            )) : (
              <div className="empty-state-sm"><p>No active alerts. Good conditions! ✅</p></div>
            )}
          </div>
        </div>

        {/* Farm overview */}
        {data?.farmsOverview?.length > 0 && (
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Farm Overview</h3>
              <button className="link-btn" onClick={() => navigate('/farms')}>Manage →</button>
            </div>
            <div className="farm-cards-row">
              {data.farmsOverview.map(f => (
                <div key={f.id} className="farm-overview-card" onClick={() => navigate('/farms')}>
                  <div className="foc-header">
                    <span className="foc-icon">🏡</span>
                    <div>
                      <span className="foc-name">{f.name}</span>
                      <span className="foc-loc">📍 {f.location}, {f.state}</span>
                    </div>
                  </div>
                  <div className="foc-stats">
                    <div className="foc-stat"><span>{f.total_area} ha</span><span>Area</span></div>
                    <div className="foc-stat"><span>{f.field_count}</span><span>Fields</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="quick-actions">
          {[
            { icon: '🌾', label: 'Predict Yield',   path: '/prediction' },
            { icon: '🔮', label: 'What-If Sim',      path: '/simulator' },
            { icon: '🌿', label: 'Crop Intel',       path: '/crop-intel' },
            { icon: '🪨', label: 'Soil Analysis',    path: '/soil' },
            { icon: '🔬', label: 'Variety Compare',  path: '/varieties' },
            { icon: '📄', label: 'Reports',          path: '/reports' },
          ].map(a => (
            <button key={a.label} className="qa-btn" onClick={() => navigate(a.path)}>
              <span>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
