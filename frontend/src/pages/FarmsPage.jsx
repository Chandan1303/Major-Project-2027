import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';

const initialFarms = [
  {
    id: 1,
    name: 'Krishna Sugarcane Farm',
    location: 'Kolhapur, Maharashtra',
    totalArea: 16.7,
    fields: [
      { id: 'f1', name: 'North Block',  area: 4.5, variety: 'Co 86032',  sowing: '2025-06-15', status: 'Grand Growth', ndvi: 0.78 },
      { id: 'f2', name: 'South Plot',   area: 2.8, variety: 'CoC 671',   sowing: '2025-07-01', status: 'Tillering',    ndvi: 0.65 },
      { id: 'f3', name: 'East Field',   area: 6.1, variety: 'CoM 0265',  sowing: '2025-06-20', status: 'Grand Growth', ndvi: 0.48 },
      { id: 'f4', name: 'West Block',   area: 3.3, variety: 'Co 0238',   sowing: '2025-05-30', status: 'Ripening',     ndvi: 0.82 },
    ],
  },
];

const cropStages = ['Germination', 'Tillering', 'Grand Growth', 'Ripening', 'Harvest Ready'];
const varieties = ['Co 86032', 'Co 0238', 'CoC 671', 'CoM 0265', 'Co 99004', 'CoJ 64'];
const statusColors = {
  'Germination': '#6366f1', 'Tillering': '#f59e0b',
  'Grand Growth': '#16a34a', 'Ripening': '#ef4444', 'Harvest Ready': '#2d7a3e'
};

function ndviColor(v) {
  if (v >= 0.7) return '#16a34a';
  if (v >= 0.5) return '#ca8a04';
  return '#dc2626';
}

export default function FarmsPage() {
  const [farms, setFarms] = useState(initialFarms);
  const [activeFarm, setActiveFarm] = useState(farms[0]);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [addFarmOpen, setAddFarmOpen] = useState(false);
  const [newField, setNewField] = useState({ name: '', area: '', variety: varieties[0], sowing: '', status: cropStages[0] });
  const [newFarm, setNewFarm] = useState({ name: '', location: '' });

  const handleAddField = () => {
    if (!newField.name || !newField.area) return;
    const field = {
      id: `f${Date.now()}`, ...newField, area: parseFloat(newField.area), ndvi: 0.55
    };
    const updated = farms.map(f =>
      f.id === activeFarm.id ? { ...f, fields: [...f.fields, field], totalArea: f.totalArea + field.area } : f
    );
    setFarms(updated);
    setActiveFarm(updated.find(f => f.id === activeFarm.id));
    setNewField({ name: '', area: '', variety: varieties[0], sowing: '', status: cropStages[0] });
    setAddFieldOpen(false);
  };

  const handleAddFarm = () => {
    if (!newFarm.name || !newFarm.location) return;
    const farm = { id: Date.now(), ...newFarm, totalArea: 0, fields: [] };
    setFarms([...farms, farm]);
    setActiveFarm(farm);
    setNewFarm({ name: '', location: '' });
    setAddFarmOpen(false);
  };

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Farm Intelligence</p>
            <h1 className="page-title">Farm & Field Management</h1>
            <p className="page-subtitle">Track all your farms, fields, and crop progress in one place.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" onClick={() => setAddFarmOpen(true)}>+ Add Farm</button>
            <button className="btn-primary" onClick={() => setAddFieldOpen(true)}>+ Add Field</button>
          </div>
        </div>

        {/* Farm Selector */}
        <div className="profile-selector">
          {farms.map(f => (
            <button
              key={f.id}
              className={`profile-btn ${activeFarm.id === f.id ? 'profile-btn-active' : ''}`}
              onClick={() => setActiveFarm(f)}
            >
              🏡 {f.name}
            </button>
          ))}
        </div>

        {/* Farm Overview */}
        <div className="dash-panel farm-overview-panel">
          <div className="dash-panel-header">
            <div>
              <h3>{activeFarm.name}</h3>
              <span className="farm-location">📍 {activeFarm.location}</span>
            </div>
            <div className="farm-stats-row">
              <div className="farm-stat-pill">
                <span>{activeFarm.totalArea} ha</span>
                <span>Total Area</span>
              </div>
              <div className="farm-stat-pill">
                <span>{activeFarm.fields.length}</span>
                <span>Fields</span>
              </div>
            </div>
          </div>

          {activeFarm.fields.length === 0 ? (
            <div className="empty-state">
              <span>🏡</span>
              <p>No fields yet. Add your first field to get started.</p>
              <button className="btn-primary" onClick={() => setAddFieldOpen(true)}>+ Add Field</button>
            </div>
          ) : (
            <div className="fields-grid">
              {activeFarm.fields.map(field => {
                const sowingDate = field.sowing ? new Date(field.sowing) : null;
                const daysAgo = sowingDate ? Math.floor((Date.now() - sowingDate) / 86400000) : null;
                const progress = daysAgo ? Math.min(Math.round((daysAgo / 365) * 100), 100) : 0;
                return (
                  <div className="field-card" key={field.id}>
                    <div className="field-card-header">
                      <span className="field-name">{field.name}</span>
                      <span className="field-area">{field.area} ha</span>
                    </div>
                    <div className="field-variety">
                      <span className="variety-badge">{field.variety}</span>
                      <span
                        className="status-badge"
                        style={{ background: `${statusColors[field.status]}22`, color: statusColors[field.status] }}
                      >
                        {field.status}
                      </span>
                    </div>
                    {sowingDate && (
                      <div className="field-detail-row">
                        <span>📅 Sown: {sowingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>{daysAgo} days ago</span>
                      </div>
                    )}
                    {/* Crop Progress */}
                    <div className="crop-progress-wrap">
                      <div className="cp-label">
                        <span>Crop Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="cp-track">
                        <div className="cp-fill" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    {/* NDVI */}
                    <div className="field-ndvi-row">
                      <span>🛰️ NDVI</span>
                      <span style={{ fontWeight: 700, color: ndviColor(field.ndvi) }}>{field.ndvi}</span>
                      <span style={{ color: ndviColor(field.ndvi), fontSize: 12 }}>
                        {field.ndvi >= 0.7 ? 'Healthy' : field.ndvi >= 0.5 ? 'Moderate' : 'Stressed'}
                      </span>
                    </div>
                    {/* Stage Progress */}
                    <div className="stage-row">
                      {cropStages.map(s => (
                        <div
                          key={s}
                          className={`stage-dot ${s === field.status ? 'stage-active' : cropStages.indexOf(s) < cropStages.indexOf(field.status) ? 'stage-done' : ''}`}
                          title={s}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Field Modal */}
        {addFieldOpen && (
          <div className="modal-overlay" onClick={() => setAddFieldOpen(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Field</h3>
                <button className="modal-close" onClick={() => setAddFieldOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Field Name *</label>
                  <input placeholder="e.g., North Block" value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Area (Hectares) *</label>
                  <input type="number" placeholder="e.g., 4.5" value={newField.area} onChange={e => setNewField({ ...newField, area: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Variety</label>
                  <select value={newField.variety} onChange={e => setNewField({ ...newField, variety: e.target.value })}>
                    {varieties.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sowing / Planting Date</label>
                  <input type="date" value={newField.sowing} onChange={e => setNewField({ ...newField, sowing: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Crop Stage</label>
                  <select value={newField.status} onChange={e => setNewField({ ...newField, status: e.target.value })}>
                    {cropStages.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setAddFieldOpen(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleAddField}>Add Field</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Farm Modal */}
        {addFarmOpen && (
          <div className="modal-overlay" onClick={() => setAddFarmOpen(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Farm</h3>
                <button className="modal-close" onClick={() => setAddFarmOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Farm Name *</label>
                  <input placeholder="e.g., Krishna Sugarcane Farm" value={newFarm.name} onChange={e => setNewFarm({ ...newFarm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input placeholder="e.g., Kolhapur, Maharashtra" value={newFarm.location} onChange={e => setNewFarm({ ...newFarm, location: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setAddFarmOpen(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleAddFarm}>Add Farm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
