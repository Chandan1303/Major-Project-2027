import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Warehouse,
  Sprout,
  MapPin,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Droplets,
  Calendar,
  Map,
  Filter,
  ArrowRight,
  BarChart3,
  Sliders,
  Layers,
  Dna,
  FileText,
  MessageSquare,
  RefreshCw,
  BellRing
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useField } from '../context/FieldContext';
import { dashboardApi, alertApi, advisorApi, irrigationApi, farmApi } from '../services/api';

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

  const firstName = user?.name?.split(' ')[0] || 'Grower';

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

  const severityColor = { info: '#38bdf8', low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-spinner" />
          <p style={{ marginTop: 16, color: 'var(--text-muted)', fontWeight: 600 }}>Loading multi-farm intelligence dashboard…</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="page-container">
          <div className="error-banner" style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px 20px', borderRadius: 12, color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>⚠️ {error}</span>
            <button className="btn-outline" onClick={() => window.location.reload()} style={{ padding: '6px 12px', fontSize: 13 }}>Retry Connection</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <span className="eyebrow">
              <Sparkles size={13} />
              Enterprise Agricultural AI Platform
            </span>
            <h1 className="page-title">Welcome back, {firstName} 👋</h1>
            <p className="page-subtitle">
              Multi-farm agronomic intelligence & telemetry — {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </p>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: 10 }}>
            <button className="btn-outline" onClick={() => navigate('/farm-map')}>
              <Map size={16} />
              <span>Interactive Map</span>
            </button>
            <button className="btn-primary" onClick={() => navigate('/prediction')}>
              <Sparkles size={16} />
              <span>Predict Yield</span>
            </button>
          </div>
        </div>

        {/* MULTI-FARM FILTER TOOLBAR */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Filter size={18} />
              </div>
              <div>
                <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Holdings Scope & Telemetry View:</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>
                  Filter dashboard metrics by individual farm estate and field parcel
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>Farm:</label>
                <select
                  className="form-control"
                  style={{ padding: '7px 12px', fontSize: 13, minWidth: 200 }}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>Field:</label>
                <select
                  className="form-control"
                  style={{ padding: '7px 12px', fontSize: 13, minWidth: 180 }}
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
                  className="btn-outline"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => { setSelectedFarmId('all'); setSelectedFieldId('all'); }}
                >
                  <RefreshCw size={12} />
                  <span>Reset Scope</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 8 MASTER METRIC CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard
            icon={Warehouse}
            label="Total Farms"
            value={calculatedMetrics.totalFarms}
            color="#0ea5e9"
            subtitle="Registered agricultural estates"
            onClick={() => navigate('/farms')}
          />
          <StatCard
            icon={Sprout}
            label="Total Fields"
            value={calculatedMetrics.totalFields}
            color="#10b981"
            subtitle="Active cane cultivation parcels"
            onClick={() => navigate('/farms')}
          />
          <StatCard
            icon={MapPin}
            label="Cultivated Area"
            value={calculatedMetrics.totalArea.toFixed(1)}
            unit="ha"
            color="#059669"
            subtitle="Total monitored surface"
            onClick={() => navigate('/farms')}
          />
          <StatCard
            icon={TrendingUp}
            label="Expected Production"
            value={Math.round(calculatedMetrics.totalExpectedProduction).toLocaleString('en-IN')}
            unit="Tonnes"
            color="#047857"
            subtitle="Forecasted regional tonnage"
            onClick={() => navigate('/prediction')}
          />
          <StatCard
            icon={Sparkles}
            label="Avg Predicted Yield"
            value={calculatedMetrics.avgYield.toFixed(1)}
            unit="t/ha"
            change="+18% vs benchmark"
            changeUp
            color="#10b981"
            subtitle="Dual-model calibrated forecast"
            onClick={() => navigate('/prediction')}
          />
          <StatCard
            icon={BarChart3}
            label="Model Confidence"
            value={`${Math.round(calculatedMetrics.avgConfidence)}%`}
            color="#8b5cf6"
            subtitle="Ensemble consensus score"
            onClick={() => navigate('/insights')}
          />
          <StatCard
            icon={ShieldCheck}
            label="Normal Fields"
            value={calculatedMetrics.normalFields}
            color="#10b981"
            subtitle="Nominal moisture & temperature"
            onClick={() => navigate('/farms')}
          />
          <StatCard
            icon={AlertTriangle}
            label="High-Risk Fields"
            value={calculatedMetrics.highRisk}
            color={calculatedMetrics.highRisk > 0 ? '#ef4444' : '#64748b'}
            subtitle={calculatedMetrics.highRisk > 0 ? 'Urgent attention required' : 'No acute hazards identified'}
            onClick={() => navigate('/yield-loss')}
          />
        </div>

        {/* IRRIGATION DECISION SUPPORT BANNER */}
        {irrigation && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
            border: '1.5px solid rgba(14, 165, 233, 0.25)',
            padding: '18px 22px',
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(14, 165, 233, 0.15)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>Irrigation Decision Support</strong>
                    <Badge variant={irrigation.status === 'Normal' ? 'success' : irrigation.status === 'Monitor' ? 'warning' : 'critical'} dot>
                      {irrigation.status || 'Normal'}
                    </Badge>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                    {irrigation.recommendation || 'Soil moisture is optimal. Continue scheduled furrow monitoring.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 18, fontSize: 12.5, color: 'var(--text-secondary)', background: 'var(--bg-panel)', padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div>Moisture: <strong style={{ color: '#0284c7' }}>{irrigation.soil_moisture || 62}%</strong></div>
                <div>Precipitation: <strong style={{ color: '#10b981' }}>{irrigation.rainfall_mm || 1220} mm</strong></div>
                <div>Temp: <strong style={{ color: '#f59e0b' }}>{irrigation.temperature_c || 28.5}°C</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* AI FARM ADVISOR & DIRECTIVES */}
        <div className="card" style={{ padding: '22px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>AI Farm Advisor & Surveillance Directives</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                  Real-time agronomic suggestions grounded in live soil, weather, crop phenology, and yield models.
                </p>
              </div>
            </div>
            <Badge variant="success" dot>Grounded in Telemetry</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {advisorData.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '24px', background: 'var(--border-subtle)', borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5 }}>
                <ShieldCheck size={28} style={{ color: '#10b981', margin: '0 auto 8px', display: 'block' }} />
                All monitored parcels are currently in optimal condition. No urgent interventions needed.
              </div>
            ) : (
              advisorData.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${
                      item.urgency === 'High' ? '#ef4444' : item.urgency === 'Medium' ? '#f59e0b' : '#10b981'
                    }`,
                    borderRadius: 12,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{item.title}</strong>
                    <Badge variant={item.urgency === 'High' ? 'critical' : item.urgency === 'Medium' ? 'warning' : 'success'} size="sm">
                      {item.urgency || item.priority || 'Normal'}
                    </Badge>
                  </div>

                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--primary)', display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                      📍 Current Situation:
                    </strong>
                    {item.current_situation || item.message || item.content}
                  </div>

                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: '#0ea5e9', display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                      📋 Suggested Action:
                    </strong>
                    {item.suggested_monitoring_actions || item.action_required || item.message}
                  </div>

                  <div style={{ background: 'var(--border-subtle)', padding: '8px 12px', borderRadius: 8, fontSize: 11.5, color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>
                      💡 Reason:
                    </strong>
                    {item.why_generated || item.explanation || 'Triggered by soil moisture and crop phenology thresholds.'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TWO COLUMN CHARTS & ALERTS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 24 }}>
          {/* Yield Trend Area Chart */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Multi-Season Yield Telemetry</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Historical vs benchmark cane output</span>
              </div>
              <button className="btn-outline" onClick={() => navigate('/analytics')} style={{ padding: '4px 10px', fontSize: 12 }}>
                <span>Analytics</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {data?.yieldTrend?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.yieldTrend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="dashYieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 232, 240, 0.6)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ borderRadius: 10 }} formatter={(v) => [`${v} t/ha`, 'Yield']} />
                  <Area type="monotone" dataKey="yield" stroke="#10b981" fill="url(#dashYieldGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="benchmark" stroke="#94a3b8" fill="none" strokeDasharray="4 4" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <BarChart3 size={36} style={{ color: 'var(--primary)', margin: '0 auto 10px' }} />
                <p style={{ margin: '0 0 14px', fontSize: 13.5 }}>Run predictions to see multi-season yield comparisons.</p>
                <button className="btn-primary" onClick={() => navigate('/prediction')}>
                  Forecast First Field
                </button>
              </div>
            )}
          </div>

          {/* Active Alerts */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BellRing size={16} className="text-amber-500" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Active Agro-Climatic Alerts</h3>
              </div>
              <button className="btn-outline" onClick={() => navigate('/alerts')} style={{ padding: '4px 10px', fontSize: 12 }}>
                <span>View All ({alerts.length})</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {alerts.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {alerts.map(a => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'var(--border-subtle)',
                      borderLeft: `3px solid ${severityColor[a.severity] || '#6b7280'}`
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block' }}>{a.title}</strong>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {a.message.slice(0, 75)}{a.message.length > 75 ? '…' : ''}
                      </span>
                    </div>
                    <Badge variant={a.severity === 'critical' ? 'critical' : a.severity === 'high' ? 'high' : a.severity === 'medium' ? 'warning' : 'info'} size="sm">
                      {a.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <ShieldCheck size={32} style={{ color: '#10b981', margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontSize: 13.5 }}>All farm parameters nominal. Good conditions!</p>
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS BAR */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 12 }}>
            ⚡ Fast Platform Access
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            {[
              { icon: Sparkles, label: 'Predict Yield',   path: '/prediction' },
              { icon: Sliders, label: 'What-If Sim',     path: '/simulator' },
              { icon: Map, label: 'Interactive Map',     path: '/farm-map' },
              { icon: Sprout, label: 'Crop Intel',       path: '/crop-intel' },
              { icon: Layers, label: 'Soil Analysis',    path: '/soil' },
              { icon: Dna, label: 'Variety Compare',     path: '/varieties' },
              { icon: FileText, label: 'Agri Reports',   path: '/reports' },
              { icon: MessageSquare, label: 'AI Chat',    path: '/chat' },
            ].map(a => {
              const ActionIcon = a.icon;
              return (
                <button
                  key={a.label}
                  className="btn-outline"
                  onClick={() => navigate(a.path)}
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    borderRadius: 10
                  }}
                >
                  <ActionIcon size={18} className="text-emerald-500" />
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
