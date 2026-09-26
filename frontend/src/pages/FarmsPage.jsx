import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { farmApi } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const VARIETIES = ['Co 86032', 'Co 0238', 'CoC 671', 'Co 99004', 'CoM 0265'];
const STAGES = ['Planting', 'Germination', 'Tillering', 'Grand Growth', 'Maturity', 'Harvest'];
const STAGE_DAYS = [0, 30, 60, 120, 270, 360];
const SOIL_TYPES = ['Black Cotton Soil', 'Alluvial Soil', 'Red Laterite Soil', 'Sandy Loam', 'Clay Loam', 'Loamy Soil'];
const STAGE_COLORS = {
  Planting: '#6366f1',
  Germination: '#0ea5e9',
  Tillering: '#f59e0b',
  'Grand Growth': '#16a34a',
  Maturity: '#ea580c',
  Harvest: '#2d7a3e'
};

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function FormGroup({ label, required, children }) {
  return (
    <div className="form-group">
      <label>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      {children}
    </div>
  );
}

export default function FarmsPage() {
  const navigate = useNavigate();
  const [farms, setFarms]           = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  // Modals
  const [farmModal, setFarmModal]     = useState(false);
  const [fieldModal, setFieldModal]   = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [editFarm, setEditFarm]       = useState(null);
  const [editField, setEditField]     = useState(null);
  const [viewField, setViewField]     = useState(null);

  // Forms
  const [farmForm, setFarmForm] = useState({ name: '', location: '', address: '', district: '', state: '', total_area: '' });
  const [fieldForm, setFieldForm] = useState({
    name: '', area: '', location: '', soil_type: SOIL_TYPES[0],
    soil_ph: '6.8', soil_moisture: '65', sugarcane_variety: VARIETIES[0], planting_date: ''
  });

  const loadFarms = async () => {
    setLoading(true);
    try {
      const r = await farmApi.list();
      const list = r.data?.farms || [];
      setFarms(list);
      if (list.length && !activeFarm) setActiveFarm(list[0]);
      else if (list.length && activeFarm) setActiveFarm(list.find(f => f.id === activeFarm.id) || list[0]);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFarms(); }, []);

  // Farm CRUD
  const openAddFarm  = () => {
    setEditFarm(null);
    setFarmForm({ name: '', location: '', address: '', district: '', state: 'Maharashtra', total_area: '' });
    setFarmModal(true);
  };

  const openEditFarm = (f) => {
    setEditFarm(f);
    setFarmForm({
      name: f.name,
      location: f.location,
      address: f.address || f.location || '',
      district: f.district || '',
      state: f.state || '',
      total_area: f.total_area
    });
    setFarmModal(true);
  };

  const saveFarm = async () => {
    if (!farmForm.name || !farmForm.location || !farmForm.total_area) {
      return toast.error('Farm name, location, and total area are required.');
    }
    setSaving(true);
    try {
      if (editFarm) {
        await farmApi.update(editFarm.id, farmForm);
        toast.success('Farm updated successfully!');
      } else {
        await farmApi.create(farmForm);
        toast.success('Farm created successfully!');
      }
      setFarmModal(false);
      await loadFarms();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteFarm = async (id) => {
    if (!confirm('Are you sure you want to delete this farm and all its fields?')) return;
    try {
      await farmApi.remove(id);
      toast.success('Farm deleted.');
      await loadFarms();
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Field CRUD
  const openAddField = () => {
    setEditField(null);
    setFieldForm({
      name: '',
      area: '',
      location: activeFarm?.location || '',
      soil_type: SOIL_TYPES[0],
      soil_ph: '6.8',
      soil_moisture: '65',
      sugarcane_variety: VARIETIES[0],
      planting_date: new Date().toISOString().split('T')[0]
    });
    setFieldModal(true);
  };

  const openEditField = (f) => {
    setEditField(f);
    setFieldForm({
      name: f.name,
      area: f.area,
      location: f.location,
      soil_type: f.soil_type,
      soil_ph: f.soil_ph,
      soil_moisture: f.soil_moisture,
      sugarcane_variety: f.sugarcane_variety,
      planting_date: f.planting_date?.split('T')[0] || f.planting_date || ''
    });
    setFieldModal(true);
  };

  const openViewDetails = (f) => {
    setViewField(f);
    setDetailModal(true);
  };

  const saveField = async () => {
    if (!fieldForm.name || !fieldForm.area || !fieldForm.planting_date) {
      return toast.error('Field name, area, and planting date are required.');
    }
    setSaving(true);
    try {
      if (editField) {
        await farmApi.updateField(activeFarm.id, editField.id, fieldForm);
        toast.success('Field updated successfully!');
      } else {
        await farmApi.addField(activeFarm.id, fieldForm);
        toast.success('Field added successfully!');
      }
      setFieldModal(false);
      await loadFarms();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteField = async (fieldId) => {
    if (!confirm('Delete this field? Associated crop and soil records will be removed.')) return;
    try {
      await farmApi.removeField(activeFarm.id, fieldId);
      toast.success('Field deleted.');
      await loadFarms();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const daysAgo = (dateStr) => {
    if (!dateStr) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(dateStr)) / 86400000));
  };

  const getStageAndProgress = (plantingDate, moisture = 65) => {
    const days = daysAgo(plantingDate);
    let stageIdx = 0;
    for (let i = STAGE_DAYS.length - 1; i >= 0; i--) {
      if (days >= STAGE_DAYS[i]) {
        stageIdx = i;
        break;
      }
    }
    const currentStage = STAGES[stageIdx];
    const progressPct = Math.min(100, Math.round((days / 360) * 100));

    let condition = 'Good';
    if (moisture < 45) condition = 'Stressed';
    else if (moisture >= 60 && moisture <= 75) condition = 'Excellent';
    else if (moisture > 80) condition = 'Normal';

    const estHarvest = plantingDate
      ? new Date(new Date(plantingDate).getTime() + 360 * 86400000).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        })
      : '—';

    return { days, stageIdx, currentStage, progressPct, condition, estHarvest };
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading-center">
          <div className="loading-spinner" />
          <p>Loading farm intelligence…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Farm & Field Infrastructure</p>
            <h1 className="page-title">Farm & Field Management</h1>
            <p className="page-subtitle">
              Manage your agricultural holdings, field parcels, soil properties, and sugarcane growth cycles.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={openAddFarm}>+ Add Farm</button>
            {activeFarm && <button className="btn-primary" onClick={openAddField}>+ Add Field</button>}
          </div>
        </div>

        {/* Farm Selector Tabs */}
        {farms.length > 0 && (
          <div className="profile-selector">
            {farms.map(f => (
              <button
                key={f.id}
                className={`profile-btn ${activeFarm?.id === f.id ? 'profile-btn-active' : ''}`}
                onClick={() => setActiveFarm(f)}
              >
                🏡 {f.name}
              </button>
            ))}
          </div>
        )}

        {farms.length === 0 ? (
          <div className="empty-page-state">
            <div className="eps-icon">🏡</div>
            <h2>No Farms Registered Yet</h2>
            <p>Add your first sugarcane farm to begin tracking fields, growth phenology, and yield forecasts.</p>
            <button className="btn-primary" onClick={openAddFarm}>+ Register Your First Farm</button>
          </div>
        ) : activeFarm && (
          <div className="dash-panel">
            {/* Farm Header */}
            <div className="dash-panel-header">
              <div>
                <h3 style={{ fontSize: 20 }}>{activeFarm.name}</h3>
                <span className="farm-location" style={{ fontSize: 13, color: '#4b5563' }}>
                  📍 {activeFarm.location} • 🏠 {activeFarm.address || activeFarm.location} • {activeFarm.district}, {activeFarm.state}
                </span>
              </div>
              <div className="farm-action-row">
                <div className="farm-stat-pills">
                  <div className="farm-stat-pill">
                    <span>{Number(activeFarm.total_area).toFixed(1)} ha</span>
                    <span>Total Area</span>
                  </div>
                  <div className="farm-stat-pill">
                    <span>{activeFarm.fields?.length || 0}</span>
                    <span>Fields</span>
                  </div>
                </div>
                <button className="btn-outline-sm" onClick={() => openEditFarm(activeFarm)}>✏ Edit Farm</button>
                <button className="btn-danger-sm" onClick={() => deleteFarm(activeFarm.id)} title="Delete Farm">🗑</button>
              </div>
            </div>

            {/* Fields List */}
            {(!activeFarm.fields || activeFarm.fields.length === 0) ? (
              <div className="empty-state">
                <span>🌾</span>
                <p>No field parcels added to {activeFarm.name}. Add your first field to begin monitoring.</p>
                <button className="btn-primary" onClick={openAddField}>+ Add Field Parcel</button>
              </div>
            ) : (
              <div className="fields-grid">
                {activeFarm.fields.map(field => {
                  const { days, stageIdx, currentStage, progressPct, condition, estHarvest } = getStageAndProgress(
                    field.planting_date, Number(field.soil_moisture)
                  );
                  const stageCol = STAGE_COLORS[currentStage] || '#16a34a';

                  return (
                    <div className="field-card" key={field.id}>
                      <div className="field-card-header">
                        <span className="field-name">{field.name}</span>
                        <div className="field-actions">
                          <button className="icon-btn" onClick={() => openViewDetails(field)} title="View Field Details">🔍</button>
                          <button className="icon-btn" onClick={() => openEditField(field)} title="Edit Field">✏</button>
                          <button className="icon-btn icon-btn-danger" onClick={() => deleteField(field.id)} title="Delete Field">🗑</button>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="field-tags">
                        <span className="variety-badge">{field.sugarcane_variety}</span>
                        <span className="status-badge" style={{ background: `${stageCol}18`, color: stageCol }}>
                          Stage: {currentStage}
                        </span>
                        <span className="area-badge">{Number(field.area).toFixed(1)} ha</span>
                        <span className={`status-badge status-${condition.toLowerCase() === 'excellent' ? 'good' : condition.toLowerCase() === 'stressed' ? 'danger' : 'moderate'}`}>
                          {condition} Condition
                        </span>
                      </div>

                      {/* Planting Dates & Timeline */}
                      <div className="field-detail-row">
                        <span>📅 Planted {new Date(field.planting_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>{days} days in ground</span>
                      </div>
                      <div className="field-detail-row" style={{ marginTop: -4, color: '#6b7280' }}>
                        <span>⏱ Timeline: 360 days</span>
                        <span>Est. Harvest: {estHarvest}</span>
                      </div>

                      {/* Crop Progress Track */}
                      <div className="crop-progress-wrap">
                        <div className="cp-label">
                          <span>Growth Progression</span>
                          <span>{progressPct}% ({currentStage})</span>
                        </div>
                        <div className="cp-track">
                          <div className="cp-fill" style={{ width: `${progressPct}%`, background: stageCol }} />
                        </div>
                      </div>

                      {/* Soil Parameters */}
                      <div className="field-soil-row">
                        <span>⚗️ pH {Number(field.soil_ph).toFixed(1)}</span>
                        <span>💧 Moisture {Number(field.soil_moisture).toFixed(0)}%</span>
                        <span>🪨 {field.soil_type}</span>
                      </div>

                      {/* 6 Growth Stages Pipeline */}
                      <div className="stage-dots-row">
                        {STAGES.map((s, i) => (
                          <div
                            key={s}
                            className={`stage-dot ${s === currentStage ? 'stage-active' : i < stageIdx ? 'stage-done' : ''}`}
                            title={`Stage ${i+1}: ${s}`}
                          />
                        ))}
                      </div>

                      {/* Action Shortcuts */}
                      <div className="field-card-actions">
                        <button className="btn-xs" onClick={() => openViewDetails(field)}>🔍 View Details</button>
                        <button className="btn-xs" onClick={() => navigate('/prediction')}>🌾 Predict Yield</button>
                        <button className="btn-xs" onClick={() => navigate('/crop-intel')}>🌿 Phenology</button>
                        <button className="btn-xs" onClick={() => navigate('/soil')}>🪨 Soil Health</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Add/Edit Farm Modal ── */}
        {farmModal && (
          <Modal
            title={editFarm ? 'Edit Farm Details' : 'Add New Sugarcane Farm'}
            onClose={() => setFarmModal(false)}
            footer={
              <>
                <button className="btn-secondary" onClick={() => setFarmModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveFarm} disabled={saving}>
                  {saving ? 'Saving…' : (editFarm ? 'Update Farm' : 'Create Farm')}
                </button>
              </>
            }
          >
            <div className="modal-form-grid">
              <FormGroup label="Farm Name" required>
                <input
                  placeholder="e.g. Krishna Sugarcane Estate"
                  value={farmForm.name}
                  onChange={e => setFarmForm(f => ({ ...f, name: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Location / Village" required>
                <input
                  placeholder="e.g. Shirol Village, Kolhapur"
                  value={farmForm.location}
                  onChange={e => setFarmForm(f => ({ ...f, location: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Address" required>
                <input
                  placeholder="e.g. Survey No. 142/A, Shirol Road, Post Shirol"
                  value={farmForm.address}
                  onChange={e => setFarmForm(f => ({ ...f, address: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="District" required>
                <input
                  placeholder="e.g. Kolhapur"
                  value={farmForm.district}
                  onChange={e => setFarmForm(f => ({ ...f, district: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="State" required>
                <input
                  placeholder="e.g. Maharashtra"
                  value={farmForm.state}
                  onChange={e => setFarmForm(f => ({ ...f, state: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Total Area (Hectares)" required>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g. 12.5"
                  value={farmForm.total_area}
                  onChange={e => setFarmForm(f => ({ ...f, total_area: e.target.value }))}
                />
              </FormGroup>
            </div>
          </Modal>
        )}

        {/* ── Add/Edit Field Modal ── */}
        {fieldModal && (
          <Modal
            title={editField ? 'Edit Field Parcel' : 'Add New Field Parcel'}
            onClose={() => setFieldModal(false)}
            footer={
              <>
                <button className="btn-secondary" onClick={() => setFieldModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveField} disabled={saving}>
                  {saving ? 'Saving…' : (editField ? 'Update Field' : 'Add Field')}
                </button>
              </>
            }
          >
            <div className="modal-form-grid">
              <FormGroup label="Field Name" required>
                <input
                  placeholder="e.g. North Plot #1"
                  value={fieldForm.name}
                  onChange={e => setFieldForm(f => ({ ...f, name: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Field Area (ha)" required>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g. 4.5"
                  value={fieldForm.area}
                  onChange={e => setFieldForm(f => ({ ...f, area: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Location / Sub-division">
                <input
                  placeholder="e.g. North Canal Road"
                  value={fieldForm.location}
                  onChange={e => setFieldForm(f => ({ ...f, location: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Sugarcane Variety" required>
                <select
                  value={fieldForm.sugarcane_variety}
                  onChange={e => setFieldForm(f => ({ ...f, sugarcane_variety: e.target.value }))}
                >
                  {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </FormGroup>

              <FormGroup label="Planting Date" required>
                <input
                  type="date"
                  value={fieldForm.planting_date}
                  onChange={e => setFieldForm(f => ({ ...f, planting_date: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Soil Type" required>
                <select
                  value={fieldForm.soil_type}
                  onChange={e => setFieldForm(f => ({ ...f, soil_type: e.target.value }))}
                >
                  {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormGroup>

              <FormGroup label="Soil pH (6.0 - 7.5 optimal)">
                <input
                  type="number"
                  step="0.1"
                  min="3.0"
                  max="11.0"
                  placeholder="6.8"
                  value={fieldForm.soil_ph}
                  onChange={e => setFieldForm(f => ({ ...f, soil_ph: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Soil Moisture (%)">
                <input
                  type="number"
                  step="1"
                  min="10"
                  max="100"
                  placeholder="65"
                  value={fieldForm.soil_moisture}
                  onChange={e => setFieldForm(f => ({ ...f, soil_moisture: e.target.value }))}
                />
              </FormGroup>
            </div>
          </Modal>
        )}

        {/* ── View Field Details Modal ── */}
        {detailModal && viewField && (
          <Modal
            title={`Field Details: ${viewField.name}`}
            onClose={() => setDetailModal(false)}
            footer={
              <button className="btn-primary" onClick={() => setDetailModal(false)}>Close</button>
            }
          >
            {(() => {
              const { days, currentStage, progressPct, condition, estHarvest } = getStageAndProgress(
                viewField.planting_date, Number(viewField.soil_moisture)
              );
              return (
                <div className="field-detail-modal-content">
                  <div className="fdm-section">
                    <h4>Agronomic Field Profile</h4>
                    <div className="field-info-grid">
                      <div className="fi-row"><span className="fi-key">Field Name:</span><span className="fi-val">{viewField.name}</span></div>
                      <div className="fi-row"><span className="fi-key">Farm Name:</span><span className="fi-val">{activeFarm?.name}</span></div>
                      <div className="fi-row"><span className="fi-key">Location:</span><span className="fi-val">{viewField.location}</span></div>
                      <div className="fi-row"><span className="fi-key">Area:</span><span className="fi-val">{Number(viewField.area).toFixed(1)} hectares</span></div>
                      <div className="fi-row"><span className="fi-key">Sugarcane Variety:</span><span className="fi-val"><strong>{viewField.sugarcane_variety}</strong></span></div>
                      <div className="fi-row"><span className="fi-key">Planting Date:</span><span className="fi-val">{new Date(viewField.planting_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span></div>
                      <div className="fi-row"><span className="fi-key">Soil Type:</span><span className="fi-val">{viewField.soil_type}</span></div>
                      <div className="fi-row"><span className="fi-key">Soil pH:</span><span className="fi-val">{Number(viewField.soil_ph).toFixed(1)}</span></div>
                      <div className="fi-row"><span className="fi-key">Soil Moisture:</span><span className="fi-val">{Number(viewField.soil_moisture).toFixed(0)}%</span></div>
                    </div>
                  </div>

                  <div className="fdm-section" style={{ marginTop: 16 }}>
                    <h4>Crop Growth & Phenology Information</h4>
                    <div className="field-info-grid">
                      <div className="fi-row"><span className="fi-key">Growth Stage:</span><span className="fi-val" style={{ color: '#16a34a', fontWeight: 700 }}>{currentStage} (Stage {STAGES.indexOf(currentStage)+1}/6)</span></div>
                      <div className="fi-row"><span className="fi-key">Days Since Planting:</span><span className="fi-val">{days} days</span></div>
                      <div className="fi-row"><span className="fi-key">Expected Timeline:</span><span className="fi-val">360 days (Annual crop cycle)</span></div>
                      <div className="fi-row"><span className="fi-key">Estimated Harvest Date:</span><span className="fi-val"><strong>{estHarvest}</strong></span></div>
                      <div className="fi-row"><span className="fi-key">Current Condition:</span><span className="fi-val">{condition}</span></div>
                      <div className="fi-row"><span className="fi-key">Growth Progress:</span><span className="fi-val">{progressPct}%</span></div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </Modal>
        )}
      </div>
    </AppLayout>
  );
}
