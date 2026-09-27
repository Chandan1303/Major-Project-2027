import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';

const vigorHistory = [
  { month: 'Apr 26', vigor: 62, health: 'Moderate', stage: 'Germination' },
  { month: 'May 26', vigor: 74, health: 'Good', stage: 'Tillering' },
  { month: 'Jun 26', vigor: 82, health: 'Good', stage: 'Tillering' },
  { month: 'Jul 26', vigor: 89, health: 'Healthy', stage: 'Grand Growth' },
  { month: 'Aug 26', vigor: 94, health: 'Healthy', stage: 'Grand Growth' },
  { month: 'Sep 26', vigor: 91, health: 'Healthy', stage: 'Grand Growth' },
];

const zones = [
  { id: 'Z1', name: 'North Block',  area: '4.5 ha', vigor: 92, health: 'Healthy',  soilMoisture: 65, ph: 7.2 },
  { id: 'Z2', name: 'South Plot',   area: '2.8 ha', vigor: 84, health: 'Good',     soilMoisture: 58, ph: 6.8 },
  { id: 'Z3', name: 'East Field',   area: '6.1 ha', vigor: 68, health: 'Moderate', soilMoisture: 48, ph: 6.5 },
  { id: 'Z4', name: 'West Block',   area: '3.3 ha', vigor: 95, health: 'Healthy',  soilMoisture: 68, ph: 7.4 },
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
            <p className="eyebrow">Agronomic Telemetry</p>
            <h1 className="page-title">Crop Health & Canopy Vigor</h1>
            <p className="page-subtitle">Field parcel health via ground sensors, soil moisture telemetry, and phenology staging.</p>
          </div>
          <span className="badge badge-green">🌿 Ground Sensor Telemetry</span>
        </div>

        {/* Current Overview */}
        <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))' }}>
          {[
            { label: 'Canopy Vigor Index', value: '91/100', icon: '🌿', color: '#16a34a' },
            { label: 'Crop Health Status', value: 'Healthy', icon: '💚', color: '#16a34a' },
            { label: 'Growth Stage',       value: 'Grand Growth', icon: '📈', color: '#2d7a3e' },
            { label: 'Moisture Stress',    value: 'Low (8%)', icon: '💧', color: '#3b82f6' },
            { label: 'Last Evaluated',     value: 'Today', icon: '🔄', color: '#6366f1' },
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
          {/* Parcel Vigor Map */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Field Parcel Health Matrix</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-blue">Ground Sensors</span>
                <span className="badge badge-green">Season 2026</span>
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
                    <span className="map-zone-ndvi" style={{ color: healthColor(z.health) }}>Vigor {z.vigor}%</span>
                    <span className={`status-badge status-${z.health.toLowerCase()}`}>{z.health}</span>
                  </div>
                ))}
              </div>
              <div className="ndvi-map-legend">
                <span style={{ color: '#16a34a' }}>■</span> Excellent (&gt;85%)
                <span style={{ color: '#65a30d', marginLeft: 12 }}>■</span> Good (75–85%)
                <span style={{ color: '#ca8a04', marginLeft: 12 }}>■</span> Moderate (60–75%)
                <span style={{ color: '#dc2626', marginLeft: 12 }}>■</span> Stressed (&lt;60%)
              </div>
            </div>
          </div>

          {/* Zone Detail */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Zone Detail — {zone.name}</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <small style={{ color: '#64748b' }}>Area</small>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{zone.area}</div>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <small style={{ color: '#64748b' }}>Health Evaluation</small>
                <div style={{ fontSize: 18, fontWeight: 700, color: healthColor(zone.health) }}>{zone.health}</div>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <small style={{ color: '#64748b' }}>Soil Moisture</small>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#2563eb' }}>{zone.soilMoisture}%</div>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <small style={{ color: '#64748b' }}>Soil pH</small>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>{zone.ph}</div>
              </div>
            </div>

            <h4 style={{ marginTop: 20, marginBottom: 10 }}>Vigor Progression Across Growth Stages</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {vigorHistory.map(v => (
                <div key={v.month} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ minWidth: 60 }}>{v.month}</span>
                  <span style={{ color: '#64748b', fontSize: 12 }}>{v.stage}</span>
                  <div style={{ flex: 1, margin: '0 12px', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${v.vigor}%`, height: '100%', background: healthColor(v.health) }} />
                  </div>
                  <span style={{ fontWeight: 600, minWidth: 40, textAlign: 'right' }}>{v.vigor}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
