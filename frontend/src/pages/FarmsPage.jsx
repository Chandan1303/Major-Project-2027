import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, Plus, Edit2, Trash2, Eye, Sprout, Calendar,
  Droplets, Layers, Sparkles, TrendingUp, Compass, CheckCircle2,
  AlertTriangle, ArrowUpRight, BarChart3, ChevronRight, Activity
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { farmApi } from '../services/api';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import toast, { Toaster } from 'react-hot-toast';

const VARIETIES = ['Co 86032', 'Co 0238', 'CoC 671', 'Co 99004', 'CoM 0265'];
const STAGES = ['Planting', 'Germination', 'Tillering', 'Grand Growth', 'Maturity', 'Harvest'];
const STAGE_DAYS = [0, 30, 60, 120, 270, 360];
const SOIL_TYPES = ['Black Cotton Soil', 'Alluvial Soil', 'Red Laterite Soil', 'Sandy Loam', 'Clay Loam', 'Loamy Soil'];
const STAGE_COLORS = {
  Planting: '#6366f1',
  Germination: '#0ea5e9',
  Tillering: '#f59e0b',
  'Grand Growth': '#10b981',
  Maturity: '#ea580c',
  Harvest: '#059669'
};

function FormGroup({ label, required, children, helper }) {
  return (
    <div className="form-group" style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
      {helper && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>{helper}</span>}
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
      toast.error(e.message || 'Failed to load farms');
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
      toast.error(e.message || 'Operation failed');
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
      toast.error(e.message || 'Delete failed');
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
      toast.error(e.message || 'Field save failed');
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
      toast.error(e.message || 'Field deletion failed');
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
    let conditionBadge = 'good';
    if (moisture < 45) { condition = 'Stressed'; conditionBadge = 'critical'; }
    else if (moisture >= 60 && moisture <= 75) { condition = 'Optimal'; conditionBadge = 'success'; }
    else if (moisture > 80) { condition = 'Saturated'; conditionBadge = 'medium'; }

    const estHarvest = plantingDate
      ? new Date(new Date(plantingDate).getTime() + 360 * 86400000).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        })
      : '—';

    return { days, stageIdx, currentStage, progressPct, condition, conditionBadge, estHarvest };
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading-center">
          <div className="loading-spinner" />
          <p>Synchronizing precision farm topology…</p>
        </div>
      </AppLayout>
    );
  }

  // Aggregate telemetry
  const totalHoldingsArea = farms.reduce((acc, f) => acc + (Number(f.total_area) || 0), 0);
  const totalFieldCount   = farms.reduce((acc, f) => acc + (f.fields?.length || 0), 0);
  const activeFields      = activeFarm?.fields || [];
  const activeFieldArea   = activeFields.reduce((acc, f) => acc + (Number(f.area) || 0), 0);

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              <Building2 size={13} /> Precision Land Tenure & Parcel Intelligence
            </div>
            <h1 className="page-title" style={{ margin: '0 0 6px' }}>Agricultural Holdings & Fields</h1>
            <p className="page-subtitle" style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Configure spatial boundaries, sugarcane varieties, edaphic baseline conditions, and automated phenological growth calendars.
            </p>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: 10 }}>
            <button className="btn-outline" onClick={openAddFarm} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> New Farm Holding
            </button>
            {activeFarm && (
              <button className="btn-primary" onClick={openAddField} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sprout size={16} /> Add Field Parcel
              </button>
            )}
          </div>
        </div>

        {/* Global Holdings Overview Stats */}
        <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 24 }}>
          <StatCard
            label="Total Farms Registered"
            value={farms.length}
            unit="properties"
            icon={Building2}
            color="emerald"
            subtitle="Commercial agricultural units"
          />
          <StatCard
            label="Cumulative Land Area"
            value={totalHoldingsArea.toFixed(1)}
            unit="hectares"
            icon={Layers}
            color="teal"
            subtitle="Registered cultivable acreage"
          />
          <StatCard
            label="Active Monitored Parcels"
            value={totalFieldCount}
            unit="fields"
            icon={Sprout}
            color="green"
            subtitle="Configured field subdivisions"
          />
          <StatCard
            label="Selected Farm Utilization"
            value={activeFarm && activeFarm.total_area > 0 ? Math.round((activeFieldArea / activeFarm.total_area) * 100) : 0}
            unit="%"
            icon={Activity}
            color="amber"
            trend={activeFieldArea > 0 ? `${activeFieldArea.toFixed(1)} ha planted` : 'Unassigned'}
            subtitle="Planted vs total holding"
          />
        </div>

        {/* Farm Selector Ribbon */}
        {farms.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto', paddingBottom: 6, marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              SELECT FARM:
            </span>
            {farms.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFarm(f)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 18px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: activeFarm?.id === f.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: activeFarm?.id === f.id ? 'var(--primary-glow)' : 'var(--card-bg)',
                  color: activeFarm?.id === f.id ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: activeFarm?.id === f.id ? 'var(--shadow-sm)' : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                <Building2 size={15} style={{ opacity: activeFarm?.id === f.id ? 1 : 0.6 }} />
                <span>{f.name}</span>
                <span style={{
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 20,
                  background: activeFarm?.id === f.id ? 'var(--primary)' : 'var(--bg-tertiary)',
                  color: activeFarm?.id === f.id ? '#ffffff' : 'var(--text-muted)'
                }}>
                  {f.fields?.length || 0} fields
                </span>
              </button>
            ))}
          </div>
        )}

        {farms.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No Agricultural Holdings Registered"
            description="Create your first sugarcane estate or farm parcel to begin tracking crop stage phenology, real-time sensor metrics, and AI yield forecasts."
            actionText="Register New Holding"
            onAction={openAddFarm}
          />
        ) : activeFarm && (
          <div className="card" style={{ padding: 24, borderRadius: 18, border: '1px solid var(--border-color)', background: 'var(--card-bg)', marginBottom: 30 }}>
            
            {/* Farm Active Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, paddingBottom: 20, borderBottom: '1px solid var(--border-color)', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{activeFarm.name}</h2>
                  <Badge variant="success">Active Tenure</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={14} color="var(--primary)" /> {activeFarm.location}
                  </span>
                  {activeFarm.address && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Compass size={14} color="var(--text-muted)" /> {activeFarm.address}
                    </span>
                  )}
                  <span>
                    <strong>Jurisdiction:</strong> {activeFarm.district || '—'}, {activeFarm.state || 'Maharashtra'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, marginRight: 8 }}>
                  <div style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{Number(activeFarm.total_area).toFixed(1)} ha</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Holding Area</div>
                  </div>
                  <div style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{activeFarm.fields?.length || 0}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Field Parcels</div>
                  </div>
                </div>

                <button className="btn-outline-sm" onClick={() => openEditFarm(activeFarm)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Edit2 size={13} /> Edit Holding
                </button>
                <button className="btn-danger-sm" onClick={() => deleteFarm(activeFarm.id)} title="Delete Farm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>

            {/* Fields Grid */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Active Field Parcels ({activeFarm.fields?.length || 0})
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                  Continuous phenology tracking, edaphic metrics, and rapid prediction shortcuts.
                </p>
              </div>
              <button className="btn-primary" onClick={openAddField} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
                <Plus size={15} /> Add Parcel
              </button>
            </div>

            {(!activeFarm.fields || activeFarm.fields.length === 0) ? (
              <EmptyState
                icon={Sprout}
                title="No Parcels Configured For This Holding"
                description={`Divide ${activeFarm.name} into distinct management zones or field plots to track planting dates and soil nutrients.`}
                actionText="Add First Parcel"
                onAction={openAddField}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                {activeFarm.fields.map(field => {
                  const { days, stageIdx, currentStage, progressPct, condition, conditionBadge, estHarvest } = getStageAndProgress(
                    field.planting_date, Number(field.soil_moisture)
                  );
                  const stageCol = STAGE_COLORS[currentStage] || '#10b981';

                  return (
                    <div
                      key={field.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 16,
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div>
                        {/* Field Top Card */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {field.name}
                            </h4>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {field.location || activeFarm.location}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => openViewDetails(field)}
                              title="Field Dossier"
                              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => openEditField(field)}
                              title="Edit Field"
                              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => deleteField(field.id)}
                              title="Delete Field"
                              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Tag Pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)' }}>
                            {field.sugarcane_variety}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: `${stageCol}18`, color: stageCol }}>
                            {currentStage}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            {Number(field.area).toFixed(1)} ha
                          </span>
                          <Badge variant={conditionBadge}>{condition}</Badge>
                        </div>

                        {/* Growth Timeline Progress */}
                        <div style={{ background: 'var(--card-bg)', padding: 12, borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Phenology Progression</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{progressPct}% ({days}d)</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 6, background: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ height: '100%', width: `${progressPct}%`, background: stageCol, transition: 'width 0.6s ease' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                            <span>Planted: {new Date(field.planting_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            <span>Est: {estHarvest}</span>
                          </div>
                        </div>

                        {/* Soil & Edaphic Properties */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 10, background: 'var(--card-bg)', borderRadius: 10, border: '1px solid var(--border-color)', marginBottom: 16 }}>
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>SOIL PH</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{Number(field.soil_ph).toFixed(1)}</span>
                          </div>
                          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>MOISTURE</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{Number(field.soil_moisture).toFixed(0)}%</span>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>TYPE</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                              {field.soil_type.replace(' Soil', '')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Shortcuts */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                        <button
                          className="btn-primary"
                          onClick={() => navigate(`/prediction?farm_id=${activeFarm.id}&field_id=${field.id}`)}
                          style={{ fontSize: 12, padding: '7px 10px', justifyContent: 'center' }}
                        >
                          <Sparkles size={13} /> Predict Yield
                        </button>
                        <button
                          className="btn-outline"
                          onClick={() => navigate(`/soil?field_id=${field.id}`)}
                          style={{ fontSize: 12, padding: '7px 10px', justifyContent: 'center' }}
                        >
                          <Droplets size={13} /> Soil Health
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Add / Edit Farm Modal ── */}
        <Modal
          isOpen={farmModal}
          onClose={() => setFarmModal(false)}
          title={editFarm ? 'Update Farm Holding Dossier' : 'Register Agricultural Farm Holding'}
          description="Establish primary holding cadastral data and gross cultivable acreage."
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
              <button className="btn-outline" onClick={() => setFarmModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveFarm} disabled={saving}>
                {saving ? 'Synchronizing…' : (editFarm ? 'Save Modifications' : 'Register Farm')}
              </button>
            </div>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <FormGroup label="Farm / Estate Name" required helper="Recognized agricultural estate or holding moniker">
                <input
                  className="input-field"
                  placeholder="e.g. Godavari Sugar Farms"
                  value={farmForm.name}
                  onChange={e => setFarmForm(f => ({ ...f, name: e.target.value }))}
                />
              </FormGroup>
            </div>

            <FormGroup label="Village / Location" required>
              <input
                className="input-field"
                placeholder="e.g. Shirol, Taluka Shirol"
                value={farmForm.location}
                onChange={e => setFarmForm(f => ({ ...f, location: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Total Holding Area (Hectares)" required>
              <input
                className="input-field"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="e.g. 15.5"
                value={farmForm.total_area}
                onChange={e => setFarmForm(f => ({ ...f, total_area: e.target.value }))}
              />
            </FormGroup>

            <div style={{ gridColumn: 'span 2' }}>
              <FormGroup label="Official Land Address" helper="Survey numbers, canal proximity or rural postal reference">
                <input
                  className="input-field"
                  placeholder="e.g. Survey No. 42/3, Near Panchganga Left Canal"
                  value={farmForm.address}
                  onChange={e => setFarmForm(f => ({ ...f, address: e.target.value }))}
                />
              </FormGroup>
            </div>

            <FormGroup label="District" required>
              <input
                className="input-field"
                placeholder="e.g. Kolhapur"
                value={farmForm.district}
                onChange={e => setFarmForm(f => ({ ...f, district: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="State / Region" required>
              <input
                className="input-field"
                placeholder="e.g. Maharashtra"
                value={farmForm.state}
                onChange={e => setFarmForm(f => ({ ...f, state: e.target.value }))}
              />
            </FormGroup>
          </div>
        </Modal>

        {/* ── Add / Edit Field Parcel Modal ── */}
        <Modal
          isOpen={fieldModal}
          onClose={() => setFieldModal(false)}
          title={editField ? 'Edit Field Parcel Parameters' : 'Add New Sugarcane Field Parcel'}
          description={`Parcel will be assigned under active holding: ${activeFarm?.name}`}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
              <button className="btn-outline" onClick={() => setFieldModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveField} disabled={saving}>
                {saving ? 'Recording Parcel…' : (editField ? 'Update Parcel' : 'Add Parcel')}
              </button>
            </div>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <FormGroup label="Field Parcel Moniker" required helper="Specific plot identifier (e.g. Sector-A North, Canal Plot)">
                <input
                  className="input-field"
                  placeholder="e.g. Plot #3 North Canal"
                  value={fieldForm.name}
                  onChange={e => setFieldForm(f => ({ ...f, name: e.target.value }))}
                />
              </FormGroup>
            </div>

            <FormGroup label="Parcel Extent (Hectares)" required>
              <input
                className="input-field"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="e.g. 3.2"
                value={fieldForm.area}
                onChange={e => setFieldForm(f => ({ ...f, area: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Sugarcane Cultivar / Variety" required>
              <select
                className="input-field"
                value={fieldForm.sugarcane_variety}
                onChange={e => setFieldForm(f => ({ ...f, sugarcane_variety: e.target.value }))}
              >
                {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </FormGroup>

            <FormGroup label="Planting / Ratoon Emergence Date" required>
              <input
                className="input-field"
                type="date"
                value={fieldForm.planting_date}
                onChange={e => setFieldForm(f => ({ ...f, planting_date: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Dominant Edaphic Type" required>
              <select
                className="input-field"
                value={fieldForm.soil_type}
                onChange={e => setFieldForm(f => ({ ...f, soil_type: e.target.value }))}
              >
                {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormGroup>

            <FormGroup label="Edaphic Baseline pH (6.0 - 7.5 optimal)">
              <input
                className="input-field"
                type="number"
                step="0.1"
                min="3.0"
                max="10.0"
                placeholder="6.8"
                value={fieldForm.soil_ph}
                onChange={e => setFieldForm(f => ({ ...f, soil_ph: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Soil Moisture Benchmark (%)">
              <input
                className="input-field"
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

        {/* ── View Field Details Dossier Modal ── */}
        {detailModal && viewField && (
          <Modal
            isOpen={detailModal}
            onClose={() => setDetailModal(false)}
            title={`Agronomic Dossier: ${viewField.name}`}
            description={`Parcel belonging to holding: ${activeFarm?.name}`}
            footer={
              <button className="btn-primary" onClick={() => setDetailModal(false)}>Close Dossier</button>
            }
          >
            {(() => {
              const { days, currentStage, progressPct, condition, conditionBadge, estHarvest } = getStageAndProgress(
                viewField.planting_date, Number(viewField.soil_moisture)
              );
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Status Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>CURRENT STAGE</span>
                      <strong style={{ fontSize: 16, color: 'var(--primary)' }}>{currentStage}</strong>
                    </div>
                    <Badge variant={conditionBadge}>{condition} Condition</Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CULTIVAR VARIETY</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{viewField.sugarcane_variety}</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>SURFACE AREA</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{Number(viewField.area).toFixed(1)} Hectares</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>DAYS IN GROUND</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{days} Days</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ESTIMATED HARVEST</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{estHarvest}</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>SOIL COMPOSITION</span>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{viewField.soil_type}</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>EDAPHIC pH & MOISTURE</span>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>pH {Number(viewField.soil_ph).toFixed(1)} • {Number(viewField.soil_moisture).toFixed(0)}% Moisture</div>
                    </div>
                  </div>

                  <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Launch complete ML harvest simulation for this parcel?</span>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setDetailModal(false);
                        navigate(`/prediction?farm_id=${activeFarm.id}&field_id=${viewField.id}`);
                      }}
                      style={{ fontSize: 12, padding: '7px 12px' }}
                    >
                      Predict Yield Now
                    </button>
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
