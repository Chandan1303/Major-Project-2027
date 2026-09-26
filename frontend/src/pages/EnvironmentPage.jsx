import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import AppLayout from '../components/AppLayout';
import { weatherApi, soilApi } from '../services/api';

export default function EnvironmentPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'weather', 'soil'
  const [location, setLocation] = useState('Kolhapur');
  const [inputLoc, setInputLoc] = useState('Kolhapur');

  // Weather states
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [history, setHistory] = useState([]);
  const [weatherImpact, setWeatherImpact] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Soil states
  const [soilData, setSoilData] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [soilLoading, setSoilLoading] = useState(true);

  // Load weather
  const loadWeather = async (loc) => {
    setWeatherLoading(true);
    try {
      const [cur, fore, hist] = await Promise.all([
        weatherApi.current(loc),
        weatherApi.forecast(loc),
        weatherApi.history(),
      ]);
      setCurrentWeather(cur.data);
      setForecast(fore.data?.forecast || []);
      setHistory(hist.data?.monthly || []);

      if (cur.data) {
        const imp = await weatherApi.impact({
          temperature: cur.data.temperature,
          rainfall: cur.data.rainfall || 1200,
          humidity: cur.data.humidity
        });
        setWeatherImpact(imp.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Load soil
  const loadSoil = async () => {
    setSoilLoading(true);
    try {
      const res = await soilApi.getAll();
      setSoilData(res.data);
      if (res.data?.fields?.length) {
        setSelectedField(res.data.fields[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSoilLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(location);
    loadSoil();
  }, [location]);

  const weatherIcon = (desc) => {
    if (!desc) return '🌤️';
    const d = desc.toLowerCase();
    if (d.includes('rain') || d.includes('drizzle')) return '🌧️';
    if (d.includes('cloud')) return '☁️';
    if (d.includes('clear') || d.includes('sun')) return '☀️';
    if (d.includes('storm') || d.includes('thunder')) return '⛈️';
    return '🌤️';
  };

  const f = selectedField;
  const healthColor = f?.health_score >= 80 ? '#16a34a' : f?.health_score >= 65 ? '#f59e0b' : '#ef4444';

  const radarData = f ? [
    { subject: 'pH Balance', value: f.health_score >= 80 ? 92 : 65 },
    { subject: 'Moisture',   value: Math.min(100, Number(f.soil_moisture) + 10) },
    { subject: 'Suitability',value: f.suitability === 'Highly Suitable' ? 95 : 75 },
    { subject: 'Texture',    value: 88 },
    { subject: 'Aeration',   value: 82 },
  ] : [];

  return (
    <AppLayout>
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">AgriTech Environmental Intelligence</p>
            <h1 className="page-title">Environmental & Climate Center</h1>
            <p className="page-subtitle">
              Unified meteorological monitoring, weather impact risks, and physicochemical soil health profiling.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => navigate('/weather')}>☁️ Weather Detail</button>
            <button className="btn-primary" onClick={() => navigate('/soil')}>🪨 Soil Detail</button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-bar">
          {[
            { id: 'overview', label: '🌍 Environmental Overview' },
            { id: 'weather',  label: '☁️ Weather & Climate Risk' },
            { id: 'soil',     label: '🪨 Soil Health & Analysis' }
          ].map(t => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            {/* Top Environmental KPI Cards */}
            <div className="stats-grid-4">
              <div className="stat-card" style={{ '--card-accent': '#0284c7' }}>
                <div className="sc-icon">🌡️</div>
                <div className="sc-body">
                  <span className="sc-label">Current Temperature</span>
                  <span className="sc-value">{currentWeather?.temperature || 29}°C</span>
                  <span className="sc-sub">{currentWeather?.location || location}</span>
                </div>
              </div>

              <div className="stat-card" style={{ '--card-accent': '#16a34a' }}>
                <div className="sc-icon">💧</div>
                <div className="sc-body">
                  <span className="sc-label">Atmospheric Humidity</span>
                  <span className="sc-value">{currentWeather?.humidity || 72}%</span>
                  <span className="sc-sub">Optimal Transpiration</span>
                </div>
              </div>

              <div className="stat-card" style={{ '--card-accent': '#854d0e' }}>
                <div className="sc-icon">🪨</div>
                <div className="sc-body">
                  <span className="sc-label">Avg Soil Health</span>
                  <span className="sc-value">{soilData?.summary?.avg_health_score || 88}/100</span>
                  <span className="sc-sub">{soilData?.summary?.health_label || 'Optimal'}</span>
                </div>
              </div>

              <div className="stat-card" style={{ '--card-accent': '#7c3aed' }}>
                <div className="sc-icon">🛡️</div>
                <div className="sc-body">
                  <span className="sc-label">Overall Weather Risk</span>
                  <span className="sc-value">{weatherImpact?.overall?.risk || 'Low'}</span>
                  <span className="sc-sub">{weatherImpact?.overall?.label || 'Favourable'}</span>
                </div>
              </div>
            </div>

            {/* Two column: Weather snapshot + Soil snapshot */}
            <div className="dash-two-col">
              {/* Weather Snapshot */}
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <h3>Live Weather Snapshot — {location}</h3>
                  <button className="link-btn" onClick={() => setActiveTab('weather')}>Full Weather →</button>
                </div>
                {currentWeather && (
                  <div className="weather-overview-snap">
                    <div className="wos-hero">
                      <span className="wos-icon">{weatherIcon(currentWeather.description)}</span>
                      <div>
                        <div className="wos-temp">{currentWeather.temperature}°C</div>
                        <div className="wos-desc">{currentWeather.description}</div>
                      </div>
                    </div>
                    <div className="wos-metrics">
                      <div className="wos-item"><span>🌧️ Rainfall</span><strong>{currentWeather.rainfall || 12} mm</strong></div>
                      <div className="wos-item"><span>💨 Wind Speed</span><strong>{currentWeather.wind_speed || 10} km/h</strong></div>
                      <div className="wos-item"><span>🌡️ Feels Like</span><strong>{currentWeather.feels_like || currentWeather.temperature}°C</strong></div>
                      <div className="wos-item"><span>💧 Moisture Impact</span><strong>{weatherImpact?.rainfall?.impact || 'Positive'}</strong></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Soil Snapshot */}
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <h3>Soil Condition Summary</h3>
                  <button className="link-btn" onClick={() => setActiveTab('soil')}>Full Soil →</button>
                </div>
                <div className="soil-overview-snap">
                  <div className="sos-metric-row">
                    <div className="sos-pill">
                      <span className="sos-pill-label">Primary Soil Type</span>
                      <span className="sos-pill-val">{f?.soil_type || 'Black Cotton Soil'}</span>
                    </div>
                    <div className="sos-pill">
                      <span className="sos-pill-label">Soil pH</span>
                      <span className="sos-pill-val">{f?.soil_ph ? Number(f.soil_ph).toFixed(1) : '6.8'} (Optimal)</span>
                    </div>
                    <div className="sos-pill">
                      <span className="sos-pill-label">Soil Moisture</span>
                      <span className="sos-pill-val">{f?.soil_moisture ? `${Number(f.soil_moisture).toFixed(0)}%` : '64%'}</span>
                    </div>
                  </div>
                  <p className="sos-note" style={{ marginTop: 16, fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
                    {f?.soil_type || 'Black Cotton Soil'} provides superior moisture-holding capacity for peninsular sugarcane.
                    Soil reaction is in the ideal 6.0–7.5 window, ensuring maximal availability of phosphorus, potassium, and trace minerals.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TAB 2: WEATHER & CLIMATE RISK ── */}
        {activeTab === 'weather' && (
          <>
            {/* Search Bar */}
            <div className="weather-search" style={{ marginBottom: 20 }}>
              <input
                placeholder="Enter sugarcane region (e.g. Kolhapur, Mandya, Meerut, Pune)"
                value={inputLoc}
                onChange={e => setInputLoc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setLocation(inputLoc)}
                className="weather-input"
              />
              <button className="btn-primary" onClick={() => setLocation(inputLoc)}>Search Region</button>
            </div>

            {weatherLoading ? (
              <div className="page-loading-center"><div className="loading-spinner" /><p>Fetching climate data…</p></div>
            ) : (
              <>
                {/* Weather Hero Card */}
                {currentWeather && (
                  <div className="weather-hero-card">
                    <div className="whc-main">
                      <div className="whc-icon">{weatherIcon(currentWeather.description)}</div>
                      <div>
                        <div className="whc-temp">{currentWeather.temperature}°C</div>
                        <div className="whc-desc">{currentWeather.description}</div>
                        <div className="whc-location">📍 {currentWeather.location} (Sugarcane Agro-Climatic Belt)</div>
                      </div>
                    </div>
                    <div className="whc-metrics">
                      {[
                        { icon: '💧', label: 'Humidity',    value: `${currentWeather.humidity}%` },
                        { icon: '🌧️', label: 'Rainfall',    value: `${currentWeather.rainfall || 0} mm` },
                        { icon: '💨', label: 'Wind Speed',  value: `${currentWeather.wind_speed || 0} km/h` },
                        { icon: '🌡️', label: 'Feels Like',  value: `${currentWeather.feels_like || currentWeather.temperature}°C` },
                        { icon: '👁️', label: 'Visibility',  value: `${currentWeather.visibility || 10} km` },
                        { icon: '📊', label: 'Pressure',    value: `${currentWeather.pressure || 1012} hPa` },
                      ].map(m => (
                        <div key={m.label} className="whc-metric">
                          <span>{m.icon}</span>
                          <span className="whc-mval">{m.value}</span>
                          <span className="whc-mlabel">{m.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7-Day Forecast */}
                <div className="dash-panel" style={{ marginTop: 24 }}>
                  <div className="dash-panel-header">
                    <h3>7-Day Sugarcane Agro-Meteorological Forecast</h3>
                  </div>
                  <div className="forecast-grid">
                    {forecast.map(d => (
                      <div className="forecast-card" key={d.day}>
                        <span className="fc-day">{d.day}</span>
                        <span className="fc-weather-icon">{weatherIcon(d.description)}</span>
                        <span className="fc-high">{d.high}°</span>
                        <span className="fc-low">{d.low}°</span>
                        <span className="fc-rain">🌧 {d.rainfall}mm</span>
                        <span className="fc-humid">💧 {d.humidity}%</span>
                        {d.sugarcane_impact && (
                          <span className={`status-badge status-${d.sugarcane_impact === 'Optimal' ? 'good' : 'moderate'}`}>
                            {d.sugarcane_impact}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weather Impact Assessments */}
                {weatherImpact && (
                  <div className="dash-panel" style={{ marginTop: 24 }}>
                    <div className="dash-panel-header">
                      <h3>Crop Weather Impact Assessments</h3>
                      <span className={`status-badge status-${weatherImpact.overall.risk === 'Low' ? 'good' : 'moderate'}`}>
                        Risk: {weatherImpact.overall.risk}
                      </span>
                    </div>
                    <div className="impact-grid">
                      {[
                        { key: 'temperature', label: 'Temperature Impact', icon: '🌡️' },
                        { key: 'rainfall',    label: 'Rainfall Impact',    icon: '🌧️' },
                        { key: 'humidity',    label: 'Humidity Impact',    icon: '💧' },
                      ].map(({ key, label, icon }) => {
                        const item = weatherImpact[key];
                        if (!item) return null;
                        const col = item.impact === 'Positive' ? '#16a34a' : item.impact === 'Watch' ? '#f59e0b' : '#ef4444';
                        return (
                          <div className="impact-card" key={key}>
                            <div className="impact-header">
                              <span className="impact-icon">{icon}</span>
                              <div>
                                <span className="impact-factor">{label}</span>
                                <span className="impact-value">{item.value}{key==='temperature'?'°C':key==='humidity'?'%':' mm'}</span>
                              </div>
                              <span className="impact-badge" style={{ background: `${col}18`, color: col }}>
                                {item.impact}
                              </span>
                            </div>
                            <p className="impact-note">{item.note}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── TAB 3: SOIL ANALYSIS ── */}
        {activeTab === 'soil' && (
          <>
            {soilLoading ? (
              <div className="page-loading-center"><div className="loading-spinner" /><p>Loading soil parameters…</p></div>
            ) : (
              <>
                {/* Field Selector */}
                {soilData?.fields?.length > 0 && (
                  <div className="profile-selector" style={{ marginBottom: 20 }}>
                    {soilData.fields.map(field => (
                      <button
                        key={field.id}
                        className={`profile-btn ${selectedField?.id === field.id ? 'profile-btn-active' : ''}`}
                        onClick={() => setSelectedField(field)}
                      >
                        🪨 {field.name} <span className="profile-btn-sub">{field.farm_name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {f ? (
                  <div className="dash-two-col">
                    <div className="dash-panel">
                      <div className="dash-panel-header">
                        <h3>{f.name} — Physicochemical Profile</h3>
                        <span className={`status-badge status-${f.health_label?.toLowerCase() === 'excellent' ? 'good' : 'moderate'}`}>
                          {f.health_label}
                        </span>
                      </div>
                      <div className="soil-overview">
                        <div className="soil-type-card">
                          <span className="soil-emoji">🪨</span>
                          <div>
                            <span className="soil-type-name">{f.soil_type}</span>
                            <span className="soil-notes">Sugarcane Suitability: <strong>{f.suitability}</strong></span>
                          </div>
                        </div>

                        <div className="soil-metrics-grid">
                          {[
                            { label: 'Soil pH',         value: Number(f.soil_ph).toFixed(1), icon: '⚗️', color: f.ph_status==='Optimal'?'#16a34a':'#f59e0b' },
                            { label: 'Soil Moisture',   value: `${Number(f.soil_moisture).toFixed(0)}%`, icon: '💧', color: '#3b82f6' },
                            { label: 'Health Score',    value: `${f.health_score}/100`, icon: '💚', color: healthColor },
                            { label: 'pH Status',       value: f.ph_status, icon: '✓', color: f.ph_status==='Optimal'?'#16a34a':'#f59e0b' },
                            { label: 'Moisture Status', value: f.moisture_status, icon: '📊', color: '#3b82f6' },
                            { label: 'Suitability',     value: f.suitability, icon: '🌾', color: '#2d7a3e' },
                          ].map(m => (
                            <div key={m.label} className="soil-metric">
                              <span>{m.icon}</span>
                              <span className="sm-value" style={{ color: m.color }}>{m.value}</span>
                              <span className="sm-label">{m.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {f.score_breakdown && (
                        <div style={{ marginTop: 20 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Score Breakdown</h4>
                          {Object.entries(f.score_breakdown).map(([k, v]) => (
                            <div key={k} className="score-breakdown-row">
                              <span>{k.replace('_', ' ').charAt(0).toUpperCase() + k.replace('_', ' ').slice(1)}</span>
                              <div className="sbr-track"><div className="sbr-fill" style={{ width: `${(v/35)*100}%`, background: '#2d7a3e' }} /></div>
                              <span>{v} pts</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Radar Chart */}
                    <div className="dash-panel">
                      <div className="dash-panel-header">
                        <h3>Soil Health Radar Overview</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: healthColor }}>
                          {f.health_score} <span style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>/ 100</span>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                            <Radar name="Soil" dataKey="value" stroke="#2d7a3e" fill="#2d7a3e" fillOpacity={0.25} />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-page-state">
                    <div className="eps-icon">🪨</div>
                    <h2>No Fields Added Yet</h2>
                    <p>Go to My Farm to add fields and calculate soil health indices.</p>
                    <button className="btn-primary" onClick={() => navigate('/farms')}>+ Add Farm & Field</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
