import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  Sparkles,
  History,
  Sliders,
  Sprout,
  Layers,
  CloudSun,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Zap,
  MapPin,
  Calendar,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Search,
  Trash2,
  Eye,
  FileText,
  RotateCcw,
  Loader2,
  Activity,
  Dna,
  Bell
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useField } from '../context/FieldContext';
import { mlApi, predictionApi, farmApi, weatherApi } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const VARIETIES = ['Co 86032', 'Co 0238', 'CoC 671', 'Co 99004', 'CoM 0265'];
const SOIL_TYPES = ['Black Soil', 'Alluvial Soil', 'Red Loam', 'Clay Loam', 'Sandy Loam'];
const GROWTH_STAGES = ['Planting', 'Germination', 'Tillering', 'Grand Growth', 'Maturity', 'Harvest'];
const STATES = [
  'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Gujarat',
  'Andhra Pradesh', 'Bihar', 'Punjab', 'Haryana', 'Madhya Pradesh', 'Telangana'
];

export default function PredictionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedFarm, selectedField, setSelectedPrediction } = useField();

  const [activeTab, setActiveTab] = useState('predict'); // 'predict' | 'history'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  // Farms and fields for pre-filling
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState('');

  // 11 Core Agronomic Inputs
  const [formData, setFormData] = useState({
    location: 'Kolhapur, Maharashtra',
    variety: 'Co 86032',
    area: '2.5',
    soil_type: 'Black Soil',
    soil_ph: '7.2',
    soil_moisture: '62.0',
    rainfall: '1200.0',
    temperature: '29.5',
    humidity: '70.0',
    planting_date: '2025-10-15',
    crop_growth_stage: 'Grand Growth',
    historical_yield: '95.0'
  });

  // Data Quality state
  const [dataQuality, setDataQuality] = useState(null);
  const [dqChecking, setDqChecking] = useState(false);

  // History state
  const [historyList, setHistoryList] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyVariety, setHistoryVariety] = useState('');
  const [historyRisk, setHistoryRisk] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [graphData, setGraphData] = useState([]);
  const [detailsModal, setDetailsModal] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Helper to fetch live weather for a location and update formData
  const fetchWeatherForLocation = async (loc) => {
    try {
      const wRes = await weatherApi.current(loc || 'Kolhapur');
      const w = wRes.data;
      if (w) {
        setFormData(prev => ({
          ...prev,
          temperature: w.temperature ? String(w.temperature) : prev.temperature,
          rainfall: w.rainfall !== undefined && w.rainfall !== null ? String(Math.max(w.rainfall, 800)) : prev.rainfall,
          humidity: w.humidity ? String(w.humidity) : prev.humidity
        }));
      }
    } catch {
      // Fallback cleanly
    }
  };

  // Load farms & fields for autofill + parse URL search params
  useEffect(() => {
    farmApi.list()
      .then(res => {
        const list = res.data?.farms || [];
        setFarms(list);

        const paramFarmId = searchParams.get('farm_id');
        const paramFieldId = searchParams.get('field_id');
        const paramVariety = searchParams.get('variety');

        if (paramVariety && VARIETIES.includes(paramVariety)) {
          setFormData(prev => ({ ...prev, variety: paramVariety }));
        }

        const activeF = paramFarmId ? (list.find(f => String(f.id) === String(paramFarmId)) || list[0]) : (selectedFarm || list[0]);
        if (activeF) {
          setSelectedFarmId(String(activeF.id));
          setFormData(prev => ({
            ...prev,
            location: activeF.location || `${activeF.district}, ${activeF.state}`,
            area: activeF.total_area ? String(activeF.total_area) : prev.area
          }));
          fetchWeatherForLocation(activeF.location || activeF.district);

          const activeFld = paramFieldId
            ? (activeF.fields || []).find(fld => String(fld.id) === String(paramFieldId))
            : (selectedField || activeF.fields?.[0]);

          if (activeFld) {
            setSelectedFieldId(String(activeFld.id));
            setFormData(prev => ({
              ...prev,
              variety: activeFld.sugarcane_variety || prev.variety,
              area: activeFld.area ? String(activeFld.area) : prev.area,
              soil_type: activeFld.soil_type || prev.soil_type,
              soil_ph: activeFld.soil_ph ? String(activeFld.soil_ph) : prev.soil_ph,
              soil_moisture: activeFld.soil_moisture ? String(activeFld.soil_moisture) : prev.soil_moisture,
            }));
          }
        }
      })
      .catch(() => {});
  }, [searchParams, selectedFarm, selectedField]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFarmSelect = (e) => {
    const fid = e.target.value;
    setSelectedFarmId(fid);
    setSelectedFieldId('');

    const f = farms.find(farm => String(farm.id) === String(fid));
    if (f) {
      setFormData(prev => ({
        ...prev,
        location: f.location || `${f.district}, ${f.state}`,
        area: f.total_area ? String(f.total_area) : prev.area
      }));
      fetchWeatherForLocation(f.location || f.district);

      if (f.fields?.length > 0) {
        const firstField = f.fields[0];
        setSelectedFieldId(String(firstField.id));
        setFormData(prev => ({
          ...prev,
          variety: firstField.sugarcane_variety || prev.variety,
          area: firstField.area ? String(firstField.area) : prev.area,
          soil_type: firstField.soil_type || prev.soil_type,
          soil_ph: firstField.soil_ph ? String(firstField.soil_ph) : prev.soil_ph,
          soil_moisture: firstField.soil_moisture ? String(firstField.soil_moisture) : prev.soil_moisture,
        }));
      }
    }
  };

  const handleFieldSelect = (e) => {
    const fieldId = e.target.value;
    setSelectedFieldId(fieldId);
    const f = farms.find(farm => String(farm.id) === String(selectedFarmId));
    if (f && f.fields) {
      const fld = f.fields.find(fl => String(fl.id) === String(fieldId));
      if (fld) {
        setFormData(prev => ({
          ...prev,
          variety: fld.sugarcane_variety || prev.variety,
          area: fld.area ? String(fld.area) : prev.area,
          soil_type: fld.soil_type || prev.soil_type,
          soil_ph: fld.soil_ph ? String(fld.soil_ph) : prev.soil_ph,
          soil_moisture: fld.soil_moisture ? String(fld.soil_moisture) : prev.soil_moisture,
        }));
      }
    }
  };

  // Data Quality check
  const checkDataQuality = async () => {
    setDqChecking(true);
    try {
      const payload = {
        temperature: parseFloat(formData.temperature) || 29.5,
        rainfall: parseFloat(formData.rainfall) || 1200,
        humidity: parseFloat(formData.humidity) || 70,
        soil_type: formData.soil_type,
        soil_ph: parseFloat(formData.soil_ph) || 7.2,
        soil_moisture: parseFloat(formData.soil_moisture) || 60,
        variety: formData.variety,
        historical_yield: parseFloat(formData.historical_yield) || 95
      };
      const res = await mlApi.dataQuality(payload);
      setDataQuality(res.data);
      if (res.data?.is_ready_for_prediction) {
        toast.success(`Data Quality: ${res.data.quality_score}/100 - Ready for prediction!`);
      } else {
        toast.error(`Data Quality: ${res.data.quality_score}/100 - Issues found.`);
      }
    } catch (e) {
      toast.error('Data quality check error: ' + e.message);
    } finally {
      setDqChecking(false);
    }
  };

  // Execute AI Yield Prediction
  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        ...formData,
        area_hectare: parseFloat(formData.area) || 1.0,
        rainfall_mm: parseFloat(formData.rainfall) || 1200.0,
        temperature_c: parseFloat(formData.temperature) || 29.5,
        humidity_pct: parseFloat(formData.humidity) || 70.0,
        soil_moisture: parseFloat(formData.soil_moisture) || 60.0,
        soil_ph: parseFloat(formData.soil_ph) || 7.0,
        historical_yield: parseFloat(formData.historical_yield) || 85.0,
        farm_id: selectedFarmId ? Number(selectedFarmId) : null,
        field_id: selectedFieldId ? Number(selectedFieldId) : null
      };

      const res = await mlApi.predict(payload);
      if (res.success && res.data) {
        setResult(res.data);
        if (typeof setSelectedPrediction === 'function') {
          setSelectedPrediction(res.data);
        }
        toast.success('Yield predicted & persisted to MySQL database!');
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      } else {
        toast.error(res.message || 'Prediction failed.');
      }
    } catch (err) {
      toast.error('Prediction Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load History & Graph Data
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = {};
      if (historySearch) params.search = historySearch;
      if (historyVariety) params.variety = historyVariety;
      if (historyRisk) params.risk = historyRisk;
      if (historyDateFrom) params.date_from = historyDateFrom;
      if (historyDateTo) params.date_to = historyDateTo;

      const [histRes, graphRes] = await Promise.all([
        predictionApi.list(params),
        predictionApi.historyGraph()
      ]);

      setHistoryList(histRes.data?.predictions || []);
      setGraphData(graphRes.data || []);
    } catch (err) {
      toast.error('Failed to load prediction history: ' + err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, historyVariety, historyRisk, historyDateFrom, historyDateTo]);

  const handleDeletePrediction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prediction record?')) return;
    try {
      await predictionApi.remove(id);
      toast.success('Prediction record deleted.');
      loadHistory();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const riskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#10b981';
    }
  };

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <span className="eyebrow">
              <Sparkles size={13} />
              AI Decision Support & Machine Learning
            </span>
            <h1 className="page-title">AI Sugarcane Yield Forecasting</h1>
            <p className="page-subtitle">
              Dual-model agronomic prediction engine powered by calibrated <strong>Random Forest & XGBoost Regressors</strong>.
              Pure soil, weather & varietal features without NDVI/satellite dependencies.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className={`btn ${activeTab === 'predict' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('predict')}
            >
              <Sparkles size={16} />
              <span>New Forecast</span>
            </button>
            <button
              className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} />
              <span>Forecast History & Audit</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: RUN PREDICTION */}
        {/* ========================================================================= */}
        {activeTab === 'predict' && (
          <div className="prediction-flow">
            {/* Quick Prefill Section */}
            <div className="card" style={{ marginBottom: 22, padding: '16px 20px', background: 'var(--bg-panel)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Quick Autofill from Saved Holdings:</strong>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>
                      Select a farm to automatically populate soil test readings, variety, and location data
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <select
                    className="form-control"
                    value={selectedFarmId}
                    onChange={handleFarmSelect}
                    style={{ minWidth: 200, padding: '7px 12px', fontSize: 13 }}
                  >
                    <option value="">-- Choose Farm --</option>
                    {farms.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.district || f.location})</option>
                    ))}
                  </select>

                  {selectedFarmId && (
                    <select
                      className="form-control"
                      value={selectedFieldId}
                      onChange={handleFieldSelect}
                      style={{ minWidth: 200, padding: '7px 12px', fontSize: 13 }}
                    >
                      <option value="">-- Choose Field / Plot --</option>
                      {(farms.find(f => String(f.id) === String(selectedFarmId))?.fields || []).map(fld => (
                        <option key={fld.id} value={fld.id}>{fld.name} ({fld.sugarcane_variety})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Inputs Form */}
            <form onSubmit={handlePredict}>
              <div className="card" style={{ padding: '24px 26px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Agronomic Input Parameters (11 Multi-Sensor Factors)</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                      Evaluated simultaneously by trained Random Forest (R²=0.80) and XGBoost (R²=0.79) algorithms.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={checkDataQuality}
                    disabled={dqChecking}
                    style={{ padding: '7px 14px', fontSize: 12.5 }}
                  >
                    {dqChecking ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    <span>{dqChecking ? 'Auditing…' : 'Verify Telemetry Quality'}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                  {/* 1. Location */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <MapPin size={14} className="text-emerald-500" />
                      Location / District *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Kolhapur, Maharashtra"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>State / agro-climatic zone</small>
                  </div>

                  {/* 2. Variety */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Sprout size={14} className="text-emerald-500" />
                      Sugarcane Variety *
                    </label>
                    <select
                      name="variety"
                      value={formData.variety}
                      onChange={handleChange}
                      required
                    >
                      {VARIETIES.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Elite sucrose cultivar</small>
                  </div>

                  {/* 3. Area */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Activity size={14} className="text-emerald-500" />
                      Field Area (Hectares) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="1000"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      placeholder="e.g. 2.5"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Cultivated plot surface</small>
                  </div>

                  {/* 4. Soil Type */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Layers size={14} className="text-emerald-500" />
                      Soil Classification *
                    </label>
                    <select
                      name="soil_type"
                      value={formData.soil_type}
                      onChange={handleChange}
                      required
                    >
                      {SOIL_TYPES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Physicochemical soil texture</small>
                  </div>

                  {/* 5. Soil pH */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Layers size={14} className="text-emerald-500" />
                      Soil pH Level (4.5 - 9.5) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="4.5"
                      max="9.5"
                      name="soil_ph"
                      value={formData.soil_ph}
                      onChange={handleChange}
                      placeholder="e.g. 7.2"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Optimal sugarcane band: 6.5 – 7.8</small>
                  </div>

                  {/* 6. Soil Moisture */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Activity size={14} className="text-emerald-500" />
                      Soil Moisture (%) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max="95"
                      name="soil_moisture"
                      value={formData.soil_moisture}
                      onChange={handleChange}
                      placeholder="e.g. 62.0"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Volumetric root zone moisture</small>
                  </div>

                  {/* 7. Rainfall */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <CloudSun size={14} className="text-emerald-500" />
                      Cumulative Precipitation (mm) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="100"
                      max="4000"
                      name="rainfall"
                      value={formData.rainfall}
                      onChange={handleChange}
                      placeholder="e.g. 1200"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Seasonal rainfall / effective irrigation</small>
                  </div>

                  {/* 8. Temperature */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <CloudSun size={14} className="text-emerald-500" />
                      Mean Temperature (°C) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="5"
                      max="55"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      placeholder="e.g. 29.5"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Day-night average temperature</small>
                  </div>

                  {/* 9. Humidity */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <CloudSun size={14} className="text-emerald-500" />
                      Relative Humidity (%) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="15"
                      max="100"
                      name="humidity"
                      value={formData.humidity}
                      onChange={handleChange}
                      placeholder="e.g. 70"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Atmospheric vapor pressure index</small>
                  </div>

                  {/* 10. Planting Date */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Calendar size={14} className="text-emerald-500" />
                      Planting Date *
                    </label>
                    <input
                      type="date"
                      name="planting_date"
                      value={formData.planting_date}
                      onChange={handleChange}
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Date setts/ratoon planted</small>
                  </div>

                  {/* 11. Growth Stage */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <Sprout size={14} className="text-emerald-500" />
                      Current Phenology Stage *
                    </label>
                    <select
                      name="crop_growth_stage"
                      value={formData.crop_growth_stage}
                      onChange={handleChange}
                      required
                    >
                      {GROWTH_STAGES.map(gs => (
                        <option key={gs} value={gs}>{gs}</option>
                      ))}
                    </select>
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Active developmental lifecycle phase</small>
                  </div>

                  {/* 12. Historical Yield */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 6 }}>
                      <TrendingUp size={14} className="text-emerald-500" />
                      Previous Year Yield (t/ha) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="30"
                      max="220"
                      name="historical_yield"
                      value={formData.historical_yield}
                      onChange={handleChange}
                      placeholder="e.g. 95.0"
                      required
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, display: 'block' }}>Last season's actual harvest yield for this field/block</small>
                  </div>
                </div>

                {/* Data Quality Report Card if checked */}
                {dataQuality && (
                  <div style={{
                    marginTop: 20,
                    padding: 16,
                    borderRadius: 12,
                    background: dataQuality.quality_score >= 80 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    border: `1px solid ${dataQuality.quality_score >= 80 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <strong style={{ color: dataQuality.quality_score >= 80 ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShieldCheck size={16} /> Server Audit: {dataQuality.quality_score}/100 ({dataQuality.status})
                      </strong>
                      <Badge variant={dataQuality.quality_score >= 80 ? 'success' : 'warning'}>
                        {dataQuality.is_ready_for_prediction ? 'Passed Validation' : 'Review Inputs'}
                      </Badge>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 13 }}>
                      {dataQuality.checklist.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{c.passed ? '✅' : '⚠️'}</span>
                          <span style={{ fontWeight: 600 }}>{c.item}:</span>
                          <span style={{ color: 'var(--text-muted)' }}>{c.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <div style={{ marginTop: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700 }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Running Random Forest & XGBoost Models…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Run Dual-Model Yield Prediction</span>
                      </>
                    )}
                  </button>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Calculated using trained ensemble models and saved directly into MySQL database.
                  </span>
                </div>
              </div>
            </form>

            {/* Loading Indicator */}
            {loading && (
              <div className="card" style={{ padding: '36px 24px', textAlign: 'center', marginBottom: 24, background: 'var(--bg-panel)' }}>
                <div style={{ width: 54, height: 54, borderRadius: 16, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Cpu size={28} className="animate-pulse" />
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>Executing AI Yield Inference…</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13.5 }}>
                  Passing 11 agronomic telemetry parameters through trained Random Forest and XGBoost regressors.
                </p>
              </div>
            )}

            {/* Results Section */}
            {result && (
              <div ref={resultRef} className="prediction-results" style={{ marginTop: 10 }}>
                {/* Result Hero Header */}
                <div style={{
                  padding: '28px 32px',
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, #09261a 0%, #0d3b27 50%, #064e3b 100%)',
                  color: '#ffffff',
                  marginBottom: 24,
                  boxShadow: '0 16px 36px -8px rgba(6, 78, 59, 0.4)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '4px 10px', borderRadius: 9999, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6ee7b7', fontWeight: 700, marginBottom: 12 }}>
                        <Sparkles size={12} />
                        FORECAST GENERATED VIA {result.model_used?.toUpperCase() || 'DUAL ENSEMBLE'}
                      </div>
                      <h2 style={{ fontSize: 40, margin: '0 0 8px', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 10 }}>
                        {result.predicted_yield} <span style={{ fontSize: 20, fontWeight: 500, color: '#a7f3d0' }}>tonnes / hectare</span>
                      </h2>
                      <p style={{ margin: 0, fontSize: 15, color: '#d1fae5' }}>
                        For <strong>{formData.variety}</strong> in <strong>{formData.location}</strong> ({formData.area} ha total surface)
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: 14, textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        <span style={{ fontSize: 11, color: '#a7f3d0', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Expected Production</span>
                        <strong style={{ fontSize: 24, color: '#ffffff' }}>{result.expected_production} t</strong>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: 14, textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        <span style={{ fontSize: 11, color: '#a7f3d0', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Model Confidence</span>
                        <strong style={{ fontSize: 24, color: '#34d399' }}>{result.confidence}%</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Outputs Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                  <div className="card" style={{ padding: 18 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Expected Yield Range</span>
                    <h3 style={{ margin: '6px 0', fontSize: 22, color: 'var(--text-primary)' }}>
                      {result.expected_range?.low} – {result.expected_range?.high} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>t/ha</span>
                    </h3>
                    <small style={{ color: '#10b981', fontWeight: 600 }}>±92% confidence boundary</small>
                  </div>

                  <div className="card" style={{ padding: 18 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Expected Production</span>
                    <h3 style={{ margin: '6px 0', fontSize: 22, color: 'var(--text-primary)' }}>
                      {result.expected_production} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Tonnes</span>
                    </h3>
                    <small style={{ color: 'var(--text-muted)' }}>{result.predicted_yield} t/ha × {formData.area} ha</small>
                  </div>

                  <div className="card" style={{ padding: 18 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Risk Assessment</span>
                    <h3 style={{ margin: '6px 0', fontSize: 22, color: riskColor(result.risk) }}>
                      {result.risk} Risk
                    </h3>
                    <small style={{ color: 'var(--text-muted)' }}>Based on yield loss vulnerability</small>
                  </div>

                  <div className="card" style={{ padding: 18 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Yield Loss Deficit</span>
                    <h3 style={{ margin: '6px 0', fontSize: 22, color: result.loss_percentage > 20 ? '#ea580c' : '#10b981' }}>
                      {result.loss_percentage}%
                    </h3>
                    <small style={{ color: 'var(--text-muted)' }}>Benchmark: {result.reference_yield} t/ha potential</small>
                  </div>
                </div>

                {/* Model Consensus & Comparison */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
                  <div className="card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>Dual Algorithm Consensus</h3>
                      <Badge variant="success">Trained Weights</Badge>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
                      Both algorithms evaluate your telemetry simultaneously without hardcoded formulas.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div style={{ padding: 14, borderRadius: 12, background: 'var(--border-subtle)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>🌲 Random Forest Regressor</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
                          {result.models_comparison?.random_forest} t/ha
                        </div>
                        <small style={{ color: '#10b981', fontWeight: 600 }}>5-Fold CV Score: R²=0.8005</small>
                      </div>

                      <div style={{ padding: 14, borderRadius: 12, background: 'var(--border-subtle)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>🚀 XGBoost Regressor</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
                          {result.models_comparison?.xgboost} t/ha
                        </div>
                        <small style={{ color: '#0ea5e9', fontWeight: 600 }}>5-Fold CV Score: R²=0.7936</small>
                      </div>
                    </div>

                    <div style={{ marginTop: 14, padding: 10, background: 'rgba(14, 165, 233, 0.08)', borderRadius: 8, fontSize: 12.5, color: '#0284c7', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                      Ensemble agreement is <strong>{result.confidence}%</strong>. Prediction record saved under ID #{result.prediction_id}.
                    </div>
                  </div>

                  {/* Feature Importance Bar Chart */}
                  <div className="card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>Agronomic Feature Contributions</h3>
                      <Badge variant="info">Model Weights</Badge>
                    </div>
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart
                        data={(result.feature_importance || []).slice(0, 6)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(226, 232, 240, 0.6)" />
                        <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={90} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Importance']} />
                        <Bar dataKey="pct" fill="#10b981" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Explainable AI Factors */}
                {result.explainable_ai && (
                  <div className="card" style={{ padding: 22, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ margin: 0, fontSize: 16 }}>Explainable AI (XAI) Agronomic Diagnosis</h3>
                      <Badge variant="success">Evidence Based</Badge>
                    </div>
                    <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 13.5 }}>
                      {result.explainable_ai.summary}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                      {/* Positive Drivers */}
                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: 16, borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <h4 style={{ margin: '0 0 10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                          <CheckCircle2 size={16} /> Positive Yield Drivers
                        </h4>
                        {(result.explainable_ai.positive_factors || []).length === 0 ? (
                          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No strong positive drivers detected.</p>
                        ) : (
                          (result.explainable_ai.positive_factors || []).map((p, idx) => (
                            <div key={idx} style={{ marginBottom: 8, fontSize: 12.5 }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{p.factor} ({p.value}):</strong> {p.note}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Limiting Factors */}
                      <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: 16, borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                        <h4 style={{ margin: '0 0 10px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                          <AlertTriangle size={16} /> Limiting / Deficit Factors
                        </h4>
                        {(result.explainable_ai.negative_factors || []).length === 0 ? (
                          <p style={{ fontSize: 13, color: '#10b981' }}>All agronomic parameters are within acceptable bands.</p>
                        ) : (
                          (result.explainable_ai.negative_factors || []).map((n, idx) => (
                            <div key={idx} style={{ marginBottom: 8, fontSize: 12.5 }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{n.factor} ({n.value}):</strong> {n.note}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Connected Workflow Actions Navigator */}
                <div className="card" style={{ padding: 22, background: 'var(--bg-panel)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Connected Decision Support Modules</h3>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
                        Proceed directly to loss audits, simulations, variety intelligence, and reporting.
                      </p>
                    </div>
                    <Badge variant="success">Workflow Active</Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => navigate(`/yield-loss?prediction_id=${result.prediction_id || ''}`)}
                      style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>📉 Yield Loss Audit</span>
                      <small style={{ color: 'var(--text-muted)', marginTop: 4 }}>Quantify tonnage gap & risk mitigation</small>
                    </button>

                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => navigate(`/simulator?prediction_id=${result.prediction_id || ''}`)}
                      style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>🔮 What-If Simulator</span>
                      <small style={{ color: 'var(--text-muted)', marginTop: 4 }}>Simulate rainfall & fertilizer shifts</small>
                    </button>

                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => navigate('/varieties')}
                      style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>🔬 Variety Genetics</span>
                      <small style={{ color: 'var(--text-muted)', marginTop: 4 }}>Compare elite sugarcane cultivars</small>
                    </button>

                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => navigate('/alerts')}
                      style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>🔔 Early Warnings</span>
                      <small style={{ color: 'var(--text-muted)', marginTop: 4 }}>Review automated agro-stress alerts</small>
                    </button>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => navigate(`/reports?farm_id=${selectedFarmId || ''}&field_id=${selectedFieldId || ''}`)}
                      style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>📄 Export PDF Dossier</span>
                      <small style={{ color: '#d1fae5', marginTop: 4 }}>Generate printable agronomic report</small>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PREDICTION HISTORY & ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div className="history-flow">
            {/* Historical Trend Graph */}
            <div className="card" style={{ marginBottom: 24, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Temporal Yield Progression</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                    Chronological evaluation of predicted yields across your evaluated farms and seasons.
                  </p>
                </div>
                <Badge variant="success">MySQL Audit Trail</Badge>
              </div>

              {graphData.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No historical prediction data points recorded yet. Run your first forecast above!
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 232, 240, 0.6)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis unit=" t" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip formatter={(v, n) => [n === 'yield' ? `${v} t/ha` : `${v} t`, n === 'yield' ? 'Predicted Yield' : 'Production']} />
                    <Legend />
                    <Line type="monotone" dataKey="yield" stroke="#10b981" strokeWidth={2.5} name="Yield (t/ha)" activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="production" stroke="#0ea5e9" strokeWidth={1.8} name="Total Production (t)" strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Filter and Search Bar */}
            <div className="card" style={{ marginBottom: 24, padding: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <input
                  type="text"
                  placeholder="🔍 Search farm, field, location…"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadHistory()}
                />

                <select
                  value={historyVariety}
                  onChange={e => setHistoryVariety(e.target.value)}
                >
                  <option value="">All Varieties</option>
                  {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>

                <select
                  value={historyRisk}
                  onChange={e => setHistoryRisk(e.target.value)}
                >
                  <option value="">All Risk Levels</option>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                  <option value="Critical">Critical Risk</option>
                </select>

                <input
                  type="date"
                  value={historyDateFrom}
                  onChange={e => setHistoryDateFrom(e.target.value)}
                  title="From Date"
                />

                <input
                  type="date"
                  value={historyDateTo}
                  onChange={e => setHistoryDateTo(e.target.value)}
                  title="To Date"
                />

                <button className="btn-outline" onClick={loadHistory}>
                  <span>Apply Filters</span>
                </button>
              </div>
            </div>

            {/* History Table */}
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Prediction History ({historyList.length})</h3>
                <Badge variant="info">Persistent Storage</Badge>
              </div>

              {historyLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading prediction records…</div>
              ) : historyList.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No prediction records match your query.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Farm / Location</th>
                        <th>Field</th>
                        <th>Variety</th>
                        <th>Yield (t/ha)</th>
                        <th>Production (t)</th>
                        <th>Confidence</th>
                        <th>Risk</th>
                        <th>Loss Deficit</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyList.map(r => (
                        <tr key={r.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {r.created_at ? r.created_at.slice(0, 10) : '—'}
                          </td>
                          <td>
                            <strong>{r.farm_name || r.location}</strong>
                          </td>
                          <td>{r.field_name || 'Plot'}</td>
                          <td>
                            <Badge variant="success" size="sm">{r.variety}</Badge>
                          </td>
                          <td style={{ fontWeight: 700, color: '#10b981' }}>
                            {Number(r.predicted_yield).toFixed(1)}
                          </td>
                          <td>
                            {Number(r.expected_production || 0).toFixed(1)}
                          </td>
                          <td>{r.confidence}%</td>
                          <td>
                            <Badge variant={r.risk_level?.toLowerCase() || r.risk?.toLowerCase() || 'low'} size="sm">
                              {r.risk_level || r.risk || 'Low'}
                            </Badge>
                          </td>
                          <td style={{ color: (r.loss_percentage || r.expected_loss) > 20 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                            {Number(r.loss_percentage || r.expected_loss || 0).toFixed(1)}%
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <button
                              className="btn-outline"
                              style={{ padding: '4px 8px', fontSize: 12, marginRight: 6 }}
                              onClick={() => setDetailsModal(r)}
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                            <button
                              className="btn-outline"
                              style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              onClick={() => handleDeletePrediction(r.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Details Modal */}
            <Modal
              isOpen={Boolean(detailsModal)}
              onClose={() => setDetailsModal(null)}
              title={`Prediction Record #${detailsModal?.id}`}
              subtitle="Full audited agronomic parameters and model outputs"
              footer={
                <button className="btn-primary" onClick={() => setDetailsModal(null)}>
                  Close Details
                </button>
              }
            >
              {detailsModal && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 13, marginBottom: 16 }}>
                    <div><strong>Date:</strong> {detailsModal.created_at?.slice(0, 10)}</div>
                    <div><strong>Farm:</strong> {detailsModal.farm_name || detailsModal.location}</div>
                    <div><strong>Field:</strong> {detailsModal.field_name || 'Plot'}</div>
                    <div><strong>Variety:</strong> {detailsModal.variety}</div>
                    <div><strong>Area:</strong> {detailsModal.area} ha</div>
                    <div><strong>Predicted Yield:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>{detailsModal.predicted_yield} t/ha</span></div>
                    <div><strong>Expected Production:</strong> {detailsModal.expected_production} t</div>
                    <div><strong>Confidence:</strong> {detailsModal.confidence}%</div>
                    <div><strong>Risk Level:</strong> {detailsModal.risk_level || detailsModal.risk}</div>
                    <div><strong>Loss Deficit:</strong> {detailsModal.loss_percentage || detailsModal.expected_loss}%</div>
                  </div>

                  {detailsModal.explanation && (
                    <div style={{ background: 'var(--border-subtle)', padding: 14, borderRadius: 10, fontSize: 12.5 }}>
                      <strong>AI Agronomic Explanation:</strong>
                      <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>{detailsModal.explanation.summary}</p>
                    </div>
                  )}
                </div>
              )}
            </Modal>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
