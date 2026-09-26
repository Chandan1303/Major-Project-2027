import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';

const soilProfiles = [
  {
    id: 1, name: 'North Block', type: 'Black Cotton Soil', ph: 6.8, moisture: 62,
    N: 185, P: 68, K: 90, organic: 1.8, suitability: 'Excellent',
    notes: 'Deep, self-mulching black soil. Excellent water retention. Ideal for sugarcane.',
  },
  {
    id: 2, name: 'South Plot', type: 'Red Laterite Soil', ph: 6.2, moisture: 48,
    N: 142, P: 55, K: 75, organic: 1.2, suitability: 'Good',
    notes: 'Moderate fertility. Good drainage. Needs regular NPK supplementation.',
  },
  {
    id: 3, name: 'East Field', type: 'Alluvial Soil', ph: 7.1, moisture: 70,
    N: 210, P: 80, K: 105, organic: 2.1, suitability: 'Excellent',
    notes: 'Rich alluvial deposits. Very high fertility. Low irrigation need.',
  },
];

const nutrients = [
  { name: 'Nitrogen (N)',   symbol: 'N',  value: 185, optimal: [150, 250], unit: 'kg/ha', color: '#2d7a3e' },
  { name: 'Phosphorus (P)', symbol: 'P',  value: 68,  optimal: [50, 100],  unit: 'kg/ha', color: '#3b82f6' },
  { name: 'Potassium (K)',  symbol: 'K',  value: 90,  optimal: [75, 150],  unit: 'kg/ha', color: '#f59e0b' },
  { name: 'Organic Matter', symbol: 'OM', value: 1.8, optimal: [1.5, 3],   unit: '%',     color: '#8b5cf6' },
];

function NutrientBar({ nutrient }) {
  const [min, max] = nutrient.optimal;
  const pct = Math.min((nutrient.value / max) * 80, 100);
  const optMin = (min / max) * 80;
  const optMax = 80;
  const status = nutrient.value >= min && nutrient.value <= max ? 'Optimal' : nutrient.value < min ? 'Low' : 'High';
  const statusColor = status === 'Optimal' ? '#16a34a' : status === 'Low' ? '#ca8a04' : '#dc2626';

  return (
    <div className="nutrient-row">
      <div className="nutrient-meta">
        <span className="nutrient-symbol" style={{ background: `${nutrient.color}22`, color: nutrient.color }}>{nutrient.symbol}</span>
        <div>
          <span className="nutrient-name">{nutrient.name}</span>
          <span className="nutrient-range">Optimal: {min}–{max} {nutrient.unit}</span>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <span className="nutrient-value">{nutrient.value} {nutrient.unit}</span>
          <span className="nutrient-status" style={{ color: statusColor }}>{status}</span>
        </div>
      </div>
      <div className="nutrient-bar-track">
        <div className="nutrient-opt-zone" style={{ left: `${optMin}%`, width: `${optMax - optMin}%` }} />
        <div className="nutrient-bar-fill" style={{ width: `${pct}%`, background: nutrient.color }} />
      </div>
    </div>
  );
}

export default function SoilPage() {
  const [selected, setSelected] = useState(soilProfiles[0]);

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Soil Intelligence</p>
            <h1 className="page-title">Soil Analysis</h1>
            <p className="page-subtitle">Comprehensive soil health, nutrient levels, and sugarcane suitability assessment.</p>
          </div>
        </div>

        {/* Profile selector */}
        <div className="profile-selector">
          {soilProfiles.map(p => (
            <button
              key={p.id}
              className={`profile-btn ${selected.id === p.id ? 'profile-btn-active' : ''}`}
              onClick={() => setSelected(p)}
            >
              <span>🪨</span> {p.name}
            </button>
          ))}
        </div>

        <div className="dash-two-col">
          {/* Soil Overview */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>{selected.name} — Soil Profile</h3>
              <span className={`status-badge status-${selected.suitability === 'Excellent' ? 'good' : 'moderate'}`}>
                {selected.suitability}
              </span>
            </div>
            <div className="soil-overview">
              <div className="soil-type-card">
                <span className="soil-emoji">🪨</span>
                <div>
                  <span className="soil-type-name">{selected.type}</span>
                  <span className="soil-notes">{selected.notes}</span>
                </div>
              </div>
              <div className="soil-metrics-grid">
                {[
                  { label: 'Soil pH',     value: selected.ph,       unit: '',   icon: '⚗️', color: selected.ph >= 6 && selected.ph <= 7.5 ? '#16a34a' : '#ca8a04' },
                  { label: 'Moisture',    value: `${selected.moisture}%`, unit: '', icon: '💧', color: '#3b82f6' },
                  { label: 'Organic',     value: `${selected.organic}%`,  unit: '', icon: '🌿', color: '#16a34a' },
                  { label: 'N (kg/ha)',   value: selected.N,        unit: '',   icon: '🔬', color: '#2d7a3e' },
                  { label: 'P (kg/ha)',   value: selected.P,        unit: '',   icon: '🔬', color: '#3b82f6' },
                  { label: 'K (kg/ha)',   value: selected.K,        unit: '',   icon: '🔬', color: '#f59e0b' },
                ].map(m => (
                  <div className="soil-metric" key={m.label}>
                    <span>{m.icon}</span>
                    <span className="sm-value" style={{ color: m.color }}>{m.value}</span>
                    <span className="sm-label">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* pH Gauge */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>pH Level Analysis</h3>
            </div>
            <div className="ph-gauge-wrap">
              <div className="ph-scale">
                {[4,5,6,7,8,9,10].map(v => (
                  <span key={v} className="ph-mark">{v}</span>
                ))}
              </div>
              <div className="ph-bar-track">
                <div className="ph-gradient" />
                <div className="ph-optimal-zone" />
                <div className="ph-needle" style={{ left: `${((selected.ph - 4) / 6) * 100}%` }} />
              </div>
              <div className="ph-labels">
                <span>Acidic</span><span>Neutral</span><span>Alkaline</span>
              </div>
              <div className="ph-summary">
                <div className="ph-value-big">{selected.ph}</div>
                <div>
                  <strong>{selected.ph >= 6 && selected.ph <= 7.5 ? 'Optimal for Sugarcane' : 'Outside Optimal Range'}</strong>
                  <p>Sugarcane grows best at pH 6.0–7.5. Current pH is {selected.ph >= 6 && selected.ph <= 7.5 ? 'within' : 'outside'} the optimal range.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nutrient Analysis */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <h3>Nutrient Profile</h3>
            <span className="badge badge-green">NPK Analysis</span>
          </div>
          <div className="nutrients-list">
            {nutrients.map(n => <NutrientBar key={n.name} nutrient={{ ...n, value: selected[n.symbol] || n.value }} />)}
          </div>
        </div>

        {/* Suitability */}
        <div className="dash-panel suitability-panel">
          <h3>Sugarcane Suitability Assessment</h3>
          <div className="suitability-grid">
            {[
              { factor: 'Soil Type',        rating: 5, note: `${selected.type} is highly suitable` },
              { factor: 'pH Level',         rating: selected.ph >= 6 && selected.ph <= 7.5 ? 5 : 3, note: `pH ${selected.ph} — ${selected.ph >= 6 && selected.ph <= 7.5 ? 'Optimal' : 'Needs adjustment'}` },
              { factor: 'Moisture',         rating: selected.moisture >= 50 ? 4 : 3, note: `${selected.moisture}% — ${selected.moisture >= 50 ? 'Good' : 'May need irrigation'}` },
              { factor: 'Nutrient Level',   rating: 4, note: 'NPK levels are adequate' },
              { factor: 'Organic Matter',   rating: selected.organic >= 1.5 ? 4 : 3, note: `${selected.organic}% organic matter` },
            ].map(s => (
              <div className="suitability-item" key={s.factor}>
                <span className="suit-factor">{s.factor}</span>
                <div className="suit-stars">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} style={{ color: i <= s.rating ? '#f59e0b' : '#e5e7eb', fontSize: 18 }}>★</span>
                  ))}
                </div>
                <span className="suit-note">{s.note}</span>
              </div>
            ))}
          </div>
          <div className="suit-impact">
            <h4>Impact on Expected Yield</h4>
            <p>Based on current soil conditions at <strong>{selected.name}</strong>, soil factors contribute a <strong>+8–12% yield improvement</strong> compared to suboptimal soil conditions. The {selected.type} profile with pH {selected.ph} is particularly well-suited for sugarcane cultivation.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
