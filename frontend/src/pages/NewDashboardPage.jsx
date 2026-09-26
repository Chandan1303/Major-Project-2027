import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';

const summaryCards = [
  { icon: '🌾', label: 'Expected Yield',     value: '68.4 t/ha',  change: '+4.2%', up: true,  color: '#2d7a3e' },
  { icon: '💚', label: 'Crop Health',         value: 'Good',       change: 'NDVI 0.74', up: true,  color: '#16a34a' },
  { icon: '🌡️', label: 'Avg Temperature',    value: '28.3 °C',    change: 'Optimal',   up: true,  color: '#f59e0b' },
  { icon: '💧', label: 'Soil Moisture',       value: '62%',        change: 'Normal',    up: true,  color: '#3b82f6' },
  { icon: '🎯', label: 'Pred. Confidence',    value: '89.1%',      change: 'High',      up: true,  color: '#8b5cf6' },
  { icon: '📉', label: 'Est. Yield Loss',     value: '3.2%',       change: 'Low Risk',  up: false, color: '#ef4444' },
];

const recentPredictions = [
  { field: 'North Block — 4.5 ha', variety: 'Co 86032',   date: 'Sep 24, 2026', yield: '71.2 t/ha', confidence: '91%', status: 'good' },
  { field: 'South Plot — 2.8 ha',  variety: 'CoC 671',    date: 'Sep 22, 2026', yield: '65.8 t/ha', confidence: '87%', status: 'good' },
  { field: 'East Field — 6.1 ha',  variety: 'CoM 0265',   date: 'Sep 19, 2026', yield: '58.3 t/ha', confidence: '82%', status: 'moderate' },
  { field: 'West Block — 3.3 ha',  variety: 'Co 0238',    date: 'Sep 17, 2026', yield: '74.6 t/ha', confidence: '93%', status: 'good' },
];

const weatherToday = [
  { icon: '🌡️', label: 'Temperature', value: '29°C' },
  { icon: '💧', label: 'Humidity',    value: '68%' },
  { icon: '🌧️', label: 'Rainfall',   value: '12mm' },
  { icon: '💨', label: 'Wind',        value: '14 km/h' },
];

const NDVI_BARS = [
  { month: 'Apr', val: 0.41 }, { month: 'May', val: 0.55 }, { month: 'Jun', val: 0.63 },
  { month: 'Jul', val: 0.70 }, { month: 'Aug', val: 0.76 }, { month: 'Sep', val: 0.74 },
];

export default function NewDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] || 'Farmer';

  return (
    <AppLayout>
      <div className="page-container">
        {/* Welcome */}
        <div className="page-header">
          <div>
            <p className="eyebrow">AI Yield Forecasting Platform</p>
            <h1 className="page-title">Welcome back, {firstName} 👋</h1>
            <p className="page-subtitle">Here's your farm intelligence overview for today, Sep 26, 2026.</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/prediction')}>
            + New Prediction
          </button>
        </div>

        {/* Summary Cards */}
        <div className="summary-grid">
          {summaryCards.map((c) => (
            <div className="summary-card" key={c.label} style={{ '--card-accent': c.color }}>
              <div className="sc-icon">{c.icon}</div>
              <div className="sc-body">
                <span className="sc-label">{c.label}</span>
                <span className="sc-value">{c.value}</span>
                <span className={`sc-change ${c.up ? 'sc-up' : 'sc-down'}`}>{c.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="dash-two-col">
          {/* NDVI Chart */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>NDVI Trend — Last 6 Months</h3>
              <span className="badge badge-green">Satellite Data</span>
            </div>
            <div className="ndvi-chart">
              {NDVI_BARS.map((b) => (
                <div className="ndvi-bar-wrap" key={b.month}>
                  <div
                    className="ndvi-bar"
                    style={{ height: `${b.val * 100}%`, '--bar-h': b.val }}
                  >
                    <span className="ndvi-tip">{b.val}</span>
                  </div>
                  <span className="ndvi-month">{b.month}</span>
                </div>
              ))}
            </div>
            <div className="ndvi-legend">
              <span className="legend-dot dot-green" /> Healthy (&gt;0.6)
              <span className="legend-dot dot-yellow" style={{ marginLeft: 16 }} /> Moderate (0.4–0.6)
              <span className="legend-dot dot-red" style={{ marginLeft: 16 }} /> Stressed (&lt;0.4)
            </div>
          </div>

          {/* Weather */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Today's Weather</h3>
              <span className="badge badge-blue">Live</span>
            </div>
            <div className="weather-today">
              <div className="weather-main">
                <span className="weather-icon-big">⛅</span>
                <div>
                  <span className="weather-temp">29°C</span>
                  <span className="weather-desc">Partly Cloudy</span>
                </div>
              </div>
              <div className="weather-grid">
                {weatherToday.map(w => (
                  <div className="weather-tile" key={w.label}>
                    <span>{w.icon}</span>
                    <span className="wt-val">{w.value}</span>
                    <span className="wt-label">{w.label}</span>
                  </div>
                ))}
              </div>
              <div className="weather-impact">
                <span className="impact-icon">✅</span>
                <span>Conditions are <strong>optimal</strong> for sugarcane growth this week.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Predictions Table */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <h3>Recent Predictions</h3>
            <button className="link-btn" onClick={() => navigate('/prediction')}>Run new →</button>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Field / Area</th>
                  <th>Variety</th>
                  <th>Date</th>
                  <th>Predicted Yield</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPredictions.map((r) => (
                  <tr key={r.field}>
                    <td className="td-bold">{r.field}</td>
                    <td>{r.variety}</td>
                    <td className="td-muted">{r.date}</td>
                    <td className="td-bold td-green">{r.yield}</td>
                    <td>{r.confidence}</td>
                    <td>
                      <span className={`status-badge status-${r.status}`}>
                        {r.status === 'good' ? '✓ Good' : '~ Moderate'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          {[
            { icon: '🌾', label: 'Predict Yield',    path: '/prediction' },
            { icon: '🛰️', label: 'Crop Health',      path: '/crop-health' },
            { icon: '🪨', label: 'Soil Analysis',     path: '/soil' },
            { icon: '🔬', label: 'Compare Varieties', path: '/varieties' },
            { icon: '📄', label: 'Download Report',   path: '/reports' },
            { icon: '🏡', label: 'Manage Farms',      path: '/farms' },
          ].map(a => (
            <button className="qa-btn" key={a.label} onClick={() => navigate(a.path)}>
              <span>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
