import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';

const featureImportance = [
  { feature: 'NDVI Value',              importance: 0.28, impact: 'positive', icon: '🌿' },
  { feature: 'Annual Rainfall (mm)',    importance: 0.22, impact: 'positive', icon: '🌧️' },
  { feature: 'Soil Nitrogen (N)',       importance: 0.18, impact: 'positive', icon: '🔬' },
  { feature: 'Temperature (°C)',        importance: 0.12, impact: 'positive', icon: '🌡️' },
  { feature: 'Soil Potassium (K)',      importance: 0.08, impact: 'positive', icon: '🔬' },
  { feature: 'Irrigation Frequency',   importance: 0.06, impact: 'positive', icon: '💧' },
  { feature: 'Soil pH',                importance: 0.04, impact: 'positive', icon: '⚗️' },
  { feature: 'Previous Year Yield',    importance: 0.02, impact: 'positive', icon: '📊' },
];

const positiveFactors = [
  { label: 'NDVI 0.74', note: 'Vegetation index indicates healthy crop canopy. +11% yield boost.' },
  { label: 'Rainfall 1200mm', note: 'Annual rainfall is within optimal range (1200–1500mm).' },
  { label: 'Soil N: 185 kg/ha', note: 'Nitrogen levels are excellent, supporting vigorous growth.' },
  { label: 'Temperature 28°C', note: 'Average temperature is ideal for sucrose accumulation.' },
];

const negativeFactors = [
  { label: 'Soil pH 6.8', note: 'Slightly above optimal. Minor impact on phosphorus availability.' },
  { label: 'Irrigation 4×/mo', note: 'Could be increased to 5× during dry spells for better yield.' },
  { label: 'Prev Yield 65 t/ha', note: 'Below potential maximum. Soil depletion may be a factor.' },
];

const models = [
  { name: 'XGBoost',         pred: 72.4, weight: 0.35, color: '#2d7a3e' },
  { name: 'Random Forest',   pred: 70.8, weight: 0.28, color: '#1a73e8' },
  { name: 'Gradient Boost',  pred: 73.1, weight: 0.20, color: '#f59e0b' },
  { name: 'Linear Reg.',     pred: 69.5, weight: 0.10, color: '#8b5cf6' },
  { name: 'Ridge Reg.',      pred: 71.2, weight: 0.07, color: '#ef4444' },
];

const ensemblePred = models.reduce((sum, m) => sum + m.pred * m.weight, 0).toFixed(1);

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState('explanation');

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Explainable AI</p>
            <h1 className="page-title">AI Prediction Insights</h1>
            <p className="page-subtitle">Understand exactly why the model predicted a given yield — full transparency.</p>
          </div>
          <span className="badge badge-purple">🤖 XGBoost + Ensemble</span>
        </div>

        {/* Prediction Summary */}
        <div className="insight-hero">
          <div className="insight-main-pred">
            <span className="imp-label">Ensemble Predicted Yield</span>
            <span className="imp-value">{ensemblePred} <span className="imp-unit">t/ha</span></span>
            <span className="imp-conf">89.1% confidence · Median aggregation</span>
          </div>
          <div className="insight-conf-bar-wrap">
            <span className="icbw-label">Prediction Confidence</span>
            <div className="insight-conf-bar">
              <div className="icb-fill" style={{ width: '89.1%' }} />
              <span className="icb-value">89.1%</span>
            </div>
            <div className="icbw-range">
              <span>Uncertainty band: 68.1 – 76.7 t/ha</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {[
            { id: 'explanation', label: '🧠 Why This Prediction' },
            { id: 'features',    label: '📊 Feature Importance' },
            { id: 'models',      label: '🔬 Model Breakdown' },
          ].map(t => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'explanation' && (
          <div>
            <div className="dash-two-col">
              <div className="dash-panel factors-panel">
                <div className="dash-panel-header">
                  <h3>✅ Positive Factors</h3>
                  <span className="badge badge-green">Boosting Yield</span>
                </div>
                <div className="factors-list">
                  {positiveFactors.map(f => (
                    <div className="factor-item factor-pos" key={f.label}>
                      <span className="fi-icon">✓</span>
                      <div>
                        <strong>{f.label}</strong>
                        <p>{f.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dash-panel factors-panel">
                <div className="dash-panel-header">
                  <h3>⚠️ Limiting Factors</h3>
                  <span className="badge badge-yellow">Reducing Yield</span>
                </div>
                <div className="factors-list">
                  {negativeFactors.map(f => (
                    <div className="factor-item factor-neg" key={f.label}>
                      <span className="fi-icon">!</span>
                      <div>
                        <strong>{f.label}</strong>
                        <p>{f.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="dash-panel">
              <h3>Model Explanation Summary</h3>
              <div className="explanation-text">
                <p>The model predicted <strong>{ensemblePred} t/ha</strong> for <strong>Co 86032</strong> in <strong>Maharashtra (Kharif season)</strong> based on the following reasoning:</p>
                <p>🌿 <strong>NDVI (0.74)</strong> was the most influential factor, indicating a healthy, dense crop canopy which is a strong predictor of high photosynthetic activity and sugar accumulation. This single factor contributed approximately <strong>+18% above baseline</strong> yield.</p>
                <p>🌧️ <strong>Rainfall (1200mm)</strong> placed the crop in the optimal range for sugarcane. The temporal distribution of rainfall during the grand growth phase was particularly favorable.</p>
                <p>🔬 <strong>Soil nitrogen at 185 kg/ha</strong> exceeded the minimum threshold of 150 kg/ha, indicating well-fertilized soils supporting tillering and stem elongation.</p>
                <p>⚠️ The primary yield-limiting factor was <strong>irrigation frequency (4×/month)</strong>, which the model identified as slightly below the recommended 5× during the current summer phase.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Feature Importance — XGBoost Model</h3>
              <span className="badge badge-green">SHAP Values</span>
            </div>
            <div className="feature-importance-chart">
              {featureImportance.map((f, i) => (
                <div key={f.feature} className="fi-row" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="fi-meta">
                    <span className="fi-rank">#{i + 1}</span>
                    <span>{f.icon}</span>
                    <span className="fi-feature-name">{f.feature}</span>
                  </div>
                  <div className="fi-bar-track">
                    <div
                      className="fi-bar-fill"
                      style={{ width: `${f.importance * 300}%`, background: `hsl(${130 - i * 12}, 60%, 45%)` }}
                    />
                  </div>
                  <span className="fi-pct">{(f.importance * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div>
            <div className="dash-panel">
              <div className="dash-panel-header">
                <h3>Individual Model Predictions</h3>
                <span className="badge badge-blue">5-Model Ensemble</span>
              </div>
              <div className="model-predictions">
                {models.map(m => (
                  <div className="model-pred-row" key={m.name}>
                    <span className="mpr-name" style={{ color: m.color }}>{m.name}</span>
                    <div className="mpr-bar-track">
                      <div className="mpr-bar" style={{ width: `${(m.pred / 100) * 100}%`, background: m.color }} />
                    </div>
                    <span className="mpr-pred">{m.pred} t/ha</span>
                    <span className="mpr-weight">weight: {(m.weight * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              <div className="ensemble-result">
                <span>📊 Weighted Median (MEDIAN aggregation)</span>
                <strong>{ensemblePred} t/ha</strong>
              </div>
            </div>

            <div className="dash-panel">
              <h3>Model Performance Metrics</h3>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Model</th><th>R² Score</th><th>RMSE (t/ha)</th><th>MAE</th><th>Weight</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'XGBoost',        r2: 0.876, rmse: 11.8, mae: 9.2,  w: 0.35 },
                      { name: 'Random Forest',  r2: 0.862, rmse: 12.4, mae: 9.8,  w: 0.28 },
                      { name: 'Gradient Boost', r2: 0.881, rmse: 11.5, mae: 8.9,  w: 0.20 },
                      { name: 'Linear Reg.',    r2: 0.784, rmse: 15.1, mae: 12.3, w: 0.10 },
                      { name: 'Ridge Reg.',     r2: 0.791, rmse: 14.8, mae: 11.9, w: 0.07 },
                    ].map(m => (
                      <tr key={m.name}>
                        <td className="td-bold">{m.name}</td>
                        <td className="td-green">{m.r2.toFixed(3)}</td>
                        <td>{m.rmse}</td>
                        <td>{m.mae}</td>
                        <td>{(m.w * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
