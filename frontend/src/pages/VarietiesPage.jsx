import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import AppLayout from '../components/AppLayout';
import { varietyApi, farmApi } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

export default function VarietiesPage() {
  const [varieties, setVarieties]   = useState([]);
  const [selected, setSelected]     = useState([]);
  const [comparison, setComparison] = useState(null);
  const [recs, setRecs]             = useState([]);
  const [tab, setTab]               = useState('all');
  const [detail, setDetail]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [farms, setFarms]           = useState([]);
  const [recForm, setRecForm]       = useState({ soil_type: 'Black Cotton Soil', soil_ph: '6.8', rainfall: '1200', temperature: '28', humidity: '65', soil_moisture: '62', state: 'Maharashtra' });

  useEffect(() => {
    Promise.all([varietyApi.list(), farmApi.list()])
      .then(([vr, fr]) => {
        setVarieties(vr.data?.varieties || []);
        setFarms(fr.data?.farms || []);
      }).catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (name) => {
    setSelected(prev => prev.includes(name) ? prev.filter(x => x !== name) : prev.length < 3 ? [...prev, name] : prev);
  };

  const runComparison = async () => {
    if (selected.length < 2) return toast.error('Select at least 2 varieties to compare.');
    try {
      const r = await varietyApi.compare({ variety_names: selected });
      setComparison(r.data);
      setTab('compare');
    } catch (e) { toast.error(e.message); }
  };

  const runRecommend = async () => {
    setRecLoading(true);
    try {
      const r = await varietyApi.recommend(recForm);
      setRecs(r.data?.recommendations || []);
      setTab('recommend');
    } catch (e) { toast.error(e.message); }
    finally { setRecLoading(false); }
  };

  const COLOR_MAP = { 'Co 86032': '#2d7a3e', 'Co 0238': '#1a73e8', 'CoC 671': '#7b1fa2', 'Co 99004': '#f59e0b', 'CoM 0265': '#ef4444' };
  const getColor = (name) => COLOR_MAP[name] || '#6b7280';

  const radarData = (v) => [
    { subject: 'Yield',    value: v.avg_yield || 0 },
    { subject: 'Disease',  value: (v.disease || 3) * 20 },
    { subject: 'Drought',  value: (v.drought || 3) * 20 },
    { subject: 'Flood',    value: (v.flood   || 3) * 20 },
    { subject: 'Sucrose',  value: (v.sucrose || 10) * 8 },
  ];

  if (loading) return <AppLayout><div className="page-loading-center"><div className="loading-spinner" /><p>Loading varieties…</p></div></AppLayout>;

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Variety Intelligence</p>
            <h1 className="page-title">Sugarcane Variety Intelligence</h1>
            <p className="page-subtitle">Compare varieties, analyse yield potential, and get AI-powered recommendations.</p>
          </div>
          {selected.length >= 2 && (
            <button className="btn-primary" onClick={runComparison}>Compare {selected.length} Varieties →</button>
          )}
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {[{id:'all',label:'All Varieties'},{id:'compare',label:'Comparison'},{id:'recommend',label:'AI Recommendation'}].map(t => (
            <button key={t.id} className={`tab-btn ${tab===t.id?'tab-btn-active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {tab === 'all' && (
          <>
            <p className="page-hint">Select up to 3 varieties to compare side-by-side.</p>
            <div className="variety-cards-grid">
              {varieties.map(v => (
                <div key={v.name} className={`variety-card ${selected.includes(v.name) ? 'variety-card-selected' : ''}`}
                  style={{ '--var-color': getColor(v.name) }}
                  onClick={() => { toggleSelect(v.name); setDetail(v); }}>
                  <div className="vc-header">
                    <span className="vc-name">{v.name}</span>
                    <span className="vc-check">{selected.includes(v.name) ? '✓' : '+'}</span>
                  </div>
                  <p className="vc-origin">{v.origin}</p>
                  <div className="vc-yield"><span className="vc-yield-val">{v.avg_yield}</span><span className="vc-yield-unit">avg t/ha</span></div>
                  <div className="vc-traits">
                    <span>🍬 {v.sucrose}% sucrose</span>
                    <span>⏱ {v.duration}</span>
                    <span>🌱 {v.maturity}</span>
                  </div>
                  <div className="vc-states">
                    {(v.states || []).slice(0, 3).map(s => <span key={s} className="vc-state-tag">{s}</span>)}
                  </div>
                  <div className="vc-rating-row">
                    {[{l:'Disease',v:v.disease},{l:'Drought',v:v.drought},{l:'Flood',v:v.flood}].map(r => (
                      <div key={r.l} className="vc-rating">
                        <span className="vc-rating-label">{r.l}</span>
                        <div className="vc-dots">{[1,2,3,4,5].map(i => <span key={i} className={`vc-dot ${i <= r.v ? 'vc-dot-on' : ''}`} style={i<=r.v?{background:getColor(v.name)}:{}} />)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Detail panel */}
            {detail && (
              <div className="dash-panel" style={{ borderTop: `3px solid ${getColor(detail.name)}` }}>
                <div className="dash-panel-header">
                  <h3 style={{ color: getColor(detail.name) }}>{detail.name} — Full Profile</h3>
                  <button className="link-btn" onClick={() => setDetail(null)}>Close</button>
                </div>
                <p style={{ fontSize: 14, color: '#374151', marginBottom: 20 }}>{detail.description}</p>
                <div className="dash-two-col">
                  <div>
                    <div className="variety-detail-grid">
                      {[
                        ['Origin',         detail.origin],
                        ['Zone',           detail.zone],
                        ['Maturity',       detail.maturity],
                        ['Duration',       detail.duration],
                        ['Avg Yield',      `${detail.avg_yield} t/ha`],
                        ['Max Yield',      `${detail.max_yield} t/ha`],
                        ['Sucrose',        `${detail.sucrose}%`],
                        ['pH Range',       detail.ph_range],
                        ['Seasons',        (detail.seasons||[]).join(', ')],
                        ['Ratoon',         detail.ratoon],
                        ['Soil Types',     (detail.soil_types||[]).join(', ')],
                        ['States',         (detail.states||[]).join(', ')],
                      ].map(([k,val]) => (
                        <div key={k} className="vd-row"><span className="vd-key">{k}</span><span className="vd-val">{val}</span></div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData(detail)}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} />
                        <Radar name={detail.name} dataKey="value" stroke={getColor(detail.name)} fill={getColor(detail.name)} fillOpacity={0.25} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'compare' && (
          <>
            {!comparison ? (
              <div className="empty-page-state">
                <div className="eps-icon">🔬</div>
                <h2>No Comparison Yet</h2>
                <p>Go to All Varieties, select 2–3 varieties, then click Compare.</p>
                <button className="btn-primary" onClick={() => setTab('all')}>Select Varieties →</button>
              </div>
            ) : (
              <>
                {/* Bar chart comparison */}
                <div className="dash-panel">
                  <div className="dash-panel-header"><h3>Predicted Yield Comparison</h3><span className="badge badge-green">AI Model</span></div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={comparison.comparison} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit=" t/ha" />
                      <Tooltip formatter={(v) => [`${v} t/ha`]} />
                      <Bar dataKey="ml_predicted_yield" name="Predicted Yield" radius={[4,4,0,0]}
                        fill="#2d7a3e" label={{ position:'top', fontSize:11, formatter:v=>`${v}` }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Comparison table */}
                <div className="dash-panel">
                  <div className="dash-panel-header"><h3>Side-by-Side Comparison</h3></div>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Attribute</th>
                          {comparison.comparison.map(v => <th key={v.name} style={{ color: getColor(v.name) }}>{v.name}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['Expected Yield',      v => `${v.expected_yield || v.avg_yield || v.ml_predicted_yield} t/ha`],
                          ['Soil Suitability',    v => v.soil_suitability || (v.soil_types ? v.soil_types.join(', ') : 'Black cotton & Alluvial soils')],
                          ['Weather Suitability', v => v.weather_suitability || 'Tropical 28–34°C with moderate humidity'],
                          ['Growth Traits',       v => v.growth_characteristics || `${v.maturity || 'Mid-Late'} maturing, robust ratoonability`],
                          ['Crop Condition',      v => v.crop_condition || 'Normal to Excellent'],
                          ['Risk Level',          v => v.risk || v.risk_level || v.ml_risk || 'Low'],
                          ['Sucrose %',          v => `${v.sucrose || v.sucrose_pct}%`],
                          ['Maturity Type',      v => v.maturity || v.maturity_type || 'Mid-Late'],
                          ['Duration',           v => v.duration || v.duration_months || '12-14 months'],
                          ['Disease Resistance', v => typeof v.disease_resistance === 'string' ? v.disease_resistance : '⭐'.repeat(v.disease||4)],
                          ['Drought Tolerance',  v => v.drought_tolerance || 'High'],
                        ].map(([label, fn]) => (
                          <tr key={label}>
                            <td className="td-bold">{label}</td>
                            {comparison.comparison.map(v => <td key={v.name || v.code}>{fn(v)}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {comparison.recommended && (
                    <div className="recommend-banner">
                      🏆 <strong>AI Recommendation: {comparison.recommended}</strong> gives the highest predicted yield under your current conditions.
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'recommend' && (
          <>
            <div className="dash-panel">
              <div className="dash-panel-header"><h3>AI Variety Recommendation</h3><span className="badge badge-purple">ML-Powered</span></div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Enter your field conditions to get the best variety recommendation.</p>
              <div className="rec-form-grid">
                {[
                  { label:'State', key:'state', type:'text', ph:'e.g., Maharashtra' },
                  { label:'Soil Type', key:'soil_type', type:'text', ph:'e.g., Black Cotton Soil' },
                  { label:'Soil pH', key:'soil_ph', type:'number', ph:'6.8' },
                  { label:'Rainfall (mm)', key:'rainfall', type:'number', ph:'1200' },
                  { label:'Temperature (°C)', key:'temperature', type:'number', ph:'28' },
                  { label:'Humidity (%)', key:'humidity', type:'number', ph:'65' },
                  { label:'Soil Moisture (%)', key:'soil_moisture', type:'number', ph:'62' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label>{f.label}</label>
                    <input type={f.type} placeholder={f.ph} value={recForm[f.key]} onChange={e => setRecForm(p => ({...p, [f.key]: e.target.value}))} />
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={runRecommend} disabled={recLoading} style={{ marginTop: 16 }}>
                {recLoading ? '🔄 Analysing…' : '🔬 Get AI Recommendation'}
              </button>
            </div>

            {recs.length > 0 && (
              <div className="dash-panel">
                <div className="dash-panel-header"><h3>Recommended Varieties for Your Conditions</h3></div>
                <div className="rec-results">
                  {recs.map((r, i) => (
                    <div key={r.name} className={`rec-row ${i === 0 ? 'rec-top' : ''}`} style={{ '--rec-color': getColor(r.name) }}>
                      <div className="rec-rank">#{i+1}</div>
                      <div className="rec-info">
                        <span className="rec-name">{r.name}</span>
                        <span className="rec-detail">{r.description?.slice(0, 80)}…</span>
                      </div>
                      <div className="rec-metrics">
                        <span className="rec-yield">{r.predicted_yield || r.avg_yield} t/ha</span>
                        <span className={`status-badge status-${(r.suitability||r.risk||'good').toLowerCase() === 'high' ? 'good' : 'moderate'}`}>{r.suitability || r.risk}</span>
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
