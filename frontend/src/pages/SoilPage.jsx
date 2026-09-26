import React, { useEffect, useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import AppLayout from '../components/AppLayout';
import { soilApi } from '../services/api';

function ScoreRing({ score, label, color }) {
  const r = 54, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <svg viewBox="0 0 120 120" width="120" height="120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="800" fill={color}>{score}</text>
      <text x="60" y="72" textAnchor="middle" fontSize="8" fill="#9ca3af">{label}</text>
    </svg>
  );
}

export default function SoilPage() {
  const [data, setData]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    soilApi.getAll().then(r => {
      const d = r.data;
      setData(d);
      if (d?.fields?.length) setSelected(d.fields[0]);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><div className="page-loading-center"><div className="loading-spinner" /><p>Loading soil analysis…</p></div></AppLayout>;

  if (error || !data?.fields?.length) return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div><p className="eyebrow">Soil Intelligence</p><h1 className="page-title">Soil Analysis</h1></div>
        </div>
        <div className="empty-page-state">
          <div className="eps-icon">🪨</div>
          <h2>No Field Data Found</h2>
          <p>Add fields with soil data to see analysis here.</p>
        </div>
      </div>
    </AppLayout>
  );

  const f = selected;
  const healthColor = f?.health_score >= 80 ? '#16a34a' : f?.health_score >= 65 ? '#f59e0b' : '#ef4444';

  const radarData = f ? [
    { subject: 'pH',       value: f.health_score >= 80 ? 90 : 60 },
    { subject: 'Moisture', value: Math.min(100, Number(f.soil_moisture) + 10) },
    { subject: 'Suitability', value: f.suitability==='Highly Suitable'?95:f.suitability==='Suitable'?75:50 },
    { subject: 'Health',   value: f.health_score },
    { subject: 'pH Range', value: f.ph_status==='Optimal' ? 90 : 55 },
  ] : [];

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Soil Intelligence</p>
            <h1 className="page-title">Soil Analysis</h1>
            <p className="page-subtitle">Field-level soil health, pH, moisture, and sugarcane suitability assessment.</p>
          </div>
        </div>

        {/* Summary */}
        {data.summary && (
          <div className="stats-grid-4">
            {[
              { icon: '📊', label: 'Avg Health Score', value: data.summary.avg_health_score, color: '#2d7a3e' },
              { icon: '✅', label: 'Health Status',     value: data.summary.health_label,     color: '#16a34a' },
              { icon: '🌿', label: 'Excellent Fields',  value: data.summary.excellent_count,  color: '#065f46' },
              { icon: '⚠️', label: 'Needs Attention',  value: data.summary.needs_attention,   color: '#ef4444' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ '--card-accent': s.color }}>
                <div className="sc-icon">{s.icon}</div>
                <div className="sc-body"><span className="sc-label">{s.label}</span><span className="sc-value">{s.value}</span></div>
              </div>
            ))}
          </div>
        )}

        {/* Field selector */}
        <div className="profile-selector">
          {data.fields.map(field => (
            <button key={field.id} className={`profile-btn ${selected?.id === field.id ? 'profile-btn-active' : ''}`} onClick={() => setSelected(field)}>
              🪨 {field.name} <span className="profile-btn-sub">{field.farm_name}</span>
            </button>
          ))}
        </div>

        {f && (
          <div className="dash-two-col">
            {/* Soil profile */}
            <div className="dash-panel">
              <div className="dash-panel-header">
                <h3>{f.name} — Soil Profile</h3>
                <span className={`status-badge status-${f.health_label?.toLowerCase() === 'excellent' ? 'good' : 'moderate'}`}>{f.health_label}</span>
              </div>
              <div className="soil-overview">
                <div className="soil-type-card">
                  <span className="soil-emoji">🪨</span>
                  <div>
                    <span className="soil-type-name">{f.soil_type}</span>
                    <span className="soil-notes">Suitability: <strong>{f.suitability}</strong></span>
                  </div>
                </div>
                <div className="soil-metrics-grid">
                  {[
                    { label: 'Soil pH',    value: Number(f.soil_ph).toFixed(1),      icon: '⚗️', color: f.ph_status==='Optimal'?'#16a34a':'#f59e0b' },
                    { label: 'Moisture',   value: `${Number(f.soil_moisture).toFixed(0)}%`, icon: '💧', color: '#3b82f6' },
                    { label: 'Health',     value: `${f.health_score}/100`,           icon: '💚', color: healthColor },
                    { label: 'pH Status',  value: f.ph_status,                       icon: '✓',  color: f.ph_status==='Optimal'?'#16a34a':'#f59e0b' },
                    { label: 'Moisture Status', value: f.moisture_status,            icon: '📊', color: '#3b82f6' },
                    { label: 'Suitability',value: f.suitability,                     icon: '🌾', color: '#2d7a3e' },
                  ].map(m => (
                    <div key={m.label} className="soil-metric">
                      <span>{m.icon}</span>
                      <span className="sm-value" style={{ color: m.color }}>{m.value}</span>
                      <span className="sm-label">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score breakdown */}
              {f.score_breakdown && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Score Breakdown</h4>
                  {Object.entries(f.score_breakdown).map(([k, v]) => (
                    <div key={k} className="score-breakdown-row">
                      <span>{k.charAt(0).toUpperCase()+k.slice(1)}</span>
                      <div className="sbr-track"><div className="sbr-fill" style={{ width: `${(v/25)*100}%`, background: '#2d7a3e' }} /></div>
                      <span>{v}/25</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Radar + Score ring */}
            <div className="dash-panel">
              <div className="dash-panel-header"><h3>Soil Health Overview</h3></div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
                <ScoreRing score={f.health_score} label="HEALTH SCORE" color={healthColor} />
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0,100]} tick={{ fontSize: 9 }} />
                    <Radar name="Soil" dataKey="value" stroke="#2d7a3e" fill="#2d7a3e" fillOpacity={0.25} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* pH Guide */}
        <div className="dash-panel">
          <div className="dash-panel-header"><h3>pH Level Reference for Sugarcane</h3></div>
          <div className="ph-guide-row">
            {[
              { range: '< 5.5',   label: 'Strongly Acidic', note: 'Lime required — Al/Mn toxicity risk', color: '#dc2626' },
              { range: '5.5–6.0', label: 'Acidic',          note: 'Apply lime — moderate impact',         color: '#f59e0b' },
              { range: '6.0–7.5', label: 'Optimal',         note: 'Best range for sugarcane growth',      color: '#16a34a' },
              { range: '7.5–8.0', label: 'Slightly Alkaline',note: 'Minor impact — monitor pH',           color: '#f59e0b' },
              { range: '> 8.0',   label: 'Alkaline',         note: 'Gypsum / sulfur required',            color: '#dc2626' },
            ].map(p => (
              <div key={p.range} className="ph-guide-item" style={{ borderTop: `3px solid ${p.color}` }}>
                <span className="ph-guide-range" style={{ color: p.color }}>{p.range}</span>
                <span className="ph-guide-label">{p.label}</span>
                <span className="ph-guide-note">{p.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
