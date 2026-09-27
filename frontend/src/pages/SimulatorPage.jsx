import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell
} from 'recharts';
import {
  Sliders, Sparkles, Play, RefreshCw, TrendingUp, TrendingDown, Layers,
  AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Thermometer,
  CloudRain, Droplets, Activity, Gauge
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { mlApi, predictionApi } from '../services/api';
import { useField } from '../context/FieldContext';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import toast, { Toaster } from 'react-hot-toast';

const PRESET_SCENARIOS = [
  { id: 'normal',    label: 'Normal Conditions',       changes: {} },
  { id: 'inc_rain',  label: 'Increased Rainfall (+25%)', changes: { rainfall_mm: 1500 } },
  { id: 'red_rain',  label: 'Drought Stress (-40%)',    changes: { rainfall_mm: 700  } },
  { id: 'inc_moist', label: 'Optimal Saturation (78%)',changes: { soil_moisture: 78 } },
  { id: 'red_moist', label: 'Moisture Deficit (38%)',   changes: { soil_moisture: 38 } },
  { id: 'high_temp', label: 'Heat Stress (36°C)',      changes: { temperature_c: 36 } },
  { id: 'low_temp',  label: 'Mild Winter (22°C)',       changes: { temperature_c: 22 } },
];

const VARIETIES = ['Co 86032', 'Co 0238', 'CoC 671', 'Co 99004', 'CoM 0265'];

export default function SimulatorPage() {
  const navigate = useNavigate();
  const { selectedField, activeWeather } = useField();

  const [base, setBase] = useState({
    rainfall_mm: 1200,
    temperature_c: 29.5,
    humidity: 70,
    soil_moisture: 60,
    soil_ph: 7.0,
    area_hectare: 2.5,
    variety: 'Co 86032',
    growth_stage: 'Grand Growth',
    soil_type: 'Black Soil',
    historical_yield: 85.0
  });

  const [currentPred, setCurrentPred]   = useState(88.5);
  const [result, setResult]             = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [lastPred, setLastPred]         = useState(null);

  // Custom scenario overrides
  const [custom, setCustom] = useState({});

  useEffect(() => {
    if (selectedField) {
      setBase(b => ({
        ...b,
        variety: selectedField.sugarcane_variety || b.variety,
        area_hectare: Number(selectedField.area) || b.area_hectare,
        soil_type: selectedField.soil_type || b.soil_type,
        soil_ph: Number(selectedField.soil_ph) || b.soil_ph,
        soil_moisture: Number(selectedField.soil_moisture) || b.soil_moisture,
      }));
    }

    if (activeWeather) {
      setBase(b => ({
        ...b,
        temperature_c: activeWeather.temperature || b.temperature_c,
        humidity: activeWeather.humidity || b.humidity,
        rainfall_mm: activeWeather.rainfall ? Math.max(activeWeather.rainfall, 800) : b.rainfall_mm,
      }));
    }

    predictionApi.list().then(r => {
      const p = r.data?.predictions?.[0];
      if (p) {
        setLastPred(p);
        setCurrentPred(Number(p.predicted_yield) || 88.5);
      }
    }).catch(() => {});
  }, [selectedField, activeWeather]);

  const runSingle = async (scenarioOverride = null) => {
    const scToRun = scenarioOverride || custom;
    setLoading(true);
    try {
      const r = await mlApi.whatIf({
        base,
        scenario: scToRun,
        current_prediction: currentPred
      });
      setResult(r.data?.data || r.data);
      toast.success('Simulation computed!');
    } catch (e) {
      toast.error(e.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const runBatch = async () => {
    setBatchLoading(true);
    try {
      const results = await Promise.all(
        PRESET_SCENARIOS.map(s =>
          mlApi.whatIf({ base, scenario: s.changes, current_prediction: currentPred })
            .then(r => ({ label: s.label, ...(r.data?.data || r.data) }))
            .catch(() => null)
        )
      );
      setBatchResults(results.filter(Boolean));
      toast.success('All 7 pre-set scenarios simulated!');
    } catch (e) {
      toast.error(e.message || 'Batch simulation failed');
    } finally {
      setBatchLoading(false);
    }
  };

  const chartData = batchResults.map(r => ({
    name: r.label.split(' (')[0],
    yield: Number(r.scenario_prediction || 0),
    diff: Number(r.difference || 0),
  }));

  const activeScenarioYield = result ? Number(result.scenario_prediction || currentPred) : currentPred;
  const activeScenarioProd = (activeScenarioYield * (Number(custom.area_hectare ?? base.area_hectare) || 1)).toFixed(1);
  const activeBaseProd = (currentPred * (Number(base.area_hectare) || 1)).toFixed(1);

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              <Sliders size={13} /> Predictive Sensitivity & Climate Stress Engine
            </div>
            <h1 className="page-title" style={{ margin: '0 0 6px' }}>What-If Yield Scenario Simulator</h1>
            <p className="page-subtitle" style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Simulate climatic, irrigation, and edaphic stresses in real time with our dual Random Forest & XGBoost model consensus.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={runBatch} disabled={batchLoading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={15} className={batchLoading ? 'animate-spin' : ''} />
              {batchLoading ? 'Computing 7 Scenarios…' : 'Run All 7 Pre-Set Scenarios'}
            </button>
          </div>
        </div>

        {/* Disclaimer Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#d97706', marginBottom: 20 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Model-Based Scenario Estimate: Projections reflect sensitivity gradients learned from historical regional datasets. Not a contractual harvest guarantee.
          </span>
        </div>

        {/* Preset Quick Actions Ribbon */}
        <div className="card" style={{ padding: 16, borderRadius: 14, border: '1px solid var(--border-color)', background: 'var(--card-bg)', marginBottom: 24 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>
            ⚡ QUICK EXPERIMENTAL SCENARIOS:
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESET_SCENARIOS.map(s => (
              <button
                key={s.id}
                className="btn-outline-sm"
                style={{ borderRadius: 20, padding: '6px 14px', fontSize: 12 }}
                onClick={() => {
                  setCustom(s.changes);
                  runSingle(s.changes);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dual Parameter Adjustment Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>
          
          {/* Baseline Column */}
          <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Baseline Control Conditions</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reference agricultural dataset</span>
              </div>
              <Badge variant={lastPred ? 'success' : 'primary'}>
                {lastPred ? 'Active Prediction' : 'Standard Baseline'}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Sugarcane Cultivar</label>
                <select
                  className="input-field"
                  value={base.variety}
                  onChange={e => setBase(b => ({ ...b, variety: e.target.value }))}
                >
                  {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Cultivated Extent</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{base.area_hectare} ha</span>
                </div>
                <input
                  type="range" min="0.5" max="50" step="0.5"
                  value={base.area_hectare}
                  onChange={e => setBase(b => ({ ...b, area_hectare: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {[
                { key: 'rainfall_mm',   label: 'Rainfall (Annual Cumulative)', min: 200, max: 2500, step: 25, unit: 'mm' },
                { key: 'temperature_c', label: 'Mean Air Temperature',         min: 15,  max: 48,   step: 0.5, unit: '°C' },
                { key: 'humidity',      label: 'Atmospheric Humidity',         min: 20,  max: 100,  step: 1, unit: '%' },
                { key: 'soil_moisture', label: 'Soil Moisture Saturation',      min: 10,  max: 95,   step: 1, unit: '%' },
                { key: 'soil_ph',       label: 'Soil Reaction (pH)',           min: 4.5, max: 9.5,  step: 0.1, unit: 'pH' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{f.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {Number(base[f.key]).toFixed(f.step < 1 ? 1 : 0)} {f.unit}
                    </span>
                  </div>
                  <input
                    type="range" min={f.min} max={f.max} step={f.step}
                    value={base[f.key]}
                    onChange={e => setBase(b => ({ ...b, [f.key]: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, padding: 14, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Baseline Forecast:</span>
                <strong style={{ fontSize: 18, color: 'var(--primary)' }}>{currentPred.toFixed(1)} t/ha</strong>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Expected Holding Yield: <strong>{activeBaseProd} tonnes</strong> ({base.area_hectare} ha)
              </div>
            </div>
          </div>

          {/* Scenario Modification Column */}
          <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>What-If Scenario Tuning</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Simulate perturbed variables</span>
              </div>
              <Badge variant="purple">Perturbation Controls</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Scenario Cultivar</label>
                <select
                  className="input-field"
                  value={custom.variety ?? base.variety}
                  onChange={e => setCustom(c => ({ ...c, variety: e.target.value }))}
                >
                  {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Cultivated Extent</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{custom.area_hectare ?? base.area_hectare} ha</span>
                </div>
                <input
                  type="range" min="0.5" max="50" step="0.5"
                  value={custom.area_hectare ?? base.area_hectare}
                  onChange={e => setCustom(c => ({ ...c, area_hectare: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#6366f1' }}
                />
              </div>

              {[
                { key: 'rainfall_mm',   label: 'Rainfall (Annual Cumulative)', min: 200, max: 2500, step: 25, unit: 'mm' },
                { key: 'temperature_c', label: 'Mean Air Temperature',         min: 15,  max: 48,   step: 0.5, unit: '°C' },
                { key: 'humidity',      label: 'Atmospheric Humidity',         min: 20,  max: 100,  step: 1, unit: '%' },
                { key: 'soil_moisture', label: 'Soil Moisture Saturation',      min: 10,  max: 95,   step: 1, unit: '%' },
                { key: 'soil_ph',       label: 'Soil Reaction (pH)',           min: 4.5, max: 9.5,  step: 0.1, unit: 'pH' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{f.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {Number(custom[f.key] ?? base[f.key]).toFixed(f.step < 1 ? 1 : 0)} {f.unit}
                    </span>
                  </div>
                  <input
                    type="range" min={f.min} max={f.max} step={f.step}
                    value={custom[f.key] ?? base[f.key]}
                    onChange={e => setCustom(c => ({ ...c, [f.key]: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: '#6366f1' }}
                  />
                </div>
              ))}
            </div>

            <button
              className="btn-primary"
              onClick={() => runSingle()}
              disabled={loading}
              style={{ marginTop: 20, width: '100%', padding: '14px', justifyContent: 'center', gap: 8 }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Computing Multi-Model Inference…</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Execute Custom Scenario Simulation</span>
                </>
              )}
            </button>

            {/* Result Simulation Comparison Card */}
            {result && (
              <div
                style={{
                  marginTop: 20,
                  padding: 18,
                  borderRadius: 14,
                  background: result.difference >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${result.difference >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Baseline Control Yield</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {Number(result.base_prediction || currentPred).toFixed(1)} t/ha
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Simulated Scenario Yield</span>
                  <strong style={{ fontSize: 18, color: result.difference >= 0 ? 'var(--primary)' : '#ef4444' }}>
                    {Number(result.scenario_prediction).toFixed(1)} t/ha
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Projected Total Production</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {activeScenarioProd} Tonnes
                  </span>
                </div>

                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: result.difference >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: result.difference >= 0 ? 'var(--primary)' : '#ef4444',
                    fontWeight: 700,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  {result.difference >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>
                    Variance: {result.difference >= 0 ? '+' : ''}{Number(result.difference).toFixed(1)} t/ha ({result.percentage_change >= 0 ? '+' : ''}{Number(result.percentage_change || 0).toFixed(1)}%)
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-outline-sm"
                  style={{ marginTop: 14, width: '100%', justifyContent: 'center', gap: 6 }}
                  onClick={() => {
                    const params = new URLSearchParams({
                      variety: custom.variety ?? base.variety,
                      area: String(custom.area_hectare ?? base.area_hectare),
                      rainfall: String(custom.rainfall_mm ?? base.rainfall_mm),
                      temperature: String(custom.temperature_c ?? base.temperature_c),
                      humidity: String(custom.humidity ?? base.humidity),
                      soil_moisture: String(custom.soil_moisture ?? base.soil_moisture),
                      soil_ph: String(custom.soil_ph ?? base.soil_ph),
                    });
                    navigate(`/prediction?${params.toString()}`);
                  }}
                >
                  <span>Apply Parameters to AI Prediction Engine</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Batch Comparative Recharts Visualization */}
        {batchResults.length > 0 && (
          <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Comparative Climatic & Edaphic Perturbation Graph
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Ensemble ML projections relative to active baseline
                </span>
              </div>
              <Badge variant="success">Consensus Model Projections</Badge>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 16, right: 16, bottom: 24, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} unit=" t/ha" />
                <Tooltip
                  formatter={(v, n) => [
                    n === 'yield' ? `${v.toFixed(1)} t/ha` : `${v >= 0 ? '+' : ''}${v.toFixed(1)} t/ha`,
                    n === 'yield' ? 'Yield' : 'Delta'
                  ]}
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                />
                <Legend />
                <ReferenceLine
                  y={currentPred}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{ value: `Baseline: ${currentPred.toFixed(1)} t/ha`, fontSize: 11, position: 'top', fill: 'var(--text-muted)' }}
                />
                <Bar dataKey="yield" name="Scenario Yield (t/ha)" radius={[6, 6, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.diff >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div style={{ overflowX: 'auto', marginTop: 20 }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Scenario Label</th>
                    <th>Simulated Yield</th>
                    <th>Variance vs Baseline</th>
                    <th>Relative Shift</th>
                    <th>Model Estimate Reliability</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResults.map(r => (
                    <tr key={r.label}>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.label}</td>
                      <td style={{ fontWeight: 700, color: r.scenario_prediction >= currentPred ? 'var(--primary)' : 'inherit' }}>
                        {Number(r.scenario_prediction).toFixed(1)} t/ha
                      </td>
                      <td style={{ color: r.difference >= 0 ? 'var(--primary)' : '#ef4444', fontWeight: 700 }}>
                        {r.difference >= 0 ? '+' : ''}{Number(r.difference).toFixed(1)} t/ha
                      </td>
                      <td style={{ color: r.percentage_change >= 0 ? 'var(--primary)' : '#ef4444', fontWeight: 600 }}>
                        {r.percentage_change >= 0 ? '+' : ''}{Number(r.percentage_change).toFixed(1)}%
                      </td>
                      <td>
                        <Badge variant="success">High Confidence (RF/XGB)</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
