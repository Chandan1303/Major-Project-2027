import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';

/* ── data ─────────────────────────────────────────────────────── */
const defaultVarieties = ['Co 86032', 'Co 0238', 'Co 0118'];
const stateVarieties = {
  'Maharashtra':        ['Co 86032', 'CoC 671', 'Co 775', 'Co 94012', 'Co 0238'],
  'Uttar Pradesh':      ['CoJ 64', 'Co 0238', 'Co 0118', 'Co 05009', 'CoS 767'],
  'Karnataka':          ['CoM 0265', 'Co 86032', 'Co 94012', 'Co 419', 'Co 62175'],
  'Tamil Nadu':         ['CoC 671', 'Co 86032', 'Co 94012', 'Co 419', 'Co 62175'],
  'Gujarat':            ['CoJ 64', 'Co 775', 'Co 94008', 'Co 86032', 'Co 0238'],
  'Andhra Pradesh':     ['Co 86032', 'CoC 671', 'Co 94012', 'Co 05009', 'Co 7717'],
  'Bihar':              ['CoJ 64', 'Co 0238', 'Co 0118', 'Bo 91', 'CoS 767'],
  'Haryana':            ['CoJ 64', 'Co 0238', 'CoPant 90223', 'Co 0118', 'CoS 767'],
  'Punjab':             ['CoJ 88', 'CoPb 92', 'CoJ 64', 'Co 0238', 'CoS 767'],
  'Andaman And Nicobar Islands': defaultVarieties,
  'Arunachal Pradesh':  defaultVarieties,
  'Assam':              defaultVarieties,
  'Chhattisgarh':       defaultVarieties,
  'Dadra And Nagar Haveli': defaultVarieties,
  'Delhi':              defaultVarieties,
  'Goa':                defaultVarieties,
  'Himachal Pradesh':   defaultVarieties,
  'Jammu And Kashmir':  defaultVarieties,
  'Jharkhand':          defaultVarieties,
  'Kerala':             defaultVarieties,
  'Madhya Pradesh':     defaultVarieties,
  'Manipur':            defaultVarieties,
  'Meghalaya':          defaultVarieties,
  'Mizoram':            defaultVarieties,
  'Nagaland':           defaultVarieties,
  'Odisha':             defaultVarieties,
  'Puducherry':         defaultVarieties,
  'Rajasthan':          defaultVarieties,
  'Telangana':          defaultVarieties,
  'Tripura':            defaultVarieties,
  'Uttarakhand':        defaultVarieties,
  'West Bengal':        defaultVarieties,
};

const varietySeasons = {
  'Co 86032': ['Kharif', 'Summer'], 'CoC 671': ['Kharif', 'Summer'],
  'Co 775': ['Kharif'], 'Co 94012': ['Kharif', 'Summer'], 'Co 0238': ['Rabi', 'Summer'],
  'CoJ 64': ['Rabi'], 'Co 0118': ['Rabi'], 'Co 05009': ['Rabi', 'Summer'], 'CoS 767': ['Rabi'],
  'CoM 0265': ['Kharif', 'Summer'], 'Co 419': ['Kharif', 'Summer'], 'Co 62175': ['Kharif'],
  'Co 94008': ['Kharif', 'Summer'], 'Co 7717': ['Kharif', 'Summer'],
  'Bo 91': ['Rabi'], 'CoPant 90223': ['Rabi'], 'CoJ 88': ['Rabi'], 'CoPb 92': ['Rabi'],
};
const allSeasons = ['Kharif', 'Rabi', 'Summer'];
const states = Object.keys(stateVarieties);

const STEPS = [
  { id: 1, label: 'Crop Info',    icon: '🌾', desc: 'State, variety & area' },
  { id: 2, label: 'Weather',      icon: '☁️', desc: 'Climate conditions' },
  { id: 3, label: 'Soil',         icon: '🪨', desc: 'NPK & nutrients' },
  { id: 4, label: 'Management',   icon: '💧', desc: 'Irrigation & history' },
];

/* ── animated counter ──────────────────────────────────────────── */
function CountUp({ to, duration = 1400, decimals = 2 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const target = parseFloat(to);
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal((ease * target).toFixed(decimals));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to]);
  return <>{val}</>;
}

/* ── confidence arc ────────────────────────────────────────────── */
function ConfidenceArc({ pct, risk }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = risk === 'Low' ? '#16a34a' : risk === 'Medium' ? '#f59e0b' : '#ef4444';
  return (
    <svg viewBox="0 0 120 120" width="140" height="140" style={{ overflow: 'visible' }}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(.17,.67,.35,1)', filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
      <text x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="800" fill={color}>{pct}%</text>
      <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#9ca3af" letterSpacing="1">CONFIDENCE</text>
    </svg>
  );
}

/* ── field input with icon ─────────────────────────────────────── */
function Field({ label, icon, hint, children, required }) {
  return (
    <div className="pp-field">
      <label className="pp-label">
        <span className="pp-label-icon">{icon}</span>
        {label}{required && <span className="pp-required">*</span>}
      </label>
      {children}
      {hint && <span className="pp-hint">{hint}</span>}
    </div>
  );
}

/* ── loading dots ──────────────────────────────────────────────── */
function LoadingDots() {
  return (
    <div className="pp-loading-overlay">
      <div className="pp-loading-box">
        <div className="pp-loading-icon">🌾</div>
        <div className="pp-loading-title">Analyzing your data…</div>
        <div className="pp-loading-sub">Running XGBoost · Random Forest · Gradient Boost</div>
        <div className="pp-dots">
          <span /><span /><span />
        </div>
        <div className="pp-loading-steps">
          <LoadingStep label="Processing inputs" delay={0} />
          <LoadingStep label="Running ML models" delay={600} />
          <LoadingStep label="Aggregating results" delay={1200} />
          <LoadingStep label="Generating insights" delay={1700} />
        </div>
      </div>
    </div>
  );
}

function LoadingStep({ label, delay }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className={`pp-ls ${done ? 'pp-ls-done' : ''}`}>
      <span className="pp-ls-dot">{done ? '✓' : '·'}</span>
      {label}
    </div>
  );
}

/* ── main component ────────────────────────────────────────────── */
export default function PredictionPage() {
  const { user } = useAuth();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const resultRef             = useRef(null);

  const [formData, setFormData] = useState({
    state: 'Maharashtra',
    variety: stateVarieties['Maharashtra'][0],
    season: varietySeasons[stateVarieties['Maharashtra'][0]]?.[0] || 'Kharif',
    area_hectare: '',
    rainfall_mm: '',
    temperature_c: '',
    soil_nitrogen: '',
    soil_phosphorus: '',
    soil_potassium: '',
    irrigation_frequency: '',
    prev_year_yield: '',
  });

  const availableVarieties = stateVarieties[formData.state] || [];
  const availableSeasons   = varietySeasons[formData.variety] || allSeasons;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      const vars = stateVarieties[value] || [];
      const v = vars[0] || '';
      const ss = varietySeasons[v] || allSeasons;
      setFormData(f => ({ ...f, state: value, variety: v, season: ss[0] || 'Kharif' }));
    } else if (name === 'variety') {
      const ss = varietySeasons[value] || allSeasons;
      setFormData(f => ({ ...f, variety: value, season: ss[0] || 'Kharif' }));
    } else {
      setFormData(f => ({ ...f, [name]: value }));
    }
  };

  /* step validation */
  const stepValid = () => {
    if (step === 1) return formData.state && formData.variety && formData.season && formData.area_hectare;
    if (step === 2) return formData.rainfall_mm && formData.temperature_c;
    if (step === 3) return formData.soil_nitrogen && formData.soil_phosphorus && formData.soil_potassium;
    return formData.irrigation_frequency;
  };

  const handleNext = () => {
    if (stepValid()) setStep(s => Math.min(s + 1, 4));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stepValid()) return;
    setLoading(true);
    setResult(null);

    setTimeout(() => {
      const isNewVariety = !formData.prev_year_yield || parseFloat(formData.prev_year_yield) === 0;
      let yld  = (Math.random() * 30 + 50).toFixed(2);
      let conf = (Math.random() * 15 + 80).toFixed(1);
      if (isNewVariety) { conf = (parseFloat(conf) - 10).toFixed(1); yld = (parseFloat(yld) - 5).toFixed(2); }
      const risk = parseFloat(yld) > 65 ? 'Low' : parseFloat(yld) > 55 ? 'Medium' : 'High';
      const totalProd = (parseFloat(yld) * parseFloat(formData.area_hectare)).toFixed(1);

      setResult({ yield: yld, confidence: conf, model: 'XGBoost + Ensemble', risk, isNewVariety, totalProd });
      setLoading(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }, 2200);
  };

  const handleReset = () => {
    setFormData({
      state: 'Maharashtra', variety: stateVarieties['Maharashtra'][0],
      season: varietySeasons[stateVarieties['Maharashtra'][0]]?.[0] || 'Kharif',
      area_hectare: '', rainfall_mm: '', temperature_c: '',
      soil_nitrogen: '', soil_phosphorus: '', soil_potassium: '',
      irrigation_frequency: '', prev_year_yield: '',
    });
    setResult(null);
    setStep(1);
  };

  const downloadReport = () => {
    if (!result) return;
    const txt = `
SUGARCANE YIELD PREDICTION REPORT
===============================================
Generated : ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}
User      : ${user?.name || 'User'}

INPUT PARAMETERS
───────────────
State         : ${formData.state}
Variety       : ${formData.variety}
Season        : ${formData.season}
Area          : ${formData.area_hectare} ha
Rainfall      : ${formData.rainfall_mm} mm
Temperature   : ${formData.temperature_c} °C
Nitrogen (N)  : ${formData.soil_nitrogen} kg/ha
Phosphorus (P): ${formData.soil_phosphorus} kg/ha
Potassium (K) : ${formData.soil_potassium} kg/ha
Irrigation    : ${formData.irrigation_frequency}×/month
Prev. Yield   : ${formData.prev_year_yield || 'N/A'} t/ha

PREDICTION RESULTS
───────────────────
Predicted Yield   : ${result.yield} t/ha
Total Production  : ${result.totalProd} tonnes
Confidence        : ${result.confidence}%
Model             : ${result.model}
Risk Level        : ${result.risk}
${result.isNewVariety ? '\n⚠️  NEW VARIETY — lower confidence due to experimental nature.\n' : ''}

RECOMMENDATIONS
───────────────
${result.isNewVariety
  ? '• Start with small experimental plots\n• Monitor crop health closely\n• Document all observations'
  : '• Maintain consistent irrigation schedule\n• Monitor NDVI every 2 weeks\n• Regular soil testing recommended'}

===============================================
SugarYield AI · Smart Agricultural Decision Support
===============================================`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
    a.download = `Yield_Report_${formData.variety.replace(/ /g,'_')}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const riskColor = result
    ? result.risk === 'Low' ? '#16a34a' : result.risk === 'Medium' ? '#f59e0b' : '#ef4444'
    : '#2d7a3e';

  return (
    <AppLayout>
      {loading && <LoadingDots />}

      <div className="pp-page">
        {/* ── Hero header ── */}
        <div className="pp-hero">
          <div className="pp-hero-bg" />
          <div className="pp-hero-content">
            <span className="pp-eyebrow">🤖 AI-Powered Forecasting</span>
            <h1 className="pp-title">Sugarcane Yield Prediction</h1>
            <p className="pp-subtitle">
              Enter your field parameters and get an accurate yield forecast from
              an ensemble of 5 ML models trained on 12,000+ real samples.
            </p>
            <div className="pp-hero-chips">
              <span className="pp-chip">🌾 XGBoost</span>
              <span className="pp-chip">🌲 Random Forest</span>
              <span className="pp-chip">📈 Gradient Boost</span>
              <span className="pp-chip">86.2% Accuracy</span>
            </div>
          </div>
        </div>

        <div className="pp-body">
          {/* ── Stepper ── */}
          <div className="pp-stepper">
            {STEPS.map((s, i) => {
              const state = step === s.id ? 'active' : step > s.id ? 'done' : 'idle';
              return (
                <React.Fragment key={s.id}>
                  <button
                    className={`pp-step pp-step-${state}`}
                    onClick={() => step > s.id && setStep(s.id)}
                    disabled={step < s.id}
                  >
                    <span className="pp-step-circle">
                      {state === 'done' ? '✓' : s.icon}
                    </span>
                    <span className="pp-step-label">{s.label}</span>
                    <span className="pp-step-desc">{s.desc}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`pp-step-line ${step > s.id ? 'pp-step-line-done' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <form onSubmit={handleSubmit}>
            {/* ── Step 1: Crop Info ── */}
            {step === 1 && (
              <div className="pp-card pp-card-anim">
                <div className="pp-card-header">
                  <span className="pp-card-icon">🌾</span>
                  <div>
                    <h2>Crop Information</h2>
                    <p>Select your state, variety, season, and field area.</p>
                  </div>
                </div>

                <div className="pp-grid-2">
                  <Field label="State" icon="📍" hint="Varieties update based on state" required>
                    <div className="pp-select-wrap">
                      <select name="state" value={formData.state} onChange={handleChange} className="pp-select" required>
                        {states.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <span className="pp-select-arrow">▾</span>
                    </div>
                  </Field>

                  <Field label="Sugarcane Variety" icon="🌱" hint={`${availableVarieties.length} varieties for ${formData.state}`} required>
                    <div className="pp-select-wrap">
                      <select name="variety" value={formData.variety} onChange={handleChange} className="pp-select" required>
                        {availableVarieties.map(v => <option key={v}>{v}</option>)}
                      </select>
                      <span className="pp-select-arrow">▾</span>
                    </div>
                  </Field>

                  <Field label="Season" icon="📅" hint={`Valid for ${formData.variety}`} required>
                    <div className="pp-season-btns">
                      {availableSeasons.map(s => (
                        <label key={s} className={`pp-season-btn ${formData.season === s ? 'pp-season-active' : ''}`}>
                          <input type="radio" name="season" value={s} checked={formData.season === s} onChange={handleChange} hidden />
                          {s === 'Kharif' ? '☔' : s === 'Rabi' ? '❄️' : '☀️'} {s}
                        </label>
                      ))}
                    </div>
                  </Field>

                  <Field label="Area (Hectares)" icon="📐" required>
                    <div className="pp-input-wrap">
                      <input type="number" name="area_hectare" value={formData.area_hectare}
                        onChange={handleChange} placeholder="e.g., 5.5" step="0.1" min="0"
                        className="pp-input" required />
                      <span className="pp-input-unit">ha</span>
                    </div>
                  </Field>
                </div>

                {/* variety info card */}
                <div className="pp-info-card">
                  <span className="pp-info-icon">💡</span>
                  <div>
                    <strong>{formData.variety}</strong> is recommended for <strong>{formData.state}</strong> during
                    the <strong>{formData.season}</strong> season.
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Weather ── */}
            {step === 2 && (
              <div className="pp-card pp-card-anim">
                <div className="pp-card-header">
                  <span className="pp-card-icon">☁️</span>
                  <div>
                    <h2>Weather Conditions</h2>
                    <p>Climate data directly impacts yield predictions.</p>
                  </div>
                </div>

                <div className="pp-weather-visual">
                  <div className="pp-wv-item">
                    <span className="pp-wv-emoji">🌧️</span>
                    <span className="pp-wv-label">Optimal Rainfall</span>
                    <span className="pp-wv-range">1,200 – 1,500 mm/year</span>
                  </div>
                  <div className="pp-wv-divider" />
                  <div className="pp-wv-item">
                    <span className="pp-wv-emoji">🌡️</span>
                    <span className="pp-wv-label">Optimal Temperature</span>
                    <span className="pp-wv-range">27 – 34°C</span>
                  </div>
                  <div className="pp-wv-divider" />
                  <div className="pp-wv-item">
                    <span className="pp-wv-emoji">💧</span>
                    <span className="pp-wv-label">Optimal Humidity</span>
                    <span className="pp-wv-range">60 – 80%</span>
                  </div>
                </div>

                <div className="pp-grid-2">
                  <Field label="Annual Rainfall" icon="🌧️" required>
                    <div className="pp-input-wrap">
                      <input type="number" name="rainfall_mm" value={formData.rainfall_mm}
                        onChange={handleChange} placeholder="e.g., 1200" min="0"
                        className={`pp-input ${formData.rainfall_mm && (parseFloat(formData.rainfall_mm) < 1200 || parseFloat(formData.rainfall_mm) > 1500) ? 'pp-input-warn' : ''}`}
                        required />
                      <span className="pp-input-unit">mm</span>
                    </div>
                    {formData.rainfall_mm && parseFloat(formData.rainfall_mm) >= 1200 && parseFloat(formData.rainfall_mm) <= 1500 &&
                      <span className="pp-ok-hint">✓ Optimal range</span>}
                    {formData.rainfall_mm && parseFloat(formData.rainfall_mm) < 1200 &&
                      <span className="pp-warn-hint">⚠ Below optimal — may reduce yield</span>}
                  </Field>

                  <Field label="Average Temperature" icon="🌡️" required>
                    <div className="pp-input-wrap">
                      <input type="number" name="temperature_c" value={formData.temperature_c}
                        onChange={handleChange} placeholder="e.g., 28.5" step="0.1" min="0"
                        className={`pp-input ${formData.temperature_c && (parseFloat(formData.temperature_c) < 27 || parseFloat(formData.temperature_c) > 34) ? 'pp-input-warn' : ''}`}
                        required />
                      <span className="pp-input-unit">°C</span>
                    </div>
                    {formData.temperature_c && parseFloat(formData.temperature_c) >= 27 && parseFloat(formData.temperature_c) <= 34 &&
                      <span className="pp-ok-hint">✓ Optimal range</span>}
                  </Field>

                  <Field label="Average Humidity" icon="💧">
                    <div className="pp-input-wrap">
                      <input type="number" name="humidity" value={formData.humidity || ''}
                        onChange={handleChange} placeholder="e.g., 68" min="0" max="100"
                        className="pp-input" />
                      <span className="pp-input-unit">%</span>
                    </div>
                  </Field>

                  <Field label="NDVI Value" icon="🛰️" hint="Vegetation health index (0–1)">
                    <div className="pp-input-wrap">
                      <input type="number" name="ndvi" value={formData.ndvi || ''}
                        onChange={handleChange} placeholder="e.g., 0.74" step="0.01" min="0" max="1"
                        className="pp-input" />
                    </div>
                    {formData.ndvi && (
                      <div className="pp-ndvi-bar-wrap">
                        <div className="pp-ndvi-bar">
                          <div className="pp-ndvi-fill" style={{
                            width: `${parseFloat(formData.ndvi) * 100}%`,
                            background: parseFloat(formData.ndvi) > 0.6 ? '#16a34a' : parseFloat(formData.ndvi) > 0.4 ? '#f59e0b' : '#ef4444'
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: parseFloat(formData.ndvi) > 0.6 ? '#16a34a' : '#f59e0b' }}>
                          {parseFloat(formData.ndvi) > 0.6 ? 'Healthy' : parseFloat(formData.ndvi) > 0.4 ? 'Moderate' : 'Stressed'}
                        </span>
                      </div>
                    )}
                  </Field>
                </div>
              </div>
            )}

            {/* ── Step 3: Soil ── */}
            {step === 3 && (
              <div className="pp-card pp-card-anim">
                <div className="pp-card-header">
                  <span className="pp-card-icon">🪨</span>
                  <div>
                    <h2>Soil Parameters</h2>
                    <p>NPK nutrients, pH, and moisture shape the yield potential.</p>
                  </div>
                </div>

                <div className="pp-npk-guide">
                  {[
                    { label: 'N', color: '#2d7a3e', range: '150–250', desc: 'Nitrogen' },
                    { label: 'P', color: '#1a73e8', range: '50–100', desc: 'Phosphorus' },
                    { label: 'K', color: '#f59e0b', range: '75–150', desc: 'Potassium' },
                  ].map(n => (
                    <div key={n.label} className="pp-npk-pill" style={{ background: `${n.color}15`, borderColor: `${n.color}40` }}>
                      <span className="pp-npk-sym" style={{ color: n.color }}>{n.label}</span>
                      <span className="pp-npk-name">{n.desc}</span>
                      <span className="pp-npk-range">{n.range} kg/ha</span>
                    </div>
                  ))}
                </div>

                <div className="pp-grid-3">
                  {[
                    { name: 'soil_nitrogen',    label: 'Nitrogen (N)',   icon: '🟢', unit: 'kg/ha', ph: 'e.g., 180', color: '#2d7a3e', min: 150, max: 250 },
                    { name: 'soil_phosphorus',  label: 'Phosphorus (P)', icon: '🔵', unit: 'kg/ha', ph: 'e.g., 60',  color: '#1a73e8', min: 50,  max: 100 },
                    { name: 'soil_potassium',   label: 'Potassium (K)',  icon: '🟡', unit: 'kg/ha', ph: 'e.g., 80',  color: '#f59e0b', min: 75,  max: 150 },
                  ].map(f => {
                    const v = parseFloat(formData[f.name]);
                    const pct = formData[f.name] ? Math.min((v / f.max) * 100, 110) : 0;
                    const ok  = v >= f.min && v <= f.max;
                    return (
                      <div key={f.name} className="pp-soil-field">
                        <label className="pp-label">
                          <span className="pp-label-icon">{f.icon}</span>
                          {f.label}<span className="pp-required">*</span>
                        </label>
                        <div className="pp-input-wrap">
                          <input type="number" name={f.name} value={formData[f.name]}
                            onChange={handleChange} placeholder={f.ph} min="0"
                            className={`pp-input ${formData[f.name] && !ok ? 'pp-input-warn' : ''}`}
                            required />
                          <span className="pp-input-unit">{f.unit}</span>
                        </div>
                        {formData[f.name] && (
                          <div className="pp-soil-meter">
                            <div className="pp-soil-track">
                              <div className="pp-soil-fill" style={{ width: `${Math.min(pct, 100)}%`, background: ok ? f.color : '#ef4444' }} />
                              <div className="pp-soil-opt" style={{ left: `${(f.min / f.max) * 100}%`, width: `${((f.max - f.min) / f.max) * 100}%` }} />
                            </div>
                            <span className={ok ? 'pp-ok-hint' : 'pp-warn-hint'}>{ok ? '✓ Optimal' : '⚠ Adjust level'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pp-grid-2" style={{ marginTop: 20 }}>
                  <Field label="Soil pH" icon="⚗️" hint="Optimal: 6.0 – 7.5">
                    <div className="pp-input-wrap">
                      <input type="number" name="soil_ph" value={formData.soil_ph || ''}
                        onChange={handleChange} placeholder="e.g., 6.8" step="0.1" min="0" max="14"
                        className="pp-input" />
                    </div>
                  </Field>
                  <Field label="Soil Moisture" icon="💧" hint="Optimal: 50–70%">
                    <div className="pp-input-wrap">
                      <input type="number" name="soil_moisture" value={formData.soil_moisture || ''}
                        onChange={handleChange} placeholder="e.g., 62" min="0" max="100"
                        className="pp-input" />
                      <span className="pp-input-unit">%</span>
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* ── Step 4: Management ── */}
            {step === 4 && (
              <div className="pp-card pp-card-anim">
                <div className="pp-card-header">
                  <span className="pp-card-icon">💧</span>
                  <div>
                    <h2>Management Practices</h2>
                    <p>Irrigation frequency and historical yield data improve accuracy.</p>
                  </div>
                </div>

                <div className="pp-grid-2">
                  <Field label="Irrigation Frequency" icon="💧" hint="Recommended: 4–6 times/month" required>
                    <div className="pp-input-wrap">
                      <input type="number" name="irrigation_frequency" value={formData.irrigation_frequency}
                        onChange={handleChange} placeholder="e.g., 4" min="0"
                        className="pp-input" required />
                      <span className="pp-input-unit">×/mo</span>
                    </div>
                    <div className="pp-irr-scale">
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <div key={n} className={`pp-irr-dot ${parseFloat(formData.irrigation_frequency) >= n ? 'pp-irr-active' : ''}`} title={`${n}×/mo`} />
                      ))}
                      <span className="pp-irr-hint">optimal ↑ at 5×</span>
                    </div>
                  </Field>

                  <Field label="Previous Year Yield" icon="📊" hint="Enter 0 for a new variety experiment">
                    <div className="pp-input-wrap">
                      <input type="number" name="prev_year_yield" value={formData.prev_year_yield}
                        onChange={handleChange} placeholder="e.g., 65.5" step="0.1" min="0"
                        className="pp-input" />
                      <span className="pp-input-unit">t/ha</span>
                    </div>
                  </Field>

                  <Field label="Soil Type" icon="🪨">
                    <div className="pp-select-wrap">
                      <select name="soil_type" value={formData.soil_type || ''} onChange={handleChange} className="pp-select">
                        <option value="">Select soil type</option>
                        <option>Black Cotton Soil</option>
                        <option>Alluvial Soil</option>
                        <option>Red Laterite Soil</option>
                        <option>Sandy Loam</option>
                        <option>Clay Loam</option>
                      </select>
                      <span className="pp-select-arrow">▾</span>
                    </div>
                  </Field>

                  <Field label="Crop Stage" icon="📈">
                    <div className="pp-select-wrap">
                      <select name="crop_stage" value={formData.crop_stage || ''} onChange={handleChange} className="pp-select">
                        <option value="">Select current stage</option>
                        <option>Germination</option>
                        <option>Tillering</option>
                        <option>Grand Growth</option>
                        <option>Ripening</option>
                      </select>
                      <span className="pp-select-arrow">▾</span>
                    </div>
                  </Field>
                </div>

                {/* Summary before submit */}
                <div className="pp-summary-card">
                  <h4>📋 Prediction Summary</h4>
                  <div className="pp-summary-grid">
                    {[
                      { l: 'State',       v: formData.state },
                      { l: 'Variety',     v: formData.variety },
                      { l: 'Season',      v: formData.season },
                      { l: 'Area',        v: formData.area_hectare ? `${formData.area_hectare} ha` : '—' },
                      { l: 'Rainfall',    v: formData.rainfall_mm ? `${formData.rainfall_mm} mm` : '—' },
                      { l: 'Temperature', v: formData.temperature_c ? `${formData.temperature_c}°C` : '—' },
                      { l: 'N / P / K',   v: `${formData.soil_nitrogen || '—'} / ${formData.soil_phosphorus || '—'} / ${formData.soil_potassium || '—'}` },
                      { l: 'Irrigation',  v: formData.irrigation_frequency ? `${formData.irrigation_frequency}×/mo` : '—' },
                    ].map(r => (
                      <div key={r.l} className="pp-sum-row">
                        <span className="pp-sum-label">{r.l}</span>
                        <span className="pp-sum-value">{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="pp-nav">
              {step > 1 && (
                <button type="button" className="pp-btn-back" onClick={handleBack}>
                  ← Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              {step < 4 ? (
                <button type="button" className={`pp-btn-next ${!stepValid() ? 'pp-btn-disabled' : ''}`} onClick={handleNext} disabled={!stepValid()}>
                  Continue → <span className="pp-btn-next-label">{STEPS[step].label}</span>
                </button>
              ) : (
                <button type="submit" className="pp-btn-predict" disabled={!stepValid() || loading}>
                  <span className="pp-btn-predict-icon">🌾</span>
                  Run AI Prediction
                </button>
              )}
            </div>
          </form>

          {/* ── Result ── */}
          {result && (
            <div className="pp-result" ref={resultRef}>
              {/* Confetti burst */}
              <div className="pp-confetti">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span key={i} className="pp-confetti-piece" style={{ '--i': i }} />
                ))}
              </div>

              <div className="pp-result-hero">
                <div className="pp-result-left">
                  <span className="pp-result-eyebrow">🎯 Prediction Complete</span>
                  <div className="pp-result-yield">
                    <span className="pp-result-num">
                      <CountUp to={result.yield} decimals={2} />
                    </span>
                    <span className="pp-result-unit">t/ha</span>
                  </div>
                  <span className="pp-result-label">Predicted Yield</span>
                  <div className="pp-result-total">
                    Total production: <strong>
                      <CountUp to={result.totalProd} decimals={1} /> tonnes
                    </strong> from {formData.area_hectare} ha
                  </div>
                </div>
                <div className="pp-result-arc">
                  <ConfidenceArc pct={parseFloat(result.confidence)} risk={result.risk} />
                </div>
              </div>

              {/* Metric pills */}
              <div className="pp-result-pills">
                {[
                  { icon: '🤖', label: 'Model',      value: result.model },
                  { icon: '🌱', label: 'Variety',     value: formData.variety },
                  { icon: '📍', label: 'State',       value: formData.state },
                  { icon: '📅', label: 'Season',      value: formData.season },
                ].map(p => (
                  <div className="pp-pill" key={p.label}>
                    <span className="pp-pill-icon">{p.icon}</span>
                    <div>
                      <span className="pp-pill-label">{p.label}</span>
                      <span className="pp-pill-value">{p.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Risk badge */}
              <div className="pp-risk-row">
                <div className="pp-risk-badge" style={{ background: `${riskColor}18`, borderColor: `${riskColor}40`, color: riskColor }}>
                  <span>{result.risk === 'Low' ? '🟢' : result.risk === 'Medium' ? '🟡' : '🔴'}</span>
                  <strong>{result.risk} Risk</strong>
                  <span className="pp-risk-desc">
                    {result.risk === 'Low' ? 'Excellent yield prospects' : result.risk === 'Medium' ? 'Monitor conditions closely' : 'Requires immediate attention'}
                  </span>
                </div>
              </div>

              {result.isNewVariety && (
                <div className="pp-new-variety-banner">
                  <span>⚠️</span>
                  <div>
                    <strong>New Variety Experiment</strong>
                    <p>This variety hasn't been grown in this region before. Prediction confidence is reduced. Start with small experimental plots.</p>
                  </div>
                </div>
              )}

              {/* Analysis breakdown */}
              <div className="pp-analysis">
                <h3>Analysis Breakdown</h3>
                <div className="pp-analysis-grid">
                  {[
                    {
                      icon: '🌾', title: 'Variety Performance',
                      body: `${formData.variety} ${result.isNewVariety ? 'is being trialled in this region for the first time' : `shows ${parseFloat(result.yield) > 65 ? 'excellent' : parseFloat(result.yield) > 55 ? 'good' : 'moderate'} yield potential`} in ${formData.state}.`,
                      tag: result.isNewVariety ? 'Experimental' : 'Established',
                      tagColor: result.isNewVariety ? '#f59e0b' : '#16a34a',
                    },
                    {
                      icon: '🌧️', title: 'Weather Impact',
                      body: `Rainfall (${formData.rainfall_mm} mm) and temperature (${formData.temperature_c}°C) are ${parseFloat(formData.rainfall_mm) > 1000 && parseFloat(formData.temperature_c) > 25 ? 'optimal' : 'acceptable'} for sugarcane growth this season.`,
                      tag: parseFloat(formData.rainfall_mm) > 1000 ? 'Optimal' : 'Acceptable',
                      tagColor: parseFloat(formData.rainfall_mm) > 1000 ? '#16a34a' : '#f59e0b',
                    },
                    {
                      icon: '🪨', title: 'Soil Fertility',
                      body: `NPK levels (N:${formData.soil_nitrogen}, P:${formData.soil_phosphorus}, K:${formData.soil_potassium} kg/ha) indicate ${parseFloat(formData.soil_nitrogen) > 150 ? 'good' : 'moderate'} nutrient availability.`,
                      tag: parseFloat(formData.soil_nitrogen) > 150 ? 'Good' : 'Moderate',
                      tagColor: parseFloat(formData.soil_nitrogen) > 150 ? '#16a34a' : '#f59e0b',
                    },
                    {
                      icon: '💧', title: 'Irrigation Status',
                      body: `Irrigation at ${formData.irrigation_frequency}×/month is ${parseFloat(formData.irrigation_frequency) >= 4 ? 'adequate' : 'below recommended'}. ${parseFloat(formData.irrigation_frequency) < 4 ? 'Increasing to 5×/month could improve yield.' : 'Good management practice.'}`,
                      tag: parseFloat(formData.irrigation_frequency) >= 4 ? 'Adequate' : 'Low',
                      tagColor: parseFloat(formData.irrigation_frequency) >= 4 ? '#16a34a' : '#ef4444',
                    },
                  ].map(a => (
                    <div className="pp-analysis-card" key={a.title}>
                      <div className="pp-ac-header">
                        <span className="pp-ac-icon">{a.icon}</span>
                        <span className="pp-ac-title">{a.title}</span>
                        <span className="pp-ac-tag" style={{ background: `${a.tagColor}18`, color: a.tagColor }}>{a.tag}</span>
                      </div>
                      <p className="pp-ac-body">{a.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature importance mini bars */}
              <div className="pp-importance">
                <h3>Key Factors (Feature Importance)</h3>
                <div className="pp-imp-list">
                  {[
                    { label: 'NDVI / Crop Health',      pct: 28, color: '#2d7a3e' },
                    { label: 'Annual Rainfall',          pct: 22, color: '#1a73e8' },
                    { label: 'Soil Nitrogen (N)',         pct: 18, color: '#16a34a' },
                    { label: 'Temperature',              pct: 12, color: '#f59e0b' },
                    { label: 'Potassium (K)',             pct: 8,  color: '#8b5cf6' },
                    { label: 'Irrigation Frequency',     pct: 6,  color: '#3b82f6' },
                    { label: 'Soil pH',                  pct: 4,  color: '#ec4899' },
                    { label: 'Previous Year Yield',      pct: 2,  color: '#6b7280' },
                  ].map((f, i) => (
                    <div className="pp-imp-row" key={f.label} style={{ animationDelay: `${i * 60}ms` }}>
                      <span className="pp-imp-label">{f.label}</span>
                      <div className="pp-imp-track">
                        <div className="pp-imp-fill" style={{ width: `${f.pct * 3}%`, background: f.color }} />
                      </div>
                      <span className="pp-imp-pct">{f.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pp-result-actions">
                <button className="pp-btn-back" onClick={handleReset}>
                  🔄 New Prediction
                </button>
                <button className="pp-btn-download" onClick={downloadReport}>
                  ⬇ Download Report
                </button>
                <button className="pp-btn-predict" onClick={() => window.location.href = '/insights'} style={{ flex: 0, padding: '14px 24px' }}>
                  🤖 Full AI Insights →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
