import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';

const lossFactors = [
  { factor: 'Drought Stress',       impact: -8.2,  category: 'weather', icon: '🔆' },
  { factor: 'High Temperature',     impact: -3.4,  category: 'weather', icon: '🌡️' },
  { factor: 'Pest Infestation',     impact: -5.1,  category: 'biotic',  icon: '🐛' },
  { factor: 'Soil Nutrient Deficit',impact: -4.8,  category: 'soil',    icon: '🪨' },
  { factor: 'Waterlogging',         impact: -2.1,  category: 'weather', icon: '💧' },
  { factor: 'Disease (Smut)',       impact: -1.9,  category: 'biotic',  icon: '🦠' },
  { factor: 'Optimal NDVI',         impact: +6.3,  category: 'positive',icon: '🌿' },
  { factor: 'Good Soil pH',         impact: +4.1,  category: 'positive',icon: '⚗️' },
];

const fields = [
  { field: 'North Block', expected: 75, actual: 71.2, area: 4.5, variety: 'Co 86032' },
  { field: 'South Plot',  expected: 70, actual: 65.8, area: 2.8, variety: 'CoC 671' },
  { field: 'East Field',  expected: 68, actual: 58.3, area: 6.1, variety: 'CoM 0265' },
  { field: 'West Block',  expected: 72, actual: 74.6, area: 3.3, variety: 'Co 0238' },
];

const categoryColors = {
  weather:  '#3b82f6',
  biotic:   '#ef4444',
  soil:     '#92400e',
  positive: '#16a34a',
};

export default function YieldLossPage() {
  const [activeField, setActiveField] = useState(fields[0]);
  const loss = activeField.expected - activeField.actual;
  const lossPct = ((loss / activeField.expected) * 100).toFixed(1);
  const totalProduction = (activeField.actual * activeField.area).toFixed(1);

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Loss Intelligence</p>
            <h1 className="page-title">Yield & Loss Analysis</h1>
            <p className="page-subtitle">Predicted vs actual yield, estimated losses, and root cause analysis.</p>
          </div>
        </div>

        {/* Field Selector */}
        <div className="profile-selector">
          {fields.map(f => (
            <button
              key={f.field}
              className={`profile-btn ${activeField.field === f.field ? 'profile-btn-active' : ''}`}
              onClick={() => setActiveField(f)}
            >
              🏡 {f.field}
            </button>
          ))}
        </div>

        {/* Loss Summary */}
        <div className="summary-grid">
          {[
            { icon: '🎯', label: 'Expected Yield',    value: `${activeField.expected} t/ha`,  color: '#6366f1' },
            { icon: '🌾', label: 'Actual Yield',       value: `${activeField.actual} t/ha`,   color: loss > 0 ? '#ca8a04' : '#16a34a' },
            { icon: '📉', label: 'Yield Loss',         value: `${Math.abs(loss).toFixed(1)} t/ha`, color: loss > 0 ? '#ef4444' : '#16a34a' },
            { icon: '📊', label: 'Loss Percentage',    value: `${Math.abs(lossPct)}%`,         color: loss > 0 ? '#ef4444' : '#16a34a' },
            { icon: '📦', label: 'Total Production',   value: `${totalProduction} t`,          color: '#2d7a3e' },
            { icon: '🌿', label: 'Variety',            value: activeField.variety,             color: '#7b1fa2' },
          ].map(c => (
            <div className="summary-card" key={c.label} style={{ '--card-accent': c.color }}>
              <div className="sc-icon">{c.icon}</div>
              <div className="sc-body">
                <span className="sc-label">{c.label}</span>
                <span className="sc-value">{c.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="dash-two-col">
          {/* Predicted vs Actual Chart */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Predicted vs Actual Yield</h3>
            </div>
            <div className="yield-compare-chart">
              <div className="ycc-bars">
                <div className="ycc-bar-group">
                  <div className="ycc-bar ycc-expected" style={{ height: `${(activeField.expected / 100) * 200}px` }}>
                    <span className="ycc-label">{activeField.expected}</span>
                  </div>
                  <span className="ycc-bar-label">Expected</span>
                </div>
                <div className="ycc-bar-group">
                  <div
                    className="ycc-bar ycc-actual"
                    style={{
                      height: `${(activeField.actual / 100) * 200}px`,
                      background: activeField.actual >= activeField.expected ? '#16a34a' : '#f59e0b'
                    }}
                  >
                    <span className="ycc-label">{activeField.actual}</span>
                  </div>
                  <span className="ycc-bar-label">Actual</span>
                </div>
              </div>
              <div className="ycc-unit">t/ha</div>
              <div className="ycc-diff" style={{ color: loss > 0 ? '#ef4444' : '#16a34a' }}>
                {loss > 0 ? `▼ ${loss.toFixed(1)} t/ha below expected` : `▲ ${Math.abs(loss).toFixed(1)} t/ha above expected`}
              </div>
            </div>
          </div>

          {/* All Fields Comparison */}
          <div className="dash-panel">
            <div className="dash-panel-header"><h3>All Fields Overview</h3></div>
            <div className="all-fields-list">
              {fields.map(f => {
                const fl = f.expected - f.actual;
                const flPct = ((fl / f.expected) * 100).toFixed(1);
                return (
                  <div key={f.field} className={`field-loss-row ${activeField.field === f.field ? 'flr-active' : ''}`}
                    onClick={() => setActiveField(f)}>
                    <div>
                      <span className="flr-name">{f.field}</span>
                      <span className="flr-variety">{f.variety}</span>
                    </div>
                    <div className="flr-bar-wrap">
                      <div className="flr-track">
                        <div className="flr-expected-bar" style={{ width: `${f.expected}%` }} />
                        <div className="flr-actual-bar" style={{ width: `${(f.actual / f.expected) * 100}%`, background: fl > 0 ? '#f59e0b' : '#16a34a' }} />
                      </div>
                    </div>
                    <span className={`flr-pct ${fl > 0 ? 'flr-loss' : 'flr-gain'}`}>
                      {fl > 0 ? `▼ ${flPct}%` : `▲ ${Math.abs(flPct)}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loss Factors */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <h3>Major Factors Affecting Yield</h3>
          </div>
          <div className="loss-factors-grid">
            {lossFactors.map(f => (
              <div key={f.factor} className="loss-factor-card" style={{ '--lf-color': categoryColors[f.category] }}>
                <span className="lf-icon">{f.icon}</span>
                <div className="lf-body">
                  <span className="lf-name">{f.factor}</span>
                  <span className={`lf-impact ${f.impact < 0 ? 'lf-neg' : 'lf-pos'}`}>
                    {f.impact > 0 ? '+' : ''}{f.impact}% yield impact
                  </span>
                </div>
                <div className="lf-bar-wrap">
                  <div
                    className="lf-bar"
                    style={{
                      width: `${Math.abs(f.impact) * 8}%`,
                      background: f.impact < 0 ? '#ef4444' : '#16a34a'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
