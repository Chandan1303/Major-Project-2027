import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import AppLayout from '../components/AppLayout';
import { varietyApi, farmApi } from '../services/api';
import { useField } from '../context/FieldContext';
import toast, { Toaster } from 'react-hot-toast';

export default function VarietiesPage() {
  const navigate = useNavigate();
  const { selectedField, activeWeather } = useField();

  const [varieties, setVarieties]   = useState([]);
  const [selected, setSelected]     = useState([]);
  const [comparison, setComparison] = useState(null);
  const [recs, setRecs]             = useState([]);
  const [tab, setTab]               = useState('all');
  const [detail, setDetail]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [recLoading, setRecLoading] = useState(false);

  // Form for AI Variety Recommendation
  const [recForm, setRecForm] = useState({
    farm_location: 'Kolhapur, Maharashtra',
    soil_type: 'Black Cotton Soil',
    soil_ph: '7.2',
    rainfall: '1200',
    temperature: '29.5',
    humidity: '68',
    soil_moisture: '62'
  });

  // Load varieties & auto-sync recommendation form with active field
  useEffect(() => {
    varietyApi.list()
      .then(vr => {
        setVarieties(vr.data?.varieties || []);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  // When active field or weather updates, sync recForm
  useEffect(() => {
    if (selectedField) {
      setRecForm(prev => ({
        ...prev,
        farm_location: selectedField.farm_location || selectedField.location || prev.farm_location,
        soil_type: selectedField.soil_type || prev.soil_type,
        soil_ph: selectedField.soil_ph ? String(selectedField.soil_ph) : prev.soil_ph,
        soil_moisture: selectedField.soil_moisture ? String(selectedField.soil_moisture) : prev.soil_moisture,
      }));
    }
    if (activeWeather) {
      setRecForm(prev => ({
        ...prev,
        temperature: activeWeather.temperature ? String(activeWeather.temperature) : prev.temperature,
        humidity: activeWeather.humidity ? String(activeWeather.humidity) : prev.humidity,
        rainfall: activeWeather.rainfall !== undefined && activeWeather.rainfall !== null ? String(Math.max(activeWeather.rainfall, 800)) : prev.rainfall,
      }));
    }
  }, [selectedField, activeWeather]);

  const toggleSelect = (code) => {
    setSelected(prev => prev.includes(code) ? prev.filter(x => x !== code) : prev.length < 3 ? [...prev, code] : prev);
  };

  const runComparison = async () => {
    if (selected.length < 2) return toast.error('Select at least 2 varieties to compare.');
    try {
      const r = await varietyApi.compare({ variety_names: selected });
      setComparison(r.data);
      setTab('compare');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const runRecommend = async () => {
    setRecLoading(true);
    try {
      const r = await varietyApi.recommend(recForm);
      setRecs(r.data?.recommendations || []);
      setTab('recommend');
      toast.success('AI Variety Recommendation generated!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRecLoading(false);
    }
  };

  const COLOR_MAP = {
    'Co 86032': '#2d7a3e',
    'Co 0238': '#1a73e8',
    'CoC 671': '#7b1fa2',
    'Co 99004': '#f59e0b',
    'CoM 0265': '#dc2626'
  };
  const getColor = (code) => COLOR_MAP[code] || '#6b7280';

  const radarData = (v) => [
    { subject: 'Yield',    value: v.avg_yield || v.expected_yield || 100 },
    { subject: 'Disease',  value: (v.disease || 4) * 20 },
    { subject: 'Drought',  value: (v.drought || 4) * 20 },
    { subject: 'Sucrose',  value: (v.sucrose || v.sucrose_pct || 14) * 6.5 },
    { subject: 'Health',   value: 85 },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading-center">
          <div className="loading-spinner" />
          <p>Loading Sugarcane Variety Intelligence…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Varietal Agronomy</p>
            <h1 className="page-title">Sugarcane Variety Intelligence</h1>
            <p className="page-subtitle">
              Comprehensive comparison and AI recommendation across top commercial cultivars: Co 86032, Co 0238, CoC 671, Co 99004, and CoM 0265.
            </p>
          </div>
          {selected.length >= 2 && (
            <button className="btn-primary" onClick={runComparison}>
              Compare {selected.length} Varieties →
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {[
            { id: 'all',       label: '🌾 All 5 Commercial Cultivars' },
            { id: 'compare',   label: '⚖️ Side-by-Side Comparison' },
            { id: 'recommend', label: '🤖 AI Variety Recommendation' }
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

        {/* ─── TAB 1: ALL VARIETIES ─── */}
        {tab === 'all' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p className="page-hint" style={{ margin: 0 }}>
                Select up to 3 cultivars to compare side-by-side across agronomic traits, risk, and yield potential.
              </p>
              <button
                className="btn-sm btn-outline"
                onClick={() => {
                  setSelected(['Co 86032', 'Co 0238', 'CoM 0265']);
                  runComparison();
                }}
              >
                ⚡ Compare Top 3 Popular Cultivars
              </button>
            </div>

            <div className="variety-cards-grid">
              {varieties.map(v => {
                const code = v.variety_code || v.code || v.name?.split(' ')[0] + ' ' + v.name?.split(' ')[1];
                const isSel = selected.includes(code);
                return (
                  <div
                    key={v.id || code}
                    className={`variety-card ${isSel ? 'variety-card-selected' : ''}`}
                    style={{ '--var-color': getColor(code) }}
                    onClick={() => { toggleSelect(code); setDetail(v); }}
                  >
                    <div className="vc-header">
                      <span className="vc-name">{v.name}</span>
                      <span className="vc-check" style={{ background: isSel ? getColor(code) : undefined, color: isSel ? '#fff' : undefined }}>
                        {isSel ? '✓ Selected' : '+ Compare'}
                      </span>
                    </div>
                    <p className="vc-origin">{v.origin}</p>
                    <div className="vc-yield">
                      <span className="vc-yield-val">{v.avg_yield || v.expected_yield}</span>
                      <span className="vc-yield-unit">avg t/ha</span>
                      <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
                        Range: {v.expected_yield_range || `${v.expected_yield_min}–${v.expected_yield_max} t/ha`}
                      </span>
                    </div>

                    <div className="vc-traits">
                      <span>🍬 {v.sucrose_pct || v.sucrose}% sucrose</span>
                      <span>⏱ {v.duration || v.duration_months}</span>
                      <span>🌱 {v.maturity || v.maturity_type}</span>
                    </div>

                    <div className="vc-states">
                      {(v.states || (typeof v.recommended_states === 'string' ? v.recommended_states.split(',') : [])).slice(0, 3).map(s => (
                        <span key={s} className="vc-state-tag">{s.trim()}</span>
                      ))}
                    </div>

                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Risk: <strong>{v.risk || v.risk_level}</strong></span>
                      <span style={{ color: '#0f766e', fontWeight: 600 }}>Condition: {v.crop_condition || 'Good'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Cultivar Full Profile Drawer/Panel */}
            {detail && (
              <div className="dash-panel" style={{ marginTop: 24, borderTop: `4px solid ${getColor(detail.variety_code || detail.code || 'Co 86032')}` }}>
                <div className="dash-panel-header">
                  <h3 style={{ color: getColor(detail.variety_code || detail.code || 'Co 86032'), margin: 0 }}>
                    {detail.name} — Agronomic Profile & Characteristics
                  </h3>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn-sm btn-primary"
                      onClick={() => navigate(`/prediction?variety=${encodeURIComponent(detail.variety_code || detail.code || 'Co 86032')}`)}
                    >
                      🌾 Forecast Yield with {detail.variety_code || detail.code} →
                    </button>
                    <button className="link-btn" onClick={() => setDetail(null)}>Close</button>
                  </div>
                </div>

                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 20 }}>
                  {detail.description}
                </p>

                <div className="dash-two-col">
                  <div>
                    <div className="variety-detail-grid">
                      {[
                        ['Cultivar Code',        detail.variety_code || detail.code],
                        ['Breeding Origin',      detail.origin],
                        ['Maturity Class',       detail.maturity || detail.maturity_type],
                        ['Growth Cycle',         detail.duration || detail.duration_months],
                        ['Expected Yield',       `${detail.avg_yield || detail.expected_yield} t/ha`],
                        ['Yield Range',          detail.expected_yield_range || `${detail.expected_yield_min}–${detail.expected_yield_max} t/ha`],
                        ['Sucrose Content',      `${detail.sucrose_pct || detail.sucrose}% Commercial Sugar`],
                        ['Soil Suitability',     detail.soil_suitability],
                        ['Weather Suitability',  detail.weather_suitability],
                        ['Growth Traits',        detail.growth_characteristics],
                        ['Disease Resistance',   detail.disease_resistance],
                        ['Drought Resilience',   detail.drought_tolerance],
                        ['Agronomic Risk',       detail.risk || detail.risk_level],
                      ].map(([k, val]) => (
                        <div key={k} className="vd-row">
                          <span className="vd-key">{k}</span>
                          <span className="vd-val">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h4 style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>Agronomic Performance Radar</h4>
                    <ResponsiveContainer width="100%" height={240}>
                      <RadarChart data={radarData(detail)}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} />
                        <Radar
                          name={detail.name}
                          dataKey="value"
                          stroke={getColor(detail.variety_code || detail.code || 'Co 86032')}
                          fill={getColor(detail.variety_code || detail.code || 'Co 86032')}
                          fillOpacity={0.25}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── TAB 2: SIDE-BY-SIDE COMPARISON ─── */}
        {tab === 'compare' && (
          <>
            {!comparison ? (
              <div className="empty-page-state">
                <div className="eps-icon">🔬</div>
                <h2>No Comparison Configured</h2>
                <p>Select at least 2 varieties from the cultivars list to view a multi-dimensional comparison.</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSelected(['Co 86032', 'Co 0238', 'CoM 0265']);
                    runComparison();
                  }}
                >
                  Load Benchmark Comparison (Co 86032 vs Co 0238 vs CoM 0265) →
                </button>
              </div>
            ) : (
              <>
                {/* Bar chart comparison */}
                <div className="dash-panel" style={{ marginBottom: 20 }}>
                  <div className="dash-panel-header">
                    <h3>Expected Yield Potential Comparison</h3>
                    <span className="badge badge-green">Trained Agronomic Potentials</span>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={comparison.comparison} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="code" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 11 }} unit=" t/ha" domain={[0, 160]} />
                      <Tooltip formatter={(v) => [`${v} t/ha`, 'Expected Yield']} />
                      <Bar dataKey="expected_yield" name="Expected Yield (t/ha)" radius={[4, 4, 0, 0]} fill="#2d7a3e">
                        {comparison.comparison.map(entry => (
                          <Cell key={entry.code} fill={getColor(entry.code)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Comprehensive Multi-Criteria Comparison Table */}
                <div className="dash-panel">
                  <div className="dash-panel-header">
                    <div>
                      <h3>Comprehensive Agronomic Dimension Matrix</h3>
                      <p className="text-xs text-gray-500">Comparison across all 6 core evaluation axes.</p>
                    </div>
                  </div>

                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '22%' }}>Evaluation Axis</th>
                          {comparison.comparison.map(v => (
                            <th key={v.code} style={{ color: getColor(v.code), width: `${78 / comparison.comparison.length}%` }}>
                              {v.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['1. Expected Yield',         v => `${v.expected_yield} t/ha (${v.expected_yield_range || '90-140 t/ha'})`],
                          ['2. Soil Suitability',       v => v.soil_suitability],
                          ['3. Weather Suitability',    v => v.weather_suitability],
                          ['4. Growth Characteristics', v => v.growth_characteristics],
                          ['5. Crop Condition',         v => v.crop_condition || 'Normal'],
                          ['6. Risk Level',             v => (
                            <span className={`status-badge status-${(v.risk || 'low').toLowerCase()}`}>
                              {v.risk || 'Low'}
                            </span>
                          )],
                          ['Sucrose Recovery (%)',      v => `${v.sucrose_pct}% Commercial Sugar`],
                          ['Drought Resilience',        v => v.drought_tolerance],
                          ['Disease Resistance',        v => v.disease_resistance],
                          ['Harvest Window',            v => v.duration_months],
                        ].map(([label, fn]) => (
                          <tr key={label}>
                            <td className="td-bold" style={{ background: '#f8fafc' }}>{label}</td>
                            {comparison.comparison.map(v => (
                              <td key={v.code} style={{ verticalAlign: 'top', lineHeight: 1.4 }}>
                                {fn(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {comparison.recommended && (
                    <div style={{ marginTop: 16, padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#166534', fontSize: 14 }}>
                          🏆 Highest Potential Yield: {comparison.recommended}
                        </strong>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#15803d' }}>
                          Provides optimal expected yield under favorable agronomic conditions.
                        </p>
                      </div>
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => navigate(`/prediction?variety=${encodeURIComponent(comparison.recommended)}`)}
                      >
                        Forecast with {comparison.recommended} →
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ─── TAB 3: AI VARIETY RECOMMENDATION ─── */}
        {tab === 'recommend' && (
          <>
            {/* Input Form Panel */}
            <div className="dash-panel" style={{ marginBottom: 24 }}>
              <div className="dash-panel-header">
                <div>
                  <h3>AI Cultivar Recommendation Engine</h3>
                  <p className="text-xs text-gray-500">Evaluates soil composition, regional climate, and moisture stress tolerance.</p>
                </div>
                {selectedField && (
                  <span className="badge badge-green">
                    Auto-Filled from Field: {selectedField.name}
                  </span>
                )}
              </div>

              {/* Mandatory Agricultural Disclaimer */}
              <div style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '12px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
                ⚠️ <strong>Advisory Note:</strong> These variety recommendations are model-based decision support estimates derived from regional agronomic characteristics and historical trial performances — not guaranteed agricultural advice. Local soil tests and agricultural extension guidelines should always be consulted.
              </div>

              <div className="rec-form-grid">
                <div className="form-group">
                  <label>Farm Location / State</label>
                  <input
                    type="text"
                    placeholder="e.g., Kolhapur, Maharashtra"
                    value={recForm.farm_location}
                    onChange={e => setRecForm(p => ({ ...p, farm_location: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Soil Type</label>
                  <select
                    value={recForm.soil_type}
                    onChange={e => setRecForm(p => ({ ...p, soil_type: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    <option value="Black Cotton Soil">Black Cotton Soil</option>
                    <option value="Alluvial Soil">Alluvial Soil</option>
                    <option value="Red Laterite Soil">Red Laterite Soil</option>
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Soil pH</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="7.0"
                    value={recForm.soil_ph}
                    onChange={e => setRecForm(p => ({ ...p, soil_ph: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Soil Moisture (%)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="60"
                    value={recForm.soil_moisture}
                    onChange={e => setRecForm(p => ({ ...p, soil_moisture: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Annual Rainfall (mm)</label>
                  <input
                    type="number"
                    step="25"
                    placeholder="1200"
                    value={recForm.rainfall}
                    onChange={e => setRecForm(p => ({ ...p, rainfall: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Average Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="29.5"
                    value={recForm.temperature}
                    onChange={e => setRecForm(p => ({ ...p, temperature: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Humidity (%)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="70"
                    value={recForm.humidity}
                    onChange={e => setRecForm(p => ({ ...p, humidity: e.target.value }))}
                  />
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={runRecommend}
                disabled={recLoading}
                style={{ marginTop: 18, padding: '10px 24px', fontSize: 13 }}
              >
                {recLoading ? '🔄 Evaluating Cultivar Suitability…' : '🔬 Generate AI Variety Recommendation'}
              </button>
            </div>

            {/* Recommendation Ranked Cards with Rationale */}
            {recs.length > 0 && (
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <h3>Ranked Varieties for Evaluated Conditions</h3>
                  <span className="badge badge-green">Scored by Agronomic Match</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {recs.map((r, i) => (
                    <div
                      key={r.code || r.name}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderLeft: `5px solid ${getColor(r.code || r.name)}`,
                        borderRadius: 10,
                        padding: '18px 20px',
                        boxShadow: i === 0 ? '0 4px 14px rgba(0,0,0,0.06)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span style={{
                              background: i === 0 ? '#16a34a' : '#64748b',
                              color: '#fff',
                              borderRadius: 20,
                              padding: '2px 10px',
                              fontSize: 12,
                              fontWeight: 700
                            }}>
                              #{i + 1} {i === 0 ? 'TOP PICK' : 'ALTERNATIVE'}
                            </span>
                            <h4 style={{ margin: 0, fontSize: 18, color: '#1e293b' }}>{r.title || r.name}</h4>
                            <span className="badge badge-blue">{r.suitability}</span>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4b5563' }}>
                            {r.description}
                          </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 24, fontWeight: 800, color: '#2d7a3e' }}>
                            {r.expected_yield || r.predicted_yield} <span style={{ fontSize: 14, fontWeight: 500 }}>t/ha</span>
                          </div>
                          <span style={{ fontSize: 11, color: '#64748b' }}>
                            Compatibility Score: <strong>{r.compatibility_score || 88}%</strong>
                          </span>
                        </div>
                      </div>

                      {/* "Why This Variety Was Recommended" rationale */}
                      <div style={{
                        marginTop: 14,
                        padding: '10px 14px',
                        background: '#f8fafc',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                        color: '#334155',
                        lineHeight: 1.5
                      }}>
                        <strong style={{ color: '#0f766e', display: 'block', marginBottom: 3 }}>
                          💡 Why this variety was recommended:
                        </strong>
                        {r.why_recommended || `High yield stability under regional climate with strong resistance to adverse moisture swings.`}
                      </div>

                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
                          <span>Risk: <strong>{r.risk || 'Low'}</strong></span>
                          <span>Drought: <strong>{r.drought_tolerance || 'High'}</strong></span>
                          <span>Disease: <strong>{r.disease_resistance || 'Moderate'}</strong></span>
                        </div>

                        <button
                          className="btn-sm btn-outline"
                          onClick={() => navigate(`/prediction?variety=${encodeURIComponent(r.code || r.name)}`)}
                        >
                          Forecast with {r.code || r.name} →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
