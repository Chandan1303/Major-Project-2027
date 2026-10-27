import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, Plus, Edit2, Trash2, Eye, Sprout, Calendar,
  Droplets, Layers, Sparkles, TrendingUp, Compass, CheckCircle2,
  AlertTriangle, ArrowUpRight, BarChart3, ChevronRight, Activity
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { farmApi, geographyApi } from '../services/api';
import { useField } from '../context/FieldContext';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import toast, { Toaster } from 'react-hot-toast';

const VARIETIES = ['Co 86032', 'Co 0238', 'CoC 671', 'Co 99004', 'CoM 0265'];
const STAGES = ['Planting', 'Germination', 'Tillering', 'Grand Growth', 'Maturity', 'Harvest'];
const STAGE_DAYS = [0, 30, 60, 120, 270, 360];
const IRRIGATION_METHODS = ['Drip Irrigation', 'Furrow Irrigation', 'Sprinkler Irrigation', 'Flood Irrigation', 'Subsurface Drip', 'Rainfed'];
const SOIL_TYPES = ['Black Cotton Soil', 'Alluvial Soil', 'Red Laterite Soil', 'Sandy Loam', 'Clay Loam', 'Loamy Soil'];
const STAGE_COLORS = {
  Germination: '#6366f1',
  Tillering: '#0ea5e9',
  'Grand Growth': '#10b981',
  Maturity: '#ea580c',
  Harvest: '#059669',
  Planting: '#6366f1'
};

function FormGroup({ label, required, children, helper }) {
  return (
    <div className="form-group" style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
        {children}
      </label>
      {helper && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>{helper}</span>}
    </div>
  );
}

export default function FarmsPage() {
  const navigate = useNavigate();
  const { selectedFarm, selectFarm, selectField, refreshFarms } = useField();
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
  const [dossierData, setDossierData] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierTab, setDossierTab]   = useState('overview');

  // Forms
  const [farmForm, setFarmForm] = useState({ name: '', survey_number: '', location: '', address: '', district: '', state: '', total_area: '', latitude: '', longitude: '' });
  const [geoStates, setGeoStates] = useState([]);
  const [geoDistricts, setGeoDistricts] = useState([]);
  const [fieldVarieties, setFieldVarieties] = useState([]);
  const [loadingFieldVarieties, setLoadingFieldVarieties] = useState(false);
  const [registrationFields, setRegistrationFields] = useState([]);
  const [newRegistrationField, setNewRegistrationField] = useState({ name: '', area: '' });
  const [fieldForm, setFieldForm] = useState({
    name: '', area: '', location: '', soil_type: SOIL_TYPES[0],
    soil_ph: '', soil_moisture: '', sugarcane_variety: VARIETIES[0], planting_date: '',
    irrigation_method: IRRIGATION_METHODS[0], latitude: '', longitude: '', notes: '', boundary_geojson: ''
  });

  const loadFarms = async () => {
    setLoading(true);
    try {
      const r = await farmApi.list();
      const list = r.data?.farms || [];
      setFarms(list);
      if (list.length && selectedFarm) setActiveFarm(list.find(f => String(f.id) === String(selectedFarm.id)) || list[0]);
      else if (list.length && activeFarm) setActiveFarm(list.find(f => String(f.id) === String(activeFarm.id)) || list[0]);
      else if (list.length) setActiveFarm(list[0]);
      else setActiveFarm(null);
    } catch (e) {
      toast.error(e.message || 'Failed to load farms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFarms(); }, []);

  useEffect(() => {
    geographyApi.getStates().then(r => setGeoStates(r.data?.states || r.states || [])).catch(() => setGeoStates([]));
  }, []);

  useEffect(() => {
    if (!farmForm.state) { setGeoDistricts([]); return; }
    geographyApi.getDistricts(farmForm.state).then(r => setGeoDistricts(r.data?.districts || r.districts || [])).catch(() => setGeoDistricts([]));
  }, [farmForm.state]);

  useEffect(() => {
    if (!fieldModal || !activeFarm?.state) {
      setFieldVarieties([]);
      return;
    }
    let cancelled = false;
    setLoadingFieldVarieties(true);
    geographyApi.getVarieties(activeFarm.state)
      .then(r => {
        if (!cancelled) setFieldVarieties(r.data?.varieties || r.varieties || []);
      })
      .catch(() => {
        if (!cancelled) setFieldVarieties([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingFieldVarieties(false);
      });
    return () => { cancelled = true; };
  }, [fieldModal, activeFarm?.state]);

  useEffect(() => {
    if (!selectedFarm) return;
    const matchingFarm = farms.find(farm => String(farm.id) === String(selectedFarm.id));
    if (matchingFarm) setActiveFarm(matchingFarm);
  }, [selectedFarm, farms]);

  // Farm CRUD
  const openAddFarm  = () => {
    setEditFarm(null);
    setFarmForm({ name: '', survey_number: '', location: '', address: '', district: '', state: '', total_area: '', latitude: '', longitude: '' });
    setRegistrationFields([]);
    setNewRegistrationField({ name: '', area: '' });
    setFarmModal(true);
  };

  const openEditFarm = (f) => {
    setEditFarm(f);
    setFarmForm({
      name: f.name,
      survey_number: f.survey_number || '',
      location: f.location,
      address: f.address || f.location || '',
      district: f.district || '',
      state: f.state || '',
      total_area: f.total_area,
      latitude: f.latitude ?? '',
      longitude: f.longitude ?? ''
    });
    setFarmModal(true);
  };

  const saveFarm = async () => {
    if (!farmForm.name || !farmForm.location || !farmForm.district || !farmForm.state || !farmForm.total_area) {
      return toast.error('Farm name, village, state, district, and gross cultivable area are required.');
    }
    if (!editFarm && registrationFields.reduce((sum, field) => sum + Number(field.area || 0), 0) > Number(farmForm.total_area)) return toast.error('Farm field areas cannot exceed gross cultivable area.');
    setSaving(true);
    try {
      if (editFarm) {
        await farmApi.update(editFarm.id, farmForm);
        toast.success('Farm updated successfully!');
      } else {
        await farmApi.create({ ...farmForm, fields: registrationFields });
        toast.success('Farm created successfully!');
      }
      setFarmModal(false);
      await loadFarms();
      await refreshFarms();
    } catch (e) {
      toast.error(e.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteFarm = async (id) => {
    if (!confirm('Archive this farm and its fields? Soil, crop, prediction, and alert history will be preserved, and the farm will be removed from active farm lists.')) return;
    try {
      await farmApi.remove(id);
      toast.success('Farm and fields archived. History preserved.');
      await loadFarms();
      await refreshFarms();
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
      soil_ph: '',
      soil_moisture: '',
      sugarcane_variety: '',
      planting_date: '',
      irrigation_method: IRRIGATION_METHODS[0],
      latitude: '',
      longitude: '',
      notes: '',
      boundary_geojson: ''
    });
    setFieldModal(true);
  };

  const openEditField = (f) => {
    setEditField(f);
    setFieldForm({
      name: f.name,
      area: f.area,
      location: f.location || activeFarm?.location || '',
      soil_type: f.soil_type,
      soil_ph: f.soil_ph,
      soil_moisture: f.soil_moisture,
      sugarcane_variety: f.sugarcane_variety,
      planting_date: f.planting_date?.split('T')[0] || f.planting_date || '',
      irrigation_method: f.irrigation_method || IRRIGATION_METHODS[0],
      latitude: f.latitude ?? '',
      longitude: f.longitude ?? '',
      notes: f.notes || '',
      boundary_geojson: f.boundary_geojson || ''
    });
    setFieldModal(true);
  };

  const openViewDetails = async (f) => {
    setViewField(f);
    setDetailModal(true);
    setDossierTab('overview');
    setDossierLoading(true);
    setDossierData(null);
    try {
      const res = await farmApi.getFieldHistory(f.id);
      if (res?.data) {
        setDossierData(res.data);
      }
    } catch (e) {
      console.warn('Field dossier fetch notice:', e);
    } finally {
      setDossierLoading(false);
    }
  };

  const saveField = async () => {
    if (!fieldForm.name || !fieldForm.area || !fieldForm.location?.trim()) {
      return toast.error('Field name, area, and parcel location are required. Planting date and soil readings can be added later.');
    }
    if (!fieldForm.sugarcane_variety) {
      return toast.error('Select a sugarcane variety recommended for the registered farm location.');
    }
    setSaving(true);
    try {
      const fieldPayload = { ...fieldForm, location: fieldForm.location.trim() };
      if (editField) {
        await farmApi.updateField(activeFarm.id, editField.id, fieldPayload);
        toast.success('Field updated successfully!');
      } else {
        await farmApi.addField(activeFarm.id, fieldPayload);
        toast.success('Field added successfully!');
      }
      setFieldModal(false);
      await loadFarms();
      await refreshFarms();
    } catch (e) {
      toast.error(e.message || 'Field save failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteField = async (fieldId) => {
    if (!confirm('Archive this field? Its soil, crop, prediction, and alert history will be preserved, and it will be removed from active field lists.')) return;
    try {
      await farmApi.removeField(activeFarm.id, fieldId);
      toast.success('Field archived. History preserved.');
      await loadFarms();
      await refreshFarms();
    } catch (e) {
      toast.error(e.message || 'Field deletion failed');
    }
  };

  const daysAgo = (dateStr) => {
    if (!dateStr || Number.isNaN(new Date(dateStr).getTime())) return null;
    return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  };

  const getStageAndProgress = (plantingDate, moisture, moistureRecordedAt) => {
    const days = daysAgo(plantingDate);
    if (days == null || days < 0) return { days: null, stageIdx: null, currentStage: 'Stage unavailable', progressPct: 0, condition: 'Data unavailable', conditionBadge: 'medium', estHarvest: '—' };
    let stageIdx = 0;
    for (let i = STAGE_DAYS.length - 1; i >= 0; i--) {
      if (days >= STAGE_DAYS[i]) {
        stageIdx = i;
        break;
      }
    }
    const currentStage = STAGES[stageIdx];
    const progressPct = Math.min(100, Math.round((days / 360) * 100));

    let condition = 'Data unavailable';
    let conditionBadge = 'medium';
    const readingTime = moistureRecordedAt ? new Date(moistureRecordedAt).getTime() : null;
    const readingAge = readingTime == null ? NaN : Date.now() - readingTime;
    const readingStale = !Number.isFinite(readingAge) || readingAge < 0 || readingAge > 30 * 86400000;
    if (readingStale) { condition = moistureRecordedAt ? 'Reading outdated' : 'Data unavailable'; }
    else if (Number.isFinite(moisture)) {
      if (moisture < 45) { condition = 'Stressed'; conditionBadge = 'critical'; }
      else if (moisture < 60 || moisture > 75 && moisture <= 80) { condition = 'Monitor'; conditionBadge = 'medium'; }
      else if (moisture <= 75) { condition = 'Optimal'; conditionBadge = 'success'; }
      else { condition = 'Potentially saturated'; conditionBadge = 'critical'; }
    }

    const estHarvest = plantingDate
      ? new Date(new Date(plantingDate).getTime() + 360 * 86400000).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        })
      : '—';

    return { days, stageIdx, currentStage, progressPct, condition, conditionBadge, estHarvest, daysToHarvest: Math.max(0, 360 - days) };
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
  const totalCultivatedArea = farms.reduce((sum, farm) => sum + (farm.fields || []).reduce((fieldSum, field) => fieldSum + (Number(field.area) || 0), 0), 0);
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
            label="Cultivated Area"
            value={totalCultivatedArea.toFixed(1)}
            unit="hectares"
            icon={Sprout}
            color="green"
            subtitle="Sum of registered field areas"
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
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Agricultural Estate ({farms.length} Registered)
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Active: <strong style={{ color: 'var(--primary)' }}>{activeFarm?.name || 'None'}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              {farms.map(f => {
                const isSelected = activeFarm?.id === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => { setActiveFarm(f); selectFarm(f.id); }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 4,
                      padding: '12px 16px',
                      borderRadius: 14,
                      minWidth: 240,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--primary-glow)' : 'var(--card-bg)',
                      boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'var(--shadow-sm)',
                      flexShrink: 0
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                      <strong style={{ fontSize: 13.5, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {f.name}
                      </strong>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: isSelected ? 'var(--primary)' : 'var(--bg-tertiary)',
                        color: isSelected ? '#ffffff' : 'var(--text-muted)',
                        whiteSpace: 'nowrap'
                      }}>
                        {f.fields?.length || 0} fields
                      </span>
                    </div>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      📍 {f.location || 'Rural Region'}{f.district ? ` • ${f.district}` : ''}{f.state ? `, ${f.state}` : ''}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      📐 {Number(f.total_area || 0).toFixed(1)} ha total area
                    </span>
                  </button>
                );
              })}
            </div>
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
                  const { days, stageIdx, currentStage, progressPct, condition, conditionBadge, estHarvest, daysToHarvest } = getStageAndProgress(
                    field.planting_date, field.soil_moisture == null ? null : Number(field.soil_moisture), field.soil_moisture_recorded_at
                  );
                  const moistureReadingAge = field.soil_moisture_recorded_at ? Date.now() - new Date(field.soil_moisture_recorded_at).getTime() : NaN;
                  const moistureDisplay = field.soil_moisture == null
                    ? 'Data unavailable'
                    : !Number.isFinite(moistureReadingAge) || moistureReadingAge < 0 || moistureReadingAge > 30 * 86400000
                      ? 'Reading outdated'
                      : `${Number(field.soil_moisture).toFixed(0)}%`;
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
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{days == null ? 'Data unavailable' : `${progressPct}% (${days}d)`}</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 6, background: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ height: '100%', width: `${progressPct}%`, background: stageCol, transition: 'width 0.6s ease' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                            <span>Planted: {field.planting_date ? new Date(field.planting_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Date unavailable'}</span>
                            <span>{daysToHarvest == null ? 'Date unavailable' : daysToHarvest ? `${daysToHarvest}d to estimate` : 'Harvest estimate reached'}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Estimated date: {estHarvest} (360-day initial estimate)</div>
                        </div>

                        {/* Soil & Edaphic Properties */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 10, background: 'var(--card-bg)', borderRadius: 10, border: '1px solid var(--border-color)', marginBottom: 16 }}>
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>SOIL PH</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{field.soil_ph == null ? 'Unavailable' : Number(field.soil_ph).toFixed(1)}</span>
                          </div>
                          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>MOISTURE</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{moistureDisplay}</span>
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
                          onClick={() => { selectField(field.id); navigate(`/prediction?farm_id=${activeFarm.id}&field_id=${field.id}`); }}
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
                <FormGroup label="1. Farm / Holding Name" required>
                <input
                  className="input-field"
                  placeholder="e.g. Godavari Sugar Farms"
                  value={farmForm.name}
                  onChange={e => setFarmForm(f => ({ ...f, name: e.target.value }))}
                />
              </FormGroup>
            </div>

            <FormGroup label="2. Survey Number" helper="Cadastral survey or parcel number">
              <input className="input-field" placeholder="e.g. 42/3" value={farmForm.survey_number} onChange={e => setFarmForm(f => ({ ...f, survey_number: e.target.value }))} />
            </FormGroup>

            <FormGroup label="3. Gross Cultivable Area (Hectares)" required>
              <input className="input-field" type="number" step="0.01" min="0.01" placeholder="e.g. 15.50" value={farmForm.total_area} onChange={e => setFarmForm(f => ({ ...f, total_area: e.target.value }))} />
            </FormGroup>

            {!editFarm && <div style={{ gridColumn: 'span 2', border: '1px solid var(--border-color)', borderRadius: 10, padding: 14 }}>
              <strong style={{ display: 'block', marginBottom: 10 }}>4. Farm Fields</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <FormGroup label="Field name"><input className="input-field" placeholder="e.g. North Block" value={newRegistrationField.name} onChange={e => setNewRegistrationField(v => ({ ...v, name: e.target.value }))} /></FormGroup>
                <FormGroup label="Area (hectares)"><input className="input-field" type="number" min="0.01" step="0.01" placeholder="e.g. 2.5" value={newRegistrationField.area} onChange={e => setNewRegistrationField(v => ({ ...v, area: e.target.value }))} /></FormGroup>
                <button type="button" className="btn-outline" onClick={() => {
                  const name = newRegistrationField.name.trim(), area = Number(newRegistrationField.area);
                  if (!name || !Number.isFinite(area) || area <= 0) return toast.error('Enter a field name and positive area.');
                  const total = registrationFields.reduce((sum, field) => sum + Number(field.area), 0) + area;
                  if (farmForm.total_area && total > Number(farmForm.total_area)) return toast.error('Field areas cannot exceed gross cultivable area.');
                  setRegistrationFields(fields => [...fields, { name, area }]); setNewRegistrationField({ name: '', area: '' });
                }}>Add field</button>
              </div>
              {registrationFields.map((field, index) => <div key={`${field.name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span>{field.name} · {field.area} ha</span><button type="button" className="btn-outline" onClick={() => setRegistrationFields(fields => fields.filter((_, i) => i !== index))}>Remove</button></div>)}
              <small>{registrationFields.reduce((sum, field) => sum + Number(field.area), 0).toFixed(2)} ha of {Number(farmForm.total_area || 0).toFixed(2)} ha allocated</small>
            </div>}

            <FormGroup label="5. State" required>
              <select className="input-field" value={farmForm.state} onChange={e => setFarmForm(f => ({ ...f, state: e.target.value, district: '' }))}><option value="">Select state</option>{geoStates.map(s => <option key={s.name || s} value={s.name || s}>{s.name || s}</option>)}</select>
            </FormGroup>
            <FormGroup label="6. District" required>
              <select className="input-field" value={farmForm.district} onChange={e => setFarmForm(f => ({ ...f, district: e.target.value }))} disabled={!farmForm.state}><option value="">Select district</option>{geoDistricts.map(d => <option key={d} value={d}>{d}</option>)}</select>
            </FormGroup>
            <FormGroup label="7. Village" required helper="Type the village name">
              <input
                className="input-field"
                placeholder="e.g. Shirol"
                value={farmForm.location}
                onChange={e => setFarmForm(f => ({ ...f, location: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="8. Latitude" helper="Optional; decimal degrees (−90 to 90)">
              <input
                className="input-field"
                type="number"
                step="any"
                min="-90"
                max="90"
                placeholder="e.g. 16.7123"
                value={farmForm.latitude}
                onChange={e => setFarmForm(f => ({ ...f, latitude: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="9. Longitude" helper="Optional; decimal degrees (−180 to 180)">
              <input
                className="input-field"
                type="number"
                step="any"
                min="-180"
                max="180"
                placeholder="e.g. 74.3412"
                value={farmForm.longitude}
                onChange={e => setFarmForm(f => ({ ...f, longitude: e.target.value }))}
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

            <div style={{ gridColumn: 'span 2' }}>
              <FormGroup label="Parcel Location" required helper="Prefilled from the active holding. Change this if the parcel is in another village or locality; the farm’s state and district remain unchanged. Enter parcel coordinates below for an exact map pin.">
                <input
                  className="input-field"
                  placeholder="Village or locality"
                  value={fieldForm.location}
                  onChange={e => setFieldForm(f => ({ ...f, location: e.target.value }))}
                />
              </FormGroup>
            </div>

            <FormGroup label="Sugarcane Cultivar / Variety" required>
              <select
                className="input-field"
                value={fieldForm.sugarcane_variety}
                onChange={e => setFieldForm(f => ({ ...f, sugarcane_variety: e.target.value }))}
                disabled={loadingFieldVarieties || (fieldVarieties.length === 0 && !editField)}
              >
                <option value="">{loadingFieldVarieties ? 'Loading location-recommended varieties…' : 'Select a recommended variety'}</option>
                {fieldVarieties.map(v => <option key={v} value={v}>{v}</option>)}
                {editField && fieldForm.sugarcane_variety && !fieldVarieties.includes(fieldForm.sugarcane_variety) && (
                  <option value={fieldForm.sugarcane_variety}>{fieldForm.sugarcane_variety} (existing variety)</option>
                )}
              </select>
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                {activeFarm?.state ? `Recommended for ${activeFarm.state}.` : 'Register a farm location to see recommended varieties.'}
              </small>
            </FormGroup>

            <FormGroup label="Planting / Ratoon Emergence Date (optional)">
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

            <FormGroup label="Irrigation System" required helper="Primary water management delivery infrastructure">
              <select
                className="input-field"
                value={fieldForm.irrigation_method}
                onChange={e => setFieldForm(f => ({ ...f, irrigation_method: e.target.value }))}
              >
                {IRRIGATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </FormGroup>

            <FormGroup label="Latitude (Parcel Pin)" helper="Optional; decimal degrees (−90 to 90)">
              <input
                className="input-field"
                type="number"
                step="any"
                min="-90"
                max="90"
                placeholder="e.g. 16.7123"
                value={fieldForm.latitude}
                onChange={e => setFieldForm(f => ({ ...f, latitude: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Longitude (Parcel Pin)" helper="Optional; decimal degrees (−180 to 180)">
              <input
                className="input-field"
                type="number"
                step="any"
                min="-180"
                max="180"
                placeholder="e.g. 74.3412"
                value={fieldForm.longitude}
                onChange={e => setFieldForm(f => ({ ...f, longitude: e.target.value }))}
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
            description={`Parcel under holding: ${activeFarm?.name || 'Estate'}`}
            footer={
              <button className="btn-primary" onClick={() => setDetailModal(false)}>Close Dossier</button>
            }
          >
            {(() => {
              const { days, currentStage, progressPct, condition, conditionBadge, estHarvest, daysToHarvest } = getStageAndProgress(
                viewField.planting_date, viewField.soil_moisture == null ? null : Number(viewField.soil_moisture), viewField.soil_moisture_recorded_at
              );
              const moistureReadingAge = viewField.soil_moisture_recorded_at ? Date.now() - new Date(viewField.soil_moisture_recorded_at).getTime() : NaN;
              const moistureDisplay = viewField.soil_moisture == null
                ? 'Data unavailable'
                : !Number.isFinite(moistureReadingAge) || moistureReadingAge < 0 || moistureReadingAge > 30 * 86400000
                  ? 'Reading outdated'
                  : `${Number(viewField.soil_moisture).toFixed(0)}%`;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Tabs Bar */}
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'predictions', label: `Predictions (${dossierData?.predictions?.length || 0})` },
                      { id: 'soil', label: `Soil Logs (${dossierData?.soil_records?.length || 0})` },
                      { id: 'crop', label: `Crop Phenology (${dossierData?.crop_records?.length || 0})` },
                      { id: 'alerts', label: `Alerts (${dossierData?.alerts?.length || 0})` }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setDossierTab(tab.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: 'none',
                          background: dossierTab === tab.id ? 'var(--primary)' : 'var(--bg-tertiary)',
                          color: dossierTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {dossierLoading ? (
                    <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
                      <p style={{ fontSize: 13, margin: 0 }}>Retrieving parcel dossier & sensor history…</p>
                    </div>
                  ) : dossierTab === 'overview' ? (
                    <>
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
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{days != null ? `${days} Days` : 'Not recorded'}</div>
                        </div>
                        <div style={{ padding: 12, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ESTIMATED HARVEST</span>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{estHarvest}</div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{daysToHarvest != null ? `${daysToHarvest} days remaining (estimate)` : 'Planting date unavailable'}</span>
                        </div>
                        <div style={{ padding: 12, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>SOIL COMPOSITION & pH</span>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{viewField.soil_type || 'Soil type unavailable'} • pH {viewField.soil_ph == null ? 'Unavailable' : Number(viewField.soil_ph).toFixed(1)}</div>
                        </div>
                        <div style={{ padding: 12, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>IRRIGATION & MOISTURE</span>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                            {viewField.irrigation_method || 'Not specified'} • {moistureDisplay} moisture
                          </div>
                        </div>
                        <div style={{ gridColumn: 'span 2', padding: 12, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>GEOSPATIAL COORDINATES</span>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                            {viewField.latitude != null && viewField.longitude != null
                              ? `📍 ${Number(viewField.latitude).toFixed(4)}° N, ${Number(viewField.longitude).toFixed(4)}° E`
                              : 'Parcel coordinates not registered'}
                          </div>
                        </div>
                      </div>

                      {viewField.notes && (
                        <div style={{ padding: 12, borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>AGRONOMIC NOTES</span>
                          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>{viewField.notes}</p>
                        </div>
                      )}

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
                    </>
                  ) : dossierTab === 'predictions' ? (
                    <div>
                      {(!dossierData?.predictions || dossierData.predictions.length === 0) ? (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                          No recorded yield forecasts for this parcel yet.
                        </div>
                      ) : (
                        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                          <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '6px 8px' }}>Date</th>
                                <th style={{ padding: '6px 8px' }}>Expected Yield</th>
                                <th style={{ padding: '6px 8px' }}>Confidence</th>
                                <th style={{ padding: '6px 8px' }}>Risk</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dossierData.predictions.map((p, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                  <td style={{ padding: '8px 8px' }}>{new Date(p.created_at || Date.now()).toLocaleDateString('en-IN')}</td>
                                  <td style={{ padding: '8px 8px', fontWeight: 700, color: '#10b981' }}>{p.predicted_yield} t/ha</td>
                                  <td style={{ padding: '8px 8px' }}>{p.confidence != null ? `${Math.round(p.confidence)}%` : '—'}</td>
                                  <td style={{ padding: '8px 8px' }}>
                                    <Badge variant={p.risk_level?.toLowerCase() === 'high' ? 'critical' : 'success'} size="sm">
                                      {p.risk_level || 'Normal'}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : dossierTab === 'soil' ? (
                    <div>
                      {(!dossierData?.soil_records || dossierData.soil_records.length === 0) ? (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                          No edaphic sensor recordings found for this parcel.
                        </div>
                      ) : (
                        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                          <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '6px 8px' }}>Date</th>
                                <th style={{ padding: '6px 8px' }}>pH</th>
                                <th style={{ padding: '6px 8px' }}>Moisture</th>
                                <th style={{ padding: '6px 8px' }}>NPK (kg/ha)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dossierData.soil_records.map((s, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                  <td style={{ padding: '8px 8px' }}>{new Date(s.recorded_at || Date.now()).toLocaleDateString('en-IN')}</td>
                                  <td style={{ padding: '8px 8px' }}>{s.soil_ph != null ? Number(s.soil_ph).toFixed(1) : '—'}</td>
                                  <td style={{ padding: '8px 8px' }}>{s.soil_moisture != null ? `${Number(s.soil_moisture).toFixed(0)}%` : '—'}</td>
                                  <td style={{ padding: '8px 8px' }}>{s.nitrogen ?? '—'} / {s.phosphorus ?? '—'} / {s.potassium ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : dossierTab === 'crop' ? (
                    <div>
                      {(!dossierData?.crop_records || dossierData.crop_records.length === 0) ? (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                          No phenology crop observations recorded for this parcel.
                        </div>
                      ) : (
                        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                          <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '6px 8px' }}>Date</th>
                                <th style={{ padding: '6px 8px' }}>Stage</th>
                                <th style={{ padding: '6px 8px' }}>Height</th>
                                <th style={{ padding: '6px 8px' }}>Canopy</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dossierData.crop_records.map((c, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                  <td style={{ padding: '8px 8px' }}>{new Date(c.recorded_at || Date.now()).toLocaleDateString('en-IN')}</td>
                                  <td style={{ padding: '8px 8px', fontWeight: 600 }}>{c.crop_stage || '—'}</td>
                                  <td style={{ padding: '8px 8px' }}>{c.plant_height != null ? `${c.plant_height} cm` : '—'}</td>
                                  <td style={{ padding: '8px 8px' }}>{c.canopy_coverage != null ? `${c.canopy_coverage}%` : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {(!dossierData?.alerts || dossierData.alerts.length === 0) ? (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                          No alerts generated for this parcel.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                          {dossierData.alerts.map((a, i) => (
                            <div key={i} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{a.title}</strong>
                                <Badge variant={a.severity === 'critical' ? 'critical' : a.severity === 'warning' ? 'warning' : 'default'} size="sm">
                                  {a.severity}
                                </Badge>
                              </div>
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{a.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </Modal>
        )}

      </div>
    </AppLayout>
  );
}
