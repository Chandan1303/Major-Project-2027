import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { mlApi, predictionApi, farmApi } from '../services/api';
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

  // Load farms & fields for autofill
  useEffect(() => {
    farmApi.list()
      .then(res => {
        const list = res.data?.farms || [];
        setFarms(list);
      })
      .catch(() => {});
  }, []);

  // Pre-fill when Farm/Field is selected
  const handleFarmSelect = (e) => {
    const fid = e.target.value;
    setSelectedFarmId(fid);
    setSelectedFieldId('');

    const farm = farms.find(f => String(f.id) === String(fid));
    if (farm) {
      setFormData(prev => ({
        ...prev,
        location: farm.location || `${farm.district}, ${farm.state}`,
        area: farm.total_area ? String(farm.total_area) : prev.area
      }));
    }
  };

  const handleFieldSelect = (e) => {
    const flid = e.target.value;
    setSelectedFieldId(flid);

    const farm = farms.find(f => String(f.id) === String(selectedFarmId));
    if (farm && farm.fields) {
      const field = farm.fields.find(fld => String(fld.id) === String(flid));
      if (field) {
        setFormData(prev => ({
          ...prev,
          variety: field.sugarcane_variety || prev.variety,
          area: field.area ? String(field.area) : prev.area,
          soil_type: field.soil_type || prev.soil_type,
          soil_ph: field.soil_ph ? String(field.soil_ph) : prev.soil_ph,
          soil_moisture: field.soil_moisture ? String(field.soil_moisture) : prev.soil_moisture,
          planting_date: field.planting_date ? String(field.planting_date).slice(0, 10) : prev.planting_date
        }));
        toast.success(`Loaded agronomic data from field: ${field.name}`);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Run Data Quality Verification
  const checkDataQuality = async () => {
    setDqChecking(true);
    try {
      const res = await mlApi.dataQuality({
        ...formData,
        area: Number(formData.area),
        soil_ph: Number(formData.soil_ph),
        soil_moisture: Number(formData.soil_moisture),
        rainfall: Number(formData.rainfall),
        temperature: Number(formData.temperature),
        historical_yield: Number(formData.historical_yield)
      });
      setDataQuality(res.data);
      if (res.data?.quality_score >= 80) {
        toast.success(`Data Quality Score: ${res.data.quality_score}/100 — Ready for prediction!`);
      } else {
        toast.error(`Data Quality Warnings: Score ${res.data.quality_score}/100`);
      }
    } catch (err) {
      toast.error('Data quality check failed: ' + err.message);
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
        toast.success('Yield predicted & saved to MySQL!');
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
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
      toast.success('Prediction deleted.');
      loadHistory();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const riskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return '#16a34a';
      case 'medium': return '#f59e0b';
      case 'high': return '#ea580c';
      case 'critical': return '#dc2626';
      default: return '#2d7a3e';
    }
  };

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <p className="eyebrow">Artificial Intelligence & Decision Support</p>
            <h1 className="page-title">AI Sugarcane Yield Prediction</h1>
            <p className="page-subtitle">
              Dual-model forecasting using trained <strong>Random Forest & XGBoost Regressors</strong> with pure agronomic factors.
              Zero NDVI / satellite dependencies.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className={`btn ${activeTab === 'predict' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('predict')}
            >
              🎯 New Prediction
            </button>
            <button
              className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('history')}
            >
              📜 Prediction History & Analytics
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: RUN PREDICTION */}
        {/* ========================================================================= */}
        {activeTab === 'predict' && (
          <div className="prediction-flow">
            {/* Quick Prefill Section */}
            <div className="dash-panel" style={{ marginBottom: 20, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', color: '#1e293b' }}>⚡ Quick Autofill from Saved Farms & Fields</h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                    Select an existing farm to automatically fill soil test readings, variety, and location data.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <select
                    className="form-control"
                    value={selectedFarmId}
                    onChange={handleFarmSelect}
                    style={{ minWidth: 200, padding: '8px 12px' }}
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
                      style={{ minWidth: 200, padding: '8px 12px' }}
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

            {/* Inputs Form Grid */}
            <form onSubmit={handlePredict}>
              <div className="dash-panel" style={{ marginBottom: 24 }}>
                <div className="dash-panel-header" style={{ marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Agronomic Input Parameters (11 Factors)</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                      All inputs are evaluated by trained Random Forest (R²=0.80) and XGBoost (R²=0.79) algorithms.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={checkDataQuality}
                    disabled={dqChecking}
                    style={{ fontSize: 13 }}
                  >
                    {dqChecking ? 'Checking…' : '🔍 Verify Data Quality'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                  {/* 1. Location */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      📍 Location / District *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Kolhapur, Maharashtra"
                      required
                    />
                    <small style={{ color: '#64748b' }}>State / agro-climatic zone</small>
                  </div>

                  {/* 2. Variety */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      🌾 Sugarcane Variety *
                    </label>
                    <select
                      className="form-control"
                      name="variety"
                      value={formData.variety}
                      onChange={handleChange}
                      required
                    >
                      {VARIETIES.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    <small style={{ color: '#64748b' }}>Officially supported high-sucrose varieties</small>
                  </div>

                  {/* 3. Area */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      📐 Field Area (Hectares) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="1000"
                      className="form-control"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      placeholder="e.g. 2.5"
                      required
                    />
                    <small style={{ color: '#64748b' }}>Total plot surface in hectares</small>
                  </div>

                  {/* 4. Soil Type */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      🪨 Soil Classification *
                    </label>
                    <select
                      className="form-control"
                      name="soil_type"
                      value={formData.soil_type}
                      onChange={handleChange}
                      required
                    >
                      {SOIL_TYPES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <small style={{ color: '#64748b' }}>Texture and drainage behavior</small>
                  </div>

                  {/* 5. Soil pH */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      🧪 Soil pH Level * ({formData.soil_ph})
                    </label>
                    <input
                      type="range"
                      min="5.0"
                      max="9.0"
                      step="0.1"
                      name="soil_ph"
                      value={formData.soil_ph}
                      onChange={handleChange}
                      style={{ width: '100%', accentColor: '#2d7a3e' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                      <span>5.0 (Acidic)</span>
                      <span style={{ color: '#2d7a3e', fontWeight: 600 }}>6.5–7.8 (Optimal)</span>
                      <span>9.0 (Alkaline)</span>
                    </div>
                  </div>

                  {/* 6. Soil Moisture */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      💧 Soil Moisture (%) * ({formData.soil_moisture}%)
                    </label>
                    <input
                      type="range"
                      min="20.0"
                      max="90.0"
                      step="1"
                      name="soil_moisture"
                      value={formData.soil_moisture}
                      onChange={handleChange}
                      style={{ width: '100%', accentColor: '#2563eb' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                      <span>&lt;40% (Stress)</span>
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>50–70% (Adequate)</span>
                      <span>&gt;80% (Waterlog)</span>
                    </div>
                  </div>

                  {/* 7. Rainfall */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      🌧️ Annual / Crop Rainfall (mm) *
                    </label>
                    <input
                      type="number"
                      step="10"
                      min="100"
                      max="4000"
                      className="form-control"
                      name="rainfall"
                      value={formData.rainfall}
                      onChange={handleChange}
                      placeholder="e.g. 1200"
                      required
                    />
                    <small style={{ color: '#64748b' }}>Cumulative rainfall over crop lifecycle</small>
                  </div>

                  {/* 8. Temperature */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      🌡️ Mean Temperature (°C) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max="50"
                      className="form-control"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      placeholder="e.g. 29.5"
                      required
                    />
                    <small style={{ color: '#64748b' }}>Optimal growth window: 27°C to 34°C</small>
                  </div>

                  {/* 9. Humidity */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      💨 Relative Humidity (%) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="20"
                      max="100"
                      className="form-control"
                      name="humidity"
                      value={formData.humidity}
                      onChange={handleChange}
                      placeholder="e.g. 70"
                      required
                    />
                    <small style={{ color: '#64748b' }}>Average atmospheric relative humidity</small>
                  </div>

                  {/* 10. Planting Date */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      📅 Planting Date *
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      name="planting_date"
                      value={formData.planting_date}
                      onChange={handleChange}
                      required
                    />
                    <small style={{ color: '#64748b' }}>Date setts/ratoon planted</small>
                  </div>

                  {/* 11. Growth Stage */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      🌱 Current Phenology Stage *
                    </label>
                    <select
                      className="form-control"
                      name="crop_growth_stage"
                      value={formData.crop_growth_stage}
                      onChange={handleChange}
                      required
                    >
                      {GROWTH_STAGES.map(gs => (
                        <option key={gs} value={gs}>{gs}</option>
                      ))}
                    </select>
                    <small style={{ color: '#64748b' }}>Active developmental lifecycle phase</small>
                  </div>

                  {/* 12. Historical Yield */}
                  <div className="form-group">
                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      📊 Historical Baseline Yield (t/ha) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="30"
                      max="220"
                      className="form-control"
                      name="historical_yield"
                      value={formData.historical_yield}
                      onChange={handleChange}
                      placeholder="e.g. 95.0"
                      required
                    />
                    <small style={{ color: '#64748b' }}>Prior year field yield or local benchmark</small>
                  </div>
                </div>

                {/* Data Quality Report Card if checked */}
                {dataQuality && (
                  <div style={{
                    marginTop: 20,
                    padding: 16,
                    borderRadius: 10,
                    background: dataQuality.quality_score >= 80 ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${dataQuality.quality_score >= 80 ? '#bbf7d0' : '#fef08a'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <strong style={{ color: dataQuality.quality_score >= 80 ? '#166534' : '#854d0e' }}>
                        🛡️ Data Quality Audit: {dataQuality.quality_score}/100 ({dataQuality.status})
                      </strong>
                      <span className={`badge ${dataQuality.quality_score >= 80 ? 'badge-green' : 'badge-amber'}`}>
                        {dataQuality.is_ready_for_prediction ? 'Passed Validation' : 'Review Inputs'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 13 }}>
                      {dataQuality.checklist.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{c.passed ? '✅' : '⚠️'}</span>
                          <span style={{ fontWeight: 500 }}>{c.item}:</span>
                          <span style={{ color: '#64748b' }}>{c.status}</span>
                        </div>
                      ))}
                    </div>
                    {dataQuality.issues?.length > 0 && (
                      <div style={{ marginTop: 10, fontSize: 12, color: '#dc2626' }}>
                        {dataQuality.issues.map((iss, i) => <div key={i}>• {iss}</div>)}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit button */}
                <div style={{ marginTop: 24, display: 'flex', gap: 14, alignItems: 'center' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ padding: '12px 28px', fontSize: 16, fontWeight: 700 }}
                  >
                    {loading ? 'Running Random Forest & XGBoost Models…' : '🔮 Run AI Yield Prediction'}
                  </button>
                  <span style={{ fontSize: 13, color: '#64748b' }}>
                    Results are calculated using actual saved machine learning models and saved directly into MySQL.
                  </span>
                </div>
              </div>
            </form>

            {/* Results Section */}
            {result && (
              <div ref={resultRef} className="prediction-results" style={{ marginTop: 30 }}>
                {/* Result Hero Header */}
                <div style={{
                  padding: 24,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)',
                  color: '#fff',
                  marginBottom: 24,
                  boxShadow: '0 10px 25px -5px rgba(6, 78, 59, 0.25)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 12, letterSpacing: '1px', textTransform: 'uppercase', color: '#6ee7b7', fontWeight: 700 }}>
                        FORECAST GENERATED VIA {result.model_used?.toUpperCase()}
                      </span>
                      <h2 style={{ fontSize: 32, margin: '6px 0 10px', color: '#fff', fontWeight: 800 }}>
                        {result.predicted_yield} <span style={{ fontSize: 20, fontWeight: 400 }}>tonnes / hectare</span>
                      </h2>
                      <p style={{ margin: 0, fontSize: 15, color: '#a7f3d0' }}>
                        For <strong>{formData.variety}</strong> in <strong>{formData.location}</strong> ({formData.area} hectares total area)
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: 10, textAlign: 'center' }}>
                        <span style={{ fontSize: 11, color: '#d1fae5', textTransform: 'uppercase', display: 'block' }}>Expected Production</span>
                        <strong style={{ fontSize: 24, color: '#fff' }}>{result.expected_production} t</strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: 10, textAlign: 'center' }}>
                        <span style={{ fontSize: 11, color: '#d1fae5', textTransform: 'uppercase', display: 'block' }}>Model Confidence</span>
                        <strong style={{ fontSize: 24, color: '#6ee7b7' }}>{result.confidence}%</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Outputs Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                  {/* Expected Range */}
                  <div className="dash-panel" style={{ padding: 18 }}>
                    <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Expected Yield Range</span>
                    <h3 style={{ margin: '6px 0', fontSize: 22, color: '#1e293b' }}>
                      {result.expected_range?.low} – {result.expected_range?.high} <span style={{ fontSize: 14, color: '#64748b' }}>t/ha</span>
                    </h3>
                    <small style={{ color: '#10b981' }}>±92% confidence boundary</small>
                  </div>

                  {/* Production */}
                  <div className="dash-panel" style={{ padding: 18 }}>
                    <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Expected Production</span>
                    <h3 style={{ margin: '6px 0', fontSize: 22, color: '#1e293b' }}>
                      {result.expected_production} <span style={{ fontSize: 14, color: '#64748b' }}>Tonnes</span>
                    </h3>
                    <small style={{ color: '#64748b' }}>{result.predicted_yield} t/ha × {formData.area} ha</small>
                  </div>

                  {/* Risk Level */}
                  <div className="dash-panel" style={{ padding: 18 }}>
                    <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Risk Level</span>
                    <h3 style={{ margin: '6px 0', fontSize: 22, color: riskColor(result.risk) }}>
                      {result.risk} Risk
                    </h3>
                    <small style={{ color: '#64748b' }}>Based on yield loss vulnerability</small>
                  </div>

                  {/* Loss Percentage */}
                  <div className="dash-panel" style={{ padding: 18 }}>
                    <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Yield Loss Deficit</span>
                    <h3 style={{ margin: '6px 0', fontSize: 22, color: result.loss_percentage > 20 ? '#ea580c' : '#16a34a' }}>
                      {result.loss_percentage}%
                    </h3>
                    <small style={{ color: '#64748b' }}>Benchmark: {result.reference_yield} t/ha potential</small>
                  </div>
                </div>

                {/* Model Consensus & Comparison */}
                <div className="dash-two-col" style={{ marginBottom: 24 }}>
                  <div className="dash-panel">
                    <div className="dash-panel-header">
                      <h3>Machine Learning Model Comparison</h3>
                      <span className="badge badge-green">Trained Weights</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
                      Both algorithms run simultaneously on your exact inputs without hardcoded formulas.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div style={{ padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 12, color: '#64748b' }}>🌲 Random Forest Regressor</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '4px 0' }}>
                          {result.models_comparison?.random_forest} t/ha
                        </div>
                        <small style={{ color: '#16a34a' }}>5-Fold CV Score: R²=0.8005</small>
                      </div>

                      <div style={{ padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 12, color: '#64748b' }}>🚀 XGBoost Regressor</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '4px 0' }}>
                          {result.models_comparison?.xgboost} t/ha
                        </div>
                        <small style={{ color: '#2563eb' }}>5-Fold CV Score: R²=0.7936</small>
                      </div>
                    </div>

                    <div style={{ marginTop: 14, padding: 10, background: '#eff6ff', borderRadius: 8, fontSize: 12, color: '#1e40af' }}>
                      Ensemble agreement is <strong>{result.confidence}%</strong>. Prediction saved under ID #{result.prediction_id}.
                    </div>
                  </div>

                  {/* Feature Importance Bar Chart */}
                  <div className="dash-panel">
                    <div className="dash-panel-header">
                      <h3>Feature Contributions (Model Weights)</h3>
                      <span className="badge badge-blue">Agronomic Factors</span>
                    </div>
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart
                        data={(result.feature_importance || []).slice(0, 6)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" unit="%" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} width={90} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Importance']} />
                        <Bar dataKey="pct" fill="#2d7a3e" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Explainable AI Factors */}
                {result.explainable_ai && (
                  <div className="dash-panel" style={{ marginBottom: 24 }}>
                    <div className="dash-panel-header">
                      <h3>Explainable AI (XAI) Agronomic Diagnosis</h3>
                      <span className="badge badge-green">Evidence Based</span>
                    </div>
                    <p style={{ margin: '0 0 16px', color: '#475569', fontSize: 14 }}>
                      {result.explainable_ai.summary}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                      {/* Positive Drivers */}
                      <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 10, border: '1px solid #bbf7d0' }}>
                        <h4 style={{ margin: '0 0 10px', color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                          ✅ Positive Yield Drivers
                        </h4>
                        {(result.explainable_ai.positive_factors || []).length === 0 ? (
                          <p style={{ fontSize: 13, color: '#64748b' }}>No strong positive drivers detected.</p>
                        ) : (
                          (result.explainable_ai.positive_factors || []).map((p, idx) => (
                            <div key={idx} style={{ marginBottom: 8, fontSize: 13 }}>
                              <strong style={{ color: '#14532d' }}>{p.factor} ({p.value}):</strong> {p.note}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Limiting Factors */}
                      <div style={{ background: '#fef2f2', padding: 16, borderRadius: 10, border: '1px solid #fecaca' }}>
                        <h4 style={{ margin: '0 0 10px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
                          ⚠️ Limiting / Deficit Factors
                        </h4>
                        {(result.explainable_ai.negative_factors || []).length === 0 ? (
                          <p style={{ fontSize: 13, color: '#166534' }}>All agronomic parameters are within acceptable bands.</p>
                        ) : (
                          (result.explainable_ai.negative_factors || []).map((n, idx) => (
                            <div key={idx} style={{ marginBottom: 8, fontSize: 13 }}>
                              <strong style={{ color: '#7f1d1d' }}>{n.factor} ({n.value}):</strong> {n.note}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
            <div className="dash-panel" style={{ marginBottom: 24 }}>
              <div className="dash-panel-header">
                <div>
                  <h3 style={{ margin: 0 }}>Historical Prediction Trend</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                    Temporal progression of predicted yields across your evaluated farms and seasons.
                  </p>
                </div>
                <span className="badge badge-green">MySQL Persisted Data</span>
              </div>

              {graphData.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  No historical prediction data points yet. Run your first prediction above!
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis unit=" t" tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, n) => [n === 'yield' ? `${v} t/ha` : `${v} t`, n === 'yield' ? 'Predicted Yield' : 'Production']} />
                    <Legend />
                    <Line type="monotone" dataKey="yield" stroke="#2d7a3e" strokeWidth={2.5} name="Yield (t/ha)" activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="production" stroke="#2563eb" strokeWidth={1.5} name="Total Production (t)" strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Filter and Search Bar */}
            <div className="dash-panel" style={{ marginBottom: 24, padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="🔍 Search farm, field, location…"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadHistory()}
                />

                <select
                  className="form-control"
                  value={historyVariety}
                  onChange={e => setHistoryVariety(e.target.value)}
                >
                  <option value="">All Varieties</option>
                  {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>

                <select
                  className="form-control"
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
                  className="form-control"
                  value={historyDateFrom}
                  onChange={e => setHistoryDateFrom(e.target.value)}
                  title="From Date"
                />

                <input
                  type="date"
                  className="form-control"
                  value={historyDateTo}
                  onChange={e => setHistoryDateTo(e.target.value)}
                  title="To Date"
                />

                <button className="btn btn-outline" onClick={loadHistory}>
                  Apply Filters
                </button>
              </div>
            </div>

            {/* History Table */}
            <div className="dash-panel">
              <div className="dash-panel-header">
                <h3>Prediction History ({historyList.length})</h3>
                <span className="badge badge-blue">Complete Audit Trail</span>
              </div>

              {historyLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading prediction records…</div>
              ) : historyList.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  No prediction records match your query.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '10px 12px' }}>Date</th>
                        <th style={{ padding: '10px 12px' }}>Farm / Location</th>
                        <th style={{ padding: '10px 12px' }}>Field</th>
                        <th style={{ padding: '10px 12px' }}>Variety</th>
                        <th style={{ padding: '10px 12px' }}>Yield (t/ha)</th>
                        <th style={{ padding: '10px 12px' }}>Production (t)</th>
                        <th style={{ padding: '10px 12px' }}>Confidence</th>
                        <th style={{ padding: '10px 12px' }}>Risk</th>
                        <th style={{ padding: '10px 12px' }}>Loss %</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyList.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            {r.created_at ? r.created_at.slice(0, 10) : '—'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <strong>{r.farm_name || r.location}</strong>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{r.field_name || 'Plot'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className="badge badge-green">{r.variety}</span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#065f46' }}>
                            {Number(r.predicted_yield).toFixed(1)}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {Number(r.expected_production || 0).toFixed(1)}
                          </td>
                          <td style={{ padding: '10px 12px' }}>{r.confidence}%</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#fff',
                              background: riskColor(r.risk_level || r.risk)
                            }}>
                              {r.risk_level || r.risk || 'Low'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: (r.loss_percentage || r.expected_loss) > 20 ? '#dc2626' : '#16a34a' }}>
                            {Number(r.loss_percentage || r.expected_loss || 0).toFixed(1)}%
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: 12, marginRight: 6 }}
                              onClick={() => setDetailsModal(r)}
                            >
                              Details
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: 12, color: '#dc2626', borderColor: '#fca5a5' }}
                              onClick={() => handleDeletePrediction(r.id)}
                            >
                              Delete
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
            {detailsModal && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999, padding: 20
              }}>
                <div style={{ background: '#fff', borderRadius: 12, maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
                    <h3 style={{ margin: 0 }}>Prediction Record Details #{detailsModal.id}</h3>
                    <button className="btn btn-outline" onClick={() => setDetailsModal(null)} style={{ padding: '2px 8px' }}>✕</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 16 }}>
                    <div><strong>Date:</strong> {detailsModal.created_at?.slice(0, 10)}</div>
                    <div><strong>Farm:</strong> {detailsModal.farm_name || detailsModal.location}</div>
                    <div><strong>Field:</strong> {detailsModal.field_name || 'Plot'}</div>
                    <div><strong>Variety:</strong> {detailsModal.variety}</div>
                    <div><strong>Area:</strong> {detailsModal.area} ha</div>
                    <div><strong>Predicted Yield:</strong> {detailsModal.predicted_yield} t/ha</div>
                    <div><strong>Expected Production:</strong> {detailsModal.expected_production} t</div>
                    <div><strong>Confidence:</strong> {detailsModal.confidence}%</div>
                    <div><strong>Risk Level:</strong> {detailsModal.risk_level || detailsModal.risk}</div>
                    <div><strong>Loss Deficit:</strong> {detailsModal.loss_percentage || detailsModal.expected_loss}%</div>
                  </div>

                  {detailsModal.explanation && (
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                      <strong>AI Explanation:</strong>
                      <p style={{ margin: '4px 0 0' }}>{detailsModal.explanation.summary}</p>
                    </div>
                  )}

                  <div style={{ textAlign: 'right' }}>
                    <button className="btn btn-primary" onClick={() => setDetailsModal(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
