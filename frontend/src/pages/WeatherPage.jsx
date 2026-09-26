import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import AppLayout from '../components/AppLayout';
import { weatherApi } from '../services/api';

export default function WeatherPage() {
  const [location, setLocation] = useState('Kolhapur');
  const [input, setInput]       = useState('Kolhapur');
  const [current, setCurrent]   = useState(null);
  const [forecast, setForecast] = useState([]);
  const [history, setHistory]   = useState([]);
  const [impact, setImpact]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('forecast');

  const load = async (loc) => {
    setLoading(true);
    try {
      const [cur, fore, hist] = await Promise.all([
        weatherApi.current(loc),
        weatherApi.forecast(loc),
        weatherApi.history(),
      ]);
      setCurrent(cur.data);
      setForecast(fore.data?.forecast || []);
      setHistory(hist.data?.monthly || []);
      if (cur.data) {
        const imp = await weatherApi.impact({ temperature: cur.data.temperature, rainfall: cur.data.rainfall || 900, humidity: cur.data.humidity });
        setImpact(imp.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(location); }, [location]);

  const c = current;

  const weatherIcon = (desc) => {
    if (!desc) return '🌤️';
    const d = desc.toLowerCase();
    if (d.includes('rain') || d.includes('drizzle')) return '🌧️';
    if (d.includes('cloud')) return '☁️';
    if (d.includes('clear') || d.includes('sun')) return '☀️';
    if (d.includes('storm') || d.includes('thunder')) return '⛈️';
    return '🌤️';
  };

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Climate Intelligence</p>
            <h1 className="page-title">Weather Dashboard</h1>
            <p className="page-subtitle">Live conditions, 7-day forecast, seasonal history and crop impact.</p>
          </div>
          {c?.is_demo && <span className="badge badge-yellow">⚠️ Demo Data</span>}
        </div>

        {/* Location search */}
        <div className="weather-search">
          <input placeholder="Enter location (e.g., Kolhapur, Mandya)" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setLocation(input)} className="weather-input" />
          <button className="btn-primary" onClick={() => setLocation(input)}>Search</button>
        </div>

        {loading ? (
          <div className="page-loading-center"><div className="loading-spinner" /><p>Fetching weather data…</p></div>
        ) : (
          <>
            {/* Current weather hero */}
            {c && (
              <div className="weather-hero-card">
                <div className="whc-main">
                  <div className="whc-icon">{weatherIcon(c.description)}</div>
                  <div>
                    <div className="whc-temp">{c.temperature}°C</div>
                    <div className="whc-desc">{c.description || 'Partly Cloudy'}</div>
                    <div className="whc-location">📍 {c.location}</div>
                  </div>
                </div>
                <div className="whc-metrics">
                  {[
                    { icon: '💧', label: 'Humidity',    value: `${c.humidity}%` },
                    { icon: '🌧️', label: 'Rainfall',    value: `${c.rainfall || 0}mm` },
                    { icon: '💨', label: 'Wind',        value: `${c.wind_speed || 0}km/h` },
                    { icon: '🌡️', label: 'Feels Like',  value: `${c.feels_like || c.temperature}°C` },
                    { icon: '👁️', label: 'Visibility',  value: `${c.visibility || 10}km` },
                    { icon: '📊', label: 'Pressure',    value: `${c.pressure || 1012}hPa` },
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

            {/* Tabs */}
            <div className="tab-bar">
              {[{id:'forecast',label:'7-Day Forecast'},{id:'history',label:'Seasonal History'},{id:'impact',label:'Crop Impact'}].map(t => (
                <button key={t.id} className={`tab-btn ${tab===t.id?'tab-btn-active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
              ))}
            </div>

            {tab === 'forecast' && (
              <div className="forecast-grid">
                {forecast.map(d => (
                  <div className="forecast-card" key={d.day}>
                    <span className="fc-day">{d.day}</span>
                    <span className="fc-weather-icon">{weatherIcon(d.description)}</span>
                    <span className="fc-high">{d.high}°</span>
                    <span className="fc-low">{d.low}°</span>
                    <span className="fc-rain">🌧 {d.rainfall}mm</span>
                    <span className="fc-humid">💧 {d.humidity}%</span>
                    {d.sugarcane_impact && <span className={`status-badge status-${d.sugarcane_impact==='Optimal'?'good':'moderate'}`}>{d.sugarcane_impact}</span>}
                  </div>
                ))}
              </div>
            )}

            {tab === 'history' && history.length > 0 && (
              <div className="dash-panel">
                <div className="dash-panel-header"><h3>Monthly Weather History</h3><span className="badge badge-yellow">Demo Data — Configure OpenWeather API for live history</span></div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={history} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="temp" orientation="left"  tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="rain" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="temp" dataKey="avg_temp"        fill="#f59e0b" name="Avg Temp (°C)" radius={[3,3,0,0]} />
                    <Bar yAxisId="rain" dataKey="total_rainfall"  fill="#3b82f6" name="Rainfall (mm)" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="table-wrap" style={{ marginTop: 16 }}>
                  <table className="data-table">
                    <thead><tr><th>Month</th><th>Avg Temp (°C)</th><th>Rainfall (mm)</th><th>Avg Humidity</th><th>Sugarcane Suitability</th></tr></thead>
                    <tbody>{history.map(h => (
                      <tr key={h.month}>
                        <td className="td-bold">{h.month}</td>
                        <td>{h.avg_temp}°C</td>
                        <td>{h.total_rainfall}mm</td>
                        <td>{h.avg_humidity}%</td>
                        <td><span className={`status-badge status-${h.sugarcane_suitability==='Good'?'good':'moderate'}`}>{h.sugarcane_suitability}</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'impact' && impact && (
              <div className="impact-grid">
                {[
                  { key: 'temperature', icon: '🌡️' },
                  { key: 'rainfall',    icon: '🌧️' },
                  { key: 'humidity',    icon: '💧' },
                ].map(({ key, icon }) => {
                  const item = impact[key];
                  if (!item) return null;
                  const col = item.impact === 'Positive' ? '#16a34a' : item.impact === 'Watch' ? '#f59e0b' : '#ef4444';
                  return (
                    <div className="impact-card" key={key}>
                      <div className="impact-header">
                        <span className="impact-icon">{icon}</span>
                        <div><span className="impact-factor">{key.charAt(0).toUpperCase()+key.slice(1)}</span><span className="impact-value">{item.value}{ key==='temperature'?'°C': key==='humidity'?'%':'mm' }</span></div>
                        <span className="impact-badge" style={{ background:`${col}18`, color:col }}>{item.impact}</span>
                      </div>
                      <p className="impact-note">{item.note}</p>
                    </div>
                  );
                })}
                {impact.overall && (
                  <div className="impact-summary">
                    <h3>Overall Weather Suitability for Sugarcane</h3>
                    <div className="impact-meter"><div className="impact-fill" style={{ width:`${impact.overall.score}%` }} /></div>
                    <p><strong>{impact.overall.score}% — {impact.overall.label}</strong> weather conditions for sugarcane cultivation.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
