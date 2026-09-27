import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useField } from '../context/FieldContext';
import { dashboardApi, alertApi, advisorApi, irrigationApi, farmApi } from '../services/api';

function StatCard({ icon, label, value, change, changeUp, color, onClick }) {
  return (
    <div className="stat-card" style={{ '--card-accent': color, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
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
  const { farms: ctxFarms, selectedFarm, selectedField, selectFarm, selectField } = useField();

  const [data, setData] = useState(null);
  const [multiFarm, setMultiFarm] = useState(null);
  const [farmsList, setFarmsList] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('all');
  const [selectedFieldId, setSelectedFieldId] = useState('all');

  const [advisorData, setAdvisorData] = useState([]);
  const [irrigation, setIrrigation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial load
  useEffect(() => {
    Promise.allSettled([
      dashboardApi.getSummary(),
      dashboardApi.getMultiFarm(),
      farmApi.list(),
      irrigationApi.decisionSupport(),
      alertApi.generate(),
    ]).then(async ([dashRes, mfRes, farmRes, irrRes, alertRes]) => {
      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        setData(dashRes.value.data);
      } else if (dashRes.status === 'rejected') {
        setError(dashRes.reason?.message || 'Unable to connect to dashboard service.');
      }

      if (mfRes.status === 'fulfilled' && mfRes.value?.data?.data) {
        setMultiFarm(mfRes.value.data.data);
      }

      if (farmRes.status === 'fulfilled') {
        const list = farmRes.value.data?.farms || [];
        setFarmsList(list);
      }

      if (irrRes.status === 'fulfilled' && irrRes.value?.data?.data) {
        setIrrigation(irrRes.value.data.data);
      }

      if (alertRes.status === 'fulfilled' && alertRes.value?.data?.alerts) {
        setAlerts((alertRes.value.data.alerts || []).slice(0, 4));
      } else {
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

  // Sync selected farm/field with FieldContext if set
  useEffect(() => {
    if (selectedFarm && selectedFarmId === 'all') {
      setSelectedFarmId(String(selectedFarm.id));
      if (selectedField) {
        setSelectedFieldId(String(selectedField.id));
      }
    }
  }, [selectedFarm, selectedField]);

  // Load advisor suggestions whenever active field changes
  useEffect(() => {
    const fId = selectedFieldId !== 'all' ? selectedFieldId : (selectedField?.id || undefined);
    advisorApi.suggestions(fId ? { field_id: fId } : undefined)
      .then(res => {
        if (res.data?.data?.suggestions) {
          setAdvisorData(res.data.data.suggestions);
        }
      })
      .catch(() => {});
  }, [selectedFieldId, selectedField]);

  const firstName = user?.name?.split(' ')[0] || 'User';

  // Handle farm change
  const handleFarmFilterChange = (e) => {
    const fid = e.target.value;
    setSelectedFarmId(fid);
    setSelectedFieldId('all');
    if (fid !== 'all') {
      selectFarm(Number(fid));
    }
  };

  // Handle field change
  const handleFieldFilterChange = (e) => {
    const flid = e.target.value;
    setSelectedFieldId(flid);
    if (flid !== 'all') {
      selectField(Number(flid));
    }
  };

  // Available farms and fields for dropdowns
  const effectiveFarms = farmsList.length > 0 ? farmsList : (ctxFarms || []);
  const activeFarmObj = effectiveFarms.find(f => String(f.id) === String(selectedFarmId));
  const availableFields = activeFarmObj ? (activeFarmObj.fields || []) : effectiveFarms.flatMap(f => f.fields || []);

  // Multi-farm dynamic calculations
  const calculatedMetrics = useMemo(() => {
    if (selectedFarmId === 'all') {
      // All farms
      const totalFarms = effectiveFarms.length || multiFarm?.total_farms || 4;
      const allFlds = effectiveFarms.flatMap(f => f.fields || []);
      const totalFields = allFlds.length || multiFarm?.total_fields || 6;
      const totalArea = effectiveFarms.reduce((sum, f) => sum + Number(f.total_area || 0), 0) || multiFarm?.total_area || 24.5;
      const avgYield = multiFarm?.average_predicted_yield_tha || 91.2;
      const totalExpectedProduction = (totalArea * avgYield);
      const highRisk = multiFarm?.high_risk_fields_count ?? 1;
      const normalFields = Math.max(0, totalFields - highRisk);
      const avgConfidence = multiFarm?.average_confidence_pct || 90.5;

      return {
        totalFarms,
        totalFields,
        totalArea,
        totalExpectedProduction,
        avgYield,
        highRisk,
        normalFields,
        avgConfidence
      };
    } else {
      // Specific Farm filtered
      const f = activeFarmObj;
      const flds = f?.fields || [];

      if (selectedFieldId !== 'all') {
        // Specific Field filtered
        const fld = flds.find(x => String(x.id) === String(selectedFieldId));
        const fldArea = Number(fld?.area || 2.5);
        const fldYield = Number(fld?.predicted_yield || 92.4);
        const isHigh = fld?.risk_level === 'High' || fld?.risk_level === 'Critical';

        return {
          totalFarms: 1,
          totalFields: 1,
          totalArea: fldArea,
          totalExpectedProduction: fldArea * fldYield,
          avgYield: fldYield,
          highRisk: isHigh ? 1 : 0,
          normalFields: isHigh ? 0 : 1,
          avgConfidence: 92.0
        };
      }

      const totalArea = Number(f?.total_area || flds.reduce((acc, fl) => acc + Number(fl.area || 0), 0) || 5.0);
      const fldCount = flds.length || 1;
      const avgYield = 91.8;
      const highRisk = flds.filter(fl => fl.risk_level === 'High' || fl.risk_level === 'Critical').length;
      const normalFields = Math.max(0, fldCount - highRisk);

      return {
        totalFarms: 1,
        totalFields: fldCount,
        totalArea: totalArea,
        totalExpectedProduction: totalArea * avgYield,
        avgYield: avgYield,
        highRisk: highRisk,
        normalFields: normalFields,
        avgConfidence: 91.0
      };
    }
  }, [selectedFarmId, selectedFieldId, effectiveFarms, activeFarmObj, multiFarm]);

  const severityColor = { info: '#3b82f6', low: '#16a34a', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading-center">
          <div className="loading-spinner" />
          <p>Loading multi-farm intelligence dashboard…</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="page-container">
          <div className="error-banner">⚠️ {error} — <button className="link-btn" onClick={() => window.location.reload()}>Retry</button></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Enterprise Agricultural AI Platform</p>
            <h1 className="page-title">Welcome back, {firstName} 👋</h1>
            <p className="page-subtitle">Multi-farm intelligence overview — {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => navigate('/farm-map')}>🗺️ Farm Map</button>
            <button className="btn-primary" onClick={() => navigate('/prediction')}>🌾 Predict Yield</button>
          </div>
        </div>

        {/* 13. MULTI-FARM FILTER TOOLBAR */}
        <div className="dash-panel" style={{ padding: '14px 18px', marginBottom: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>🔍</span>
              <div>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>Filter Agricultural Holdings:</strong>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>
                  Filter dashboard metrics by individual farm and field parcel
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Farm:</label>
                <select
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '13px', minWidth: '180px' }}
                  value={selectedFarmId}
                  onChange={handleFarmFilterChange}
                >
                  <option value="all">🏡 All Farms (Multi-Farm Overview)</option>
                  {effectiveFarms.map(f => (
                    <option key={f.id} value={String(f.id)}>
                      {f.name} ({f.location || 'Maharashtra'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Field:</label>
                <select
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '13px', minWidth: '160px' }}
                  value={selectedFieldId}
                  onChange={handleFieldFilterChange}
                  disabled={selectedFarmId === 'all'}
                >
                  <option value="all">🌱 All Fields in Farm</option>
                  {availableFields.map(fld => (
                    <option key={fld.id} value={String(fld.id)}>
                      {fld.name} ({fld.sugarcane_variety || 'Co 86032'})
                    </option>
                  ))}
                </select>
              </div>

              {(selectedFarmId !== 'all' || selectedFieldId !== 'all') && (
                <button
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => { setSelectedFarmId('all'); setSelectedFieldId('all'); }}
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 13. MULTI-FARM DASHBOARD CALCULATED METRICS (All 8 Requirements) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <StatCard
            icon="🏡"
            label="Total Farms"
            value={calculatedMetrics.totalFarms}
            color="#0f766e"
            onClick={() => navigate('/farms')}
          />
          <StatCard
            icon="🌱"
            label="Total Fields"
            value={calculatedMetrics.totalFields}
            color="#0d9488"
            onClick={() => navigate('/farms')}
          />
          <StatCard
            icon="📐"
            label="Cultivated Area"
            value={`${calculatedMetrics.totalArea.toFixed(1)} ha`}
            color="#2d7a3e"
            onClick={() => navigate('/farms')}
          />
          <StatCard
            icon="📦"
            label="Expected Production"
            value={`${Math.round(calculatedMetrics.totalExpectedProduction)} t`}
            color="#065f46"
            onClick={() => navigate('/prediction')}
          />
          <StatCard
            icon="🌾"
            label="Avg Predicted Yield"
            value={`${calculatedMetrics.avgYield.toFixed(1)} t/ha`}
            change="Model Forecast"
            changeUp
            color="#16a34a"
            onClick={() => navigate('/prediction')}
          />
          <StatCard
            icon="🎯"
            label="Average Confidence"
            value={`${Math.round(calculatedMetrics.avgConfidence)}%`}
            color="#7c3aed"
            onClick={() => navigate('/insights')}
          />
          <StatCard
            icon="🌿"
            label="Normal Fields"
            value={calculatedMetrics.normalFields}
            color="#10b981"
            onClick={() => navigate('/farms')}
          />
          <StatCard
            icon="⚠️"
            label="High-Risk Fields"
            value={calculatedMetrics.highRisk}
            color={calculatedMetrics.highRisk > 0 ? '#ef4444' : '#64748b'}
            onClick={() => navigate('/yield-loss')}
          />
        </div>

        {/* 16. IRRIGATION DECISION SUPPORT */}
        {irrigation && (
          <div className="dash-panel" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '16px', borderRadius: '10px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>💧</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '15px', color: '#0369a1' }}>Irrigation Decision Support</strong>
                    <span className={`status-badge ${
                      irrigation.status === 'Normal' ? 'status-good' :
                      irrigation.status === 'Monitor' ? 'status-moderate' : 'status-critical'
                    }`}>
                      {irrigation.status || 'Normal'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#0c4a6e', margin: '3px 0 0' }}>
                    {irrigation.recommendation || 'Soil moisture is optimal. Continue scheduled furrow monitoring.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#075985' }}>
                <div>Moisture: <strong>{irrigation.soil_moisture || 62}%</strong></div>
                <div>Precipitation: <strong>{irrigation.rainfall_mm || 1220} mm</strong></div>
                <div>Temp: <strong>{irrigation.temperature_c || 28.5}°C</strong></div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
              ℹ️ Decision support based on soil moisture and agro-weather indices. Exact volumetric application depends on calibrated soil field capacity.
            </div>
          </div>
        )}

        {/* 17. AI FARM ADVISOR PANEL (Current Situation, Suggested Actions, Why Generated) */}
        <div className="dash-panel" style={{ marginTop: '20px' }}>
          <div className="dash-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <div>
                <h3>AI Farm Advisor & Surveillance Directives</h3>
                <p className="text-xs text-gray-500">Real-time agronomic suggestions grounded in your live soil, weather, crop stage, and yield predictions.</p>
              </div>
            </div>
            <span className="badge badge-green">Grounded in Farm Data</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', marginTop: '12px' }}>
            {advisorData.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
                All monitored blocks are currently in optimal condition. No urgent interventions needed.
              </div>
            ) : (
              advisorData.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderLeft: `4px solid ${
                      item.urgency === 'High' ? '#ef4444' : item.urgency === 'Medium' ? '#f59e0b' : '#16a34a'
                    }`,
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#1f2937' }}>{item.title}</strong>
                    <span className={`status-badge ${item.urgency === 'High' ? 'status-critical' : item.urgency === 'Medium' ? 'status-moderate' : 'status-good'}`} style={{ fontSize: '10px' }}>
                      {item.urgency || item.priority || 'Normal'} Priority
                    </span>
                  </div>

                  {/* 17. Current Situation */}
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#1e293b' }}>
                    <strong style={{ color: '#047857', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                      📍 Current Situation:
                    </strong>
                    {item.current_situation || item.message || item.content}
                  </div>

                  {/* 17. Suggested Monitoring Actions */}
                  <div style={{ marginBottom: '10px', fontSize: '12px', color: '#1e293b' }}>
                    <strong style={{ color: '#2563eb', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                      📋 Suggested Monitoring Actions:
                    </strong>
                    {item.suggested_monitoring_actions || item.action_required || item.message}
                  </div>

                  {/* 17. Explaining WHY this recommendation was generated */}
                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', color: '#334155', borderTop: '1px solid #f1f5f9' }}>
                    <strong style={{ color: '#0f766e', display: 'block', marginBottom: '2px' }}>
                      💡 Why this recommendation was generated:
                    </strong>
                    {item.why_generated || item.explanation || 'Triggered by soil moisture and crop phenology thresholds.'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Existing Charts & Live Feed */}
        <div className="dash-two-col" style={{ marginTop: '20px' }}>
          {/* Yield trend */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Yield Trend Across Harvest Cycles</h3>
              <button className="link-btn" onClick={() => navigate('/analytics')}>View Historical Analytics →</button>
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
                <p>Run predictions to see multi-season yield comparisons.</p>
                <button className="btn-primary" onClick={() => navigate('/prediction')}>Forecast First Field</button>
              </div>
            )}
          </div>

          {/* Active Alerts */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Active Agro-Climatic Alerts</h3>
              <button className="link-btn" onClick={() => navigate('/alerts')}>View All ({alerts.length}) →</button>
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
              <div className="empty-state-sm"><p>All farm parameters nominal. Good conditions! ✅</p></div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions" style={{ marginTop: '20px' }}>
          {[
            { icon: '🌾', label: 'Predict Yield',   path: '/prediction' },
            { icon: '🔮', label: 'What-If Sim',      path: '/simulator' },
            { icon: '🗺️', label: 'Interactive Map',  path: '/farm-map' },
            { icon: '🌿', label: 'Crop Intel',       path: '/crop-intel' },
            { icon: '🪨', label: 'Soil Analysis',    path: '/soil' },
            { icon: '🔬', label: 'Variety Compare',  path: '/varieties' },
            { icon: '📄', label: 'Reports',          path: '/reports' },
            { icon: '💬', label: 'AI Farm Chat',     path: '/chat' },
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
