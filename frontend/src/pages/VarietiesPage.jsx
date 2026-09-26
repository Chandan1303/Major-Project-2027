import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';

const varieties = [
  {
    id: 'Co86032',
    name: 'Co 86032',
    origin: 'ICAR-SBI, Coimbatore',
    states: ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh'],
    avgYield: 72,
    maxYield: 85,
    duration: '12–14 months',
    ratoon: 'Excellent',
    soilTypes: ['Black Cotton', 'Alluvial', 'Red Laterite'],
    phRange: '6.0–7.5',
    seasons: ['Kharif', 'Summer'],
    drought: 3, flood: 4, disease: 4, pest: 4,
    sugarContent: 10.8,
    color: '#2d7a3e',
    desc: 'Most widely cultivated variety in India. High yield, excellent ratoon ability, broad adaptability.',
  },
  {
    id: 'Co0238',
    name: 'Co 0238',
    origin: 'ICAR-SBI, Coimbatore',
    states: ['Uttar Pradesh', 'Maharashtra', 'Haryana', 'Punjab'],
    avgYield: 78,
    maxYield: 92,
    duration: '11–13 months',
    ratoon: 'Good',
    soilTypes: ['Alluvial', 'Sandy Loam'],
    phRange: '6.5–8.0',
    seasons: ['Rabi', 'Summer'],
    drought: 4, flood: 3, disease: 5, pest: 4,
    sugarContent: 11.2,
    color: '#1a73e8',
    desc: 'High sugar content variety dominant in North India. Disease-resistant and early-maturing.',
  },
  {
    id: 'CoC671',
    name: 'CoC 671',
    origin: 'ICAR-SBI, Coimbatore',
    states: ['Tamil Nadu', 'Maharashtra', 'Andhra Pradesh'],
    avgYield: 69,
    maxYield: 82,
    duration: '12 months',
    ratoon: 'Excellent',
    soilTypes: ['Red Laterite', 'Sandy Loam', 'Black Cotton'],
    phRange: '5.5–7.0',
    seasons: ['Kharif', 'Summer'],
    drought: 4, flood: 3, disease: 4, pest: 3,
    sugarContent: 10.5,
    color: '#7b1fa2',
    desc: 'Drought-tolerant mid-season variety widely grown in South India. Good ratoon performance.',
  },
  {
    id: 'Co99004',
    name: 'Co 99004',
    origin: 'ICAR-SBI, Coimbatore',
    states: ['Karnataka', 'Tamil Nadu'],
    avgYield: 71,
    maxYield: 86,
    duration: '12–14 months',
    ratoon: 'Good',
    soilTypes: ['Black Cotton', 'Alluvial'],
    phRange: '6.0–7.5',
    seasons: ['Kharif'],
    drought: 3, flood: 4, disease: 4, pest: 4,
    sugarContent: 10.9,
    color: '#f59e0b',
    desc: 'Mid-late variety with good commercial recovery and adaptability to varied soil conditions.',
  },
  {
    id: 'CoM0265',
    name: 'CoM 0265',
    origin: 'University of Agricultural Sciences, Dharwad',
    states: ['Karnataka'],
    avgYield: 74,
    maxYield: 88,
    duration: '12–13 months',
    ratoon: 'Very Good',
    soilTypes: ['Red Laterite', 'Black Cotton'],
    phRange: '6.0–7.5',
    seasons: ['Kharif', 'Summer'],
    drought: 4, flood: 3, disease: 5, pest: 4,
    sugarContent: 11.0,
    color: '#ef4444',
    desc: 'Karnataka-specific high-yielding variety. Excellent disease resistance and high sugar content.',
  },
];

const metrics = [
  { key: 'avgYield',     label: 'Avg Yield (t/ha)', max: 100, unit: 't/ha' },
  { key: 'sugarContent', label: 'Sugar Content (%)', max: 15,  unit: '%' },
  { key: 'drought',      label: 'Drought Tolerance',max: 5,   unit: '/5' },
  { key: 'disease',      label: 'Disease Resistance',max: 5,  unit: '/5' },
];

function RatingDots({ value, max = 5, color }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{
          width: 10, height: 10, borderRadius: '50%',
          background: i < value ? color : '#e5e7eb',
          display: 'inline-block', flexShrink: 0
        }} />
      ))}
    </div>
  );
}

export default function VarietiesPage() {
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const comparingVarieties = selected.map(id => varieties.find(v => v.id === id));

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Varietal Intelligence</p>
            <h1 className="page-title">Sugarcane Variety Comparison</h1>
            <p className="page-subtitle">Compare Co 86032, Co 0238, CoC 671, Co 99004, CoM 0265 and more.</p>
          </div>
        </div>

        <p className="page-hint">Select up to 3 varieties to compare side-by-side.</p>

        {/* Variety Cards */}
        <div className="variety-cards-grid">
          {varieties.map(v => (
            <div
              key={v.id}
              className={`variety-card ${selected.includes(v.id) ? 'variety-card-selected' : ''}`}
              style={{ '--var-color': v.color }}
              onClick={() => { setDetail(v); toggleSelect(v.id); }}
            >
              <div className="vc-header">
                <span className="vc-name">{v.name}</span>
                <span className="vc-check">{selected.includes(v.id) ? '✓' : '+'}</span>
              </div>
              <p className="vc-origin">{v.origin}</p>
              <div className="vc-yield">
                <span className="vc-yield-val">{v.avgYield}</span>
                <span className="vc-yield-unit">avg t/ha</span>
              </div>
              <div className="vc-traits">
                <span>🍬 {v.sugarContent}% sugar</span>
                <span>⏱ {v.duration}</span>
              </div>
              <div className="vc-states">
                {v.states.slice(0, 3).map(s => (
                  <span key={s} className="vc-state-tag">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        {comparingVarieties.length >= 2 && (
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Side-by-Side Comparison</h3>
              <button className="link-btn" onClick={() => setSelected([])}>Clear all</button>
            </div>
            <div className="table-wrap">
              <table className="data-table compare-table">
                <thead>
                  <tr>
                    <th>Attribute</th>
                    {comparingVarieties.map(v => (
                      <th key={v.id} style={{ color: v.color }}>{v.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Origin', key: 'origin' },
                    { label: 'Avg Yield (t/ha)', key: 'avgYield' },
                    { label: 'Max Yield (t/ha)', key: 'maxYield' },
                    { label: 'Sugar Content', render: v => `${v.sugarContent}%` },
                    { label: 'Duration', key: 'duration' },
                    { label: 'Ratoon Ability', key: 'ratoon' },
                    { label: 'pH Range', key: 'phRange' },
                    { label: 'Seasons', render: v => v.seasons.join(', ') },
                    { label: 'Drought Tolerance', render: v => <RatingDots value={v.drought} color={v.color} /> },
                    { label: 'Disease Resistance', render: v => <RatingDots value={v.disease} color={v.color} /> },
                    { label: 'Flood Tolerance', render: v => <RatingDots value={v.flood} color={v.color} /> },
                    { label: 'Soil Types', render: v => v.soilTypes.join(', ') },
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="td-bold">{row.label}</td>
                      {comparingVarieties.map(v => (
                        <td key={v.id}>{row.render ? row.render(v) : v[row.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bar chart comparison */}
            <div className="compare-chart-grid">
              {metrics.map(m => (
                <div key={m.key} className="compare-chart-item">
                  <h4>{m.label}</h4>
                  {comparingVarieties.map(v => (
                    <div key={v.id} className="compare-bar-row">
                      <span className="cbr-label">{v.name}</span>
                      <div className="cbr-track">
                        <div
                          className="cbr-fill"
                          style={{ width: `${(v[m.key] / m.max) * 100}%`, background: v.color }}
                        />
                      </div>
                      <span className="cbr-val">{v[m.key]}{m.unit}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {detail && (
          <div className="dash-panel variety-detail-panel">
            <div className="dash-panel-header">
              <h3 style={{ color: detail.color }}>{detail.name} — Full Profile</h3>
              <button className="link-btn" onClick={() => setDetail(null)}>Close</button>
            </div>
            <p className="variety-detail-desc">{detail.desc}</p>
            <div className="variety-detail-grid">
              <div><strong>Origin:</strong> {detail.origin}</div>
              <div><strong>Duration:</strong> {detail.duration}</div>
              <div><strong>Seasons:</strong> {detail.seasons.join(', ')}</div>
              <div><strong>Ratoon:</strong> {detail.ratoon}</div>
              <div><strong>Sugar Content:</strong> {detail.sugarContent}%</div>
              <div><strong>pH Range:</strong> {detail.phRange}</div>
              <div><strong>Soil Types:</strong> {detail.soilTypes.join(', ')}</div>
              <div><strong>States:</strong> {detail.states.join(', ')}</div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
