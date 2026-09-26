import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';

const ndviHistory = [
  { month: 'Apr 26', ndvi: 0.41, health: 'Moderate' },
  { month: 'May 26', ndvi: 0.55, health: 'Good' },
  { month: 'Jun 26', ndvi: 0.63, health: 'Good' },
  { month: 'Jul 26', ndvi: 0.70, health: 'Healthy' },
  { month: 'Aug 26', ndvi: 0.76, health: 'Healthy' },
  { month: 'Sep 26', ndvi: 0.74, health: 'Healthy' },
];

const zones = [
  { id: 'Z1', name: 'North Block',  area: '4.5 ha', ndvi: 0.78, health: 'Healthy',  pct: 78 },
  { id: 'Z2', name: 'South Plot',   area: '2.8 ha', ndvi: 0.65, health: 'Good',     pct: 65 },
  { id: 'Z3', name: 'East Field',   area: '6.1 ha', ndvi: 0.48, health: 'Moderate', pct: 48 },
  { id: 'Z4', name: 'West Block',   area: '3.3 ha', ndvi: 0.82, health: 'Healthy',  pct: 82 },
];

function healthColor(h) {
  if (h === 'Healthy') return '#16a34a';
  if (h === 'Good')    return '#65a30d';
  if (h === 'Moderate') return '#ca8a04';
  return '#dc2626';
}

export default function CropHealthPage() {
  const [activeZone, setActiveZone] = useState('Z1');
  const zone = zones.find(z => z.id === activeZone);

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Satellite Monitoring</p>
            <h1 className="page-title">Crop Health & NDVI</h1>
            <p className="page-subtitle">Vegetation health via Sentinel-2 satellite imagery and NDVI analysis.</p>
          </div>
          <span className="badge badge-green">🛰️ Live Satellite Data</span>
        </div>

        {/* Current NDVI Overview */}
        <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))' }}>
          {[
            { label: 'Current NDVI',   value: '0.74',     icon: '🌿', color: '#16a34a' },
            { label: 'Health Status',  value: 'Healthy',  icon: '💚', color: '#16a34a' },
            { label: 'Growth Stage',   value: 'Grand Growth', icon: '📈', color: '#2d7a3e' },
            { label: 'Stressed Area',  value: '12%',      icon: '⚠️', color: '#ca8a04' },
            { label: 'Last Updated',   value: '6h ago',   icon: '🔄', color: '#6366f1' },
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
          {/* NDVI Map Placeholder */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>NDVI Satellite Map</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-blue">Sentinel-2</span>
                <span className="badge badge-green">Sep 2026</span>
              </div>
            </div>
            <div className="ndvi-map-visual">
              <div className="ndvi-map-grid">
                {zones.map(z => (
                  <div
                    key={z.id}
                    className={`map-zone ${activeZone === z.id ? 'map-zone-active' : ''}`}
                    style={{ background: `${healthColor(z.health)}22`, borderColor: healthColor(z.health) }}
                    onClick={() => setActiveZone(z.id)}
                  >
                    <span className="map-zone-label">{z.name}</span>
                    <span className="map-zone-ndvi" style={{ color: healthColor(z.health) }}>NDVI {z.ndvi}</span>
                    <span className={`status-badge status-${z.health.toLowerCase()}`}>{z.health}</span>
                  </div>
                ))}
              </div>
              <div className="ndvi-map-legend">
                <span style={{ color: '#16a34a' }}>■</span> Healthy (0.7+)
                <span style={{ color: '#65a30d', marginLeft: 12 }}>■</span> Good (0.6–0.7)
                <span style={{ color: '#ca8a04', marginLeft: 12 }}>■</span> Moderate (0.4–0.6)
                <span style={{ color: '#dc2626', marginLeft: 12 }}>■</span> Stressed (&lt;0.4)
              </div>
            </div>
          </div>

          {/* Zone Detail */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Zone Detail — {zone.name}</h3>
            </div>
            <div className="zone-detail">
              <div className="zone-ndvi-ring">
                <svg viewBox="0 0 120 120" width="120" height="120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={healthColor(zone.health)} strokeWidth="12"
                    strokeDasharray={`${zone.pct * 3.14} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                  <text x="60" y="55" textAnchor="middle" fontSize="20" fontWeight="700" fill={healthColor(zone.health)}>{zone.ndvi}</text>
                  <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#6b7280">NDVI</text>
                </svg>
              </div>
              <div className="zone-stats">
                <div className="zone-stat"><span>Area</span><strong>{zone.area}</strong></div>
                <div className="zone-stat"><span>Health</span><strong style={{ color: healthColor(zone.health) }}>{zone.health}</strong></div>
                <div className="zone-stat"><span>NDVI Value</span><strong>{zone.ndvi}</strong></div>
                <div className="zone-stat"><span>Crop Stage</span><strong>Grand Growth</strong></div>
                <div className="zone-stat"><span>Stress Risk</span><strong>Low</strong></div>
              </div>
            </div>

            {/* Zone selector */}
            <div className="zone-selector">
              {zones.map(z => (
                <button
                  key={z.id}
                  className={`zone-btn ${activeZone === z.id ? 'zone-btn-active' : ''}`}
                  style={activeZone === z.id ? { background: healthColor(z.health), borderColor: healthColor(z.health) } : {}}
                  onClick={() => setActiveZone(z.id)}
                >
                  {z.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Historical NDVI */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <h3>Historical NDVI Trend</h3>
            <span className="badge badge-green">6 Month View</span>
          </div>
          <div className="ndvi-line-chart">
            <div className="line-chart-area">
              <svg viewBox="0 0 600 160" style={{ width: '100%', height: 160 }}>
                <defs>
                  <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2d7a3e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#2d7a3e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0.3, 0.5, 0.7, 0.9].map((v, i) => (
                  <line key={i} x1="0" y1={160 - v * 160} x2="600" y2={160 - v * 160}
                    stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                ))}
                {/* Fill */}
                <path
                  d={`M ${ndviHistory.map((d, i) => `${i * 100 + 50},${160 - d.ndvi * 160}`).join(' L ')} L ${(ndviHistory.length - 1) * 100 + 50},160 L 50,160 Z`}
                  fill="url(#ndviGrad)"
                />
                {/* Line */}
                <polyline
                  points={ndviHistory.map((d, i) => `${i * 100 + 50},${160 - d.ndvi * 160}`).join(' ')}
                  fill="none" stroke="#2d7a3e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                />
                {/* Dots */}
                {ndviHistory.map((d, i) => (
                  <circle key={i} cx={i * 100 + 50} cy={160 - d.ndvi * 160} r="5"
                    fill="white" stroke="#2d7a3e" strokeWidth="2.5" />
                ))}
              </svg>
            </div>
            <div className="line-chart-labels">
              {ndviHistory.map(d => (
                <div key={d.month} className="lc-label">
                  <span>{d.month}</span>
                  <span className="lc-val">{d.ndvi}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
