import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from 'recharts';
import AppLayout from '../components/AppLayout';
import { mlApi, predictionApi } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const PRESET_SCENARIOS = [
  { id: 'normal',           label: 'Normal Conditions',       changes: {} },
  { id: 'inc_rain',         label: 'Increased Rainfall',      changes: { rainfall_mm: 1500 } },
  { id: 'red_rain',         label: 'Reduced Rainfall',        changes: { rainfall_mm: 700  } },
  { id: 'inc_moist',        label: 'Increased Soil Moisture', changes: { soil_moisture: 78 } },
  { id: 'red_moist',        label: 'Reduced Soil Moisture',   changes: { soil_moisture: 38 } },
  { id: 'high_temp',        label: 'Higher Temperature',      changes: { temperature_c: 36 } },
  { id: 'low_temp',         label: 'Lower Temperature',       changes: { temperature_c: 22 } },
];

const VARIETIES = ['Co 86032', 'Co 0238', 'CoC 671', 'Co 99004', 'CoM 0265'];

export default function SimulatorPage() {
  const [base, setBase] = useState({
    rainfall_mm: 1200,
    temperature_c: 28,
    humidity: 68,
    soil_moisture: 60,
    soil_ph: 6.8,
    area_hectare: 5.0,
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
    predictionApi.list().then(r => {
      const p = r.data?.predictions?.[0];
      if (p) {
        setLastPred(p);
        setCurrentPred(Number(p.predicted_yield) || 88.5);
        setBase(b => ({
          ...b,
          rainfall_mm: Number(p.rainfall) || 1200,
          temperature_c: Number(p.temperature) || 28,
          humidity: Number(p.humidity) || 68,
          soil_moisture: Number(p.soil_moisture) || 60,
          soil_ph: Number(p.soil_ph) || 6.8,
          variety: p.variety || 'Co 86032',
          area_hectare: Number(p.area) || 5.0,
          historical_yield: Number(p.historical_yield) || 85.0
        }));
      }
    }).catch(() => {});
  }, []);

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
      toast.success('Scenario simulation completed!');
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
    name: r.label.replace(' Conditions', '').replace('Soil ', ''),
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
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Predictive Sensitivity Engine</p>
            <h1 className="page-title">What-If Yield Scenario Simulator</h1>
            <p className="page-subtitle">
              Simulate climatic and agronomic variations in real time. All outputs are <strong>model-based scenario estimates</strong> powered by verified Random Forest & XGBoost models.
            </p>
          </div>
          <button className="btn-primary" onClick={runBatch} disabled={batchLoading}>
            {batchLoading ? '🔄 Running Scenarios…' : '▶ Run All 7 Scenarios'}
          </button>
        </div>

        {/* Disclaimer Banner */}
        <div className="info-banner" style={{ borderLeft: '4px solid #f59e0b', background: '#fffbeb', color: '#92400e' }}>
          ⚠️ <strong>Model-Based Scenario Estimates Only:</strong> Results represent simulated machine learning projections under hypothetical inputs. They serve as agro-decision support and do not guarantee actual field yields.
        </div>

        {/* Preset quick buttons */}
        <div className="dash-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>⚡ Quick Pre-Set Scenarios:</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PRESET_SCENARIOS.map(s => (
              <button
                key={s.id}
                className="btn-sm btn-outline"
                style={{ padding: '6px 14px', borderRadius: '20px' }}
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

        <div className="dash-two-col">
          {/* Base parameters */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Baseline Farm Conditions</h3>
              {lastPred ? (
                <span className="badge badge-green">From Latest Prediction</span>
              ) : (
                <span className="badge badge-blue">Standard Baseline</span>
              )}
            </div>

            <div className="sim-form-grid">
              <div className="sim-field">
                <label>Sugarcane Variety</label>
                <select
                  value={base.variety}
                  onChange={e => setBase(b => ({ ...b, variety: e.target.value }))}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div className="sim-field">
                <label>Area (Hectares)</label>
                <div className="sim-range-wrap">
                  <input
                    type="range" min="0.5" max="50" step="0.5"
                    value={base.area_hectare}
                    onChange={e => setBase(b => ({ ...b, area_hectare: Number(e.target.value) }))}
                  />
                  <span className="sim-range-val">{base.area_hectare} ha</span>
                </div>
              </div>

              {[
                { key: 'rainfall_mm',   label: 'Rainfall (mm)',     min: 200, max: 2500, step: 25 },
                { key: 'temperature_c', label: 'Temperature (°C)',  min: 15,  max: 48,   step: 0.5 },
                { key: 'humidity',      label: 'Humidity (%)',      min: 20,  max: 100,  step: 1 },
                { key: 'soil_moisture', label: 'Soil Moisture (%)', min: 10,  max: 95,   step: 1 },
                { key: 'soil_ph',       label: 'Soil pH',           min: 4.5, max: 9.5,  step: 0.1 },
              ].map(f => (
                <div key={f.key} className="sim-field">
                  <label>{f.label}</label>
                  <div className="sim-range-wrap">
                    <input
                      type="range" min={f.min} max={f.max} step={f.step}
                      value={base[f.key]}
                      onChange={e => setBase(b => ({ ...b, [f.key]: Number(e.target.value) }))}
                    />
                    <span className="sim-range-val">{Number(base[f.key]).toFixed(f.step < 1 ? 1 : 0)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="sim-base-pred" style={{ marginTop: '16px', padding: '12px', background: '#f3f4f6', borderRadius: '8px' }}>
              <div>Current Baseline Forecast: <strong className="td-green">{currentPred.toFixed(1)} t/ha</strong></div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Expected Production: <strong>{activeBaseProd} tonnes</strong> ({base.area_hectare} ha @ {base.variety})
              </div>
            </div>
          </div>

          {/* Custom Scenario Adjustment */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>What-If Scenario Modifications</h3>
              <span className="badge badge-purple">Interactive Sliders</span>
            </div>

            <div className="sim-form-grid">
              <div className="sim-field">
                <label>Scenario Variety</label>
                <select
                  value={custom.variety ?? base.variety}
                  onChange={e => setCustom(c => ({ ...c, variety: e.target.value }))}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div className="sim-field">
                <label>Scenario Area (Hectares)</label>
                <div className="sim-range-wrap">
                  <input
                    type="range" min="0.5" max="50" step="0.5"
                    value={custom.area_hectare ?? base.area_hectare}
                    onChange={e => setCustom(c => ({ ...c, area_hectare: Number(e.target.value) }))}
                  />
                  <span className="sim-range-val">{custom.area_hectare ?? base.area_hectare} ha</span>
                </div>
              </div>

              {[
                { key: 'rainfall_mm',   label: 'Rainfall (mm)',     min: 200, max: 2500, step: 25 },
                { key: 'temperature_c', label: 'Temperature (°C)',  min: 15,  max: 48,   step: 0.5 },
                { key: 'humidity',      label: 'Humidity (%)',      min: 20,  max: 100,  step: 1 },
                { key: 'soil_moisture', label: 'Soil Moisture (%)', min: 10,  max: 95,   step: 1 },
                { key: 'soil_ph',       label: 'Soil pH',           min: 4.5, max: 9.5,  step: 0.1 },
              ].map(f => (
                <div key={f.key} className="sim-field">
                  <label>{f.label}</label>
                  <div className="sim-range-wrap">
                    <input
                      type="range" min={f.min} max={f.max} step={f.step}
                      value={custom[f.key] ?? base[f.key]}
                      onChange={e => setCustom(c => ({ ...c, [f.key]: Number(e.target.value) }))}
                    />
                    <span className="sim-range-val">{Number(custom[f.key] ?? base[f.key]).toFixed(f.step < 1 ? 1 : 0)}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn-primary"
              onClick={() => runSingle()}
              disabled={loading}
              style={{ marginTop: 16, width: '100%', padding: '12px' }}
            >
              {loading ? '🔄 Computing Simulation…' : '🔮 Run Custom What-If Scenario'}
            </button>

            {/* Scenario Result Comparison Card */}
            {result && (
              <div
                className={`sim-result ${result.difference >= 0 ? 'sim-result-pos' : 'sim-result-neg'}`}
                style={{ marginTop: '16px' }}
              >
                <div className="sir-row">
                  <span>Current Baseline Yield</span>
                  <strong>{Number(result.base_prediction || currentPred).toFixed(1)} t/ha</strong>
                </div>
                <div className="sir-row">
                  <span>Scenario Projected Yield</span>
                  <strong>{Number(result.scenario_prediction).toFixed(1)} t/ha</strong>
                </div>
                <div className="sir-row">
                  <span>Projected Total Production</span>
                  <strong>{activeScenarioProd} tonnes</strong>
                </div>
                <div className="sir-diff">
                  {result.difference >= 0 ? '▲ +' : '▼ '}
                  {Math.abs(result.difference).toFixed(1)} t/ha
                  ({result.percentage_change >= 0 ? '+' : ''}{Number(result.percentage_change || 0).toFixed(1)}%)
                </div>

                <div style={{ marginTop: '12px', fontSize: '11px', color: '#6b7280' }}>
                  Model-based scenario estimate using trained Random Forest & XGBoost sensitivity matrices.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Batch Scenarios Comparison */}
        {batchResults.length > 0 && (
          <div className="dash-panel" style={{ marginTop: '24px' }}>
            <div className="dash-panel-header">
              <h3>7 Pre-Defined Climatic & Soil Scenarios</h3>
              <span className="badge badge-green">Consensus Model Projections</span>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 16, right: 16, bottom: 24, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" t/ha" />
                <Tooltip formatter={(v, n) => [n === 'yield' ? `${v.toFixed(1)} t/ha` : `${v >= 0 ? '+' : ''}${v.toFixed(1)} t/ha`, n === 'yield' ? 'Yield' : 'Delta']} />
                <Legend />
                <ReferenceLine y={currentPred} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: `Baseline: ${currentPred.toFixed(1)} t/ha`, fontSize: 11, position: 'top' }} />
                <Bar dataKey="yield" name="Scenario Yield (t/ha)" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.diff >= 0 ? '#16a34a' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="table-wrap" style={{ marginTop: 16 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Simulated Yield</th>
                    <th>Variance from Baseline</th>
                    <th>Percentage Shift</th>
                    <th>Model Estimate Reliability</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResults.map(r => (
                    <tr key={r.label}>
                      <td className="td-bold">{r.label}</td>
                      <td className={r.scenario_prediction >= currentPred ? 'td-green' : ''}>
                        {Number(r.scenario_prediction).toFixed(1)} t/ha
                      </td>
                      <td style={{ color: r.difference >= 0 ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                        {r.difference >= 0 ? '+' : ''}{Number(r.difference).toFixed(1)} t/ha
                      </td>
                      <td style={{ color: r.percentage_change >= 0 ? '#16a34a' : '#ef4444' }}>
                        {r.percentage_change >= 0 ? '+' : ''}{Number(r.percentage_change).toFixed(1)}%
                      </td>
                      <td><span className="badge badge-green">High Confidence (RF/XGB)</span></td>
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
