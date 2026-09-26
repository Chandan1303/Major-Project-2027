import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';

const forecast = [
  { day: 'Mon', icon: '⛅', high: 30, low: 22, rain: 5,  humidity: 65 },
  { day: 'Tue', icon: '🌧️', high: 27, low: 21, rain: 18, humidity: 78 },
  { day: 'Wed', icon: '🌧️', high: 26, low: 20, rain: 24, humidity: 82 },
  { day: 'Thu', icon: '🌤️', high: 29, low: 22, rain: 2,  humidity: 60 },
  { day: 'Fri', icon: '☀️', high: 31, low: 23, rain: 0,  humidity: 55 },
  { day: 'Sat', icon: '☀️', high: 32, low: 23, rain: 0,  humidity: 52 },
  { day: 'Sun', icon: '⛅', high: 30, low: 22, rain: 8,  humidity: 63 },
];

const history = [
  { month: 'Apr', temp: 32, rain: 42 },
  { month: 'May', temp: 31, rain: 85 },
  { month: 'Jun', temp: 28, rain: 142 },
  { month: 'Jul', temp: 27, rain: 198 },
  { month: 'Aug', temp: 27, rain: 175 },
  { month: 'Sep', temp: 29, rain: 96 },
];

const impacts = [
  { icon: '🌡️', factor: 'Temperature',    value: '28–31°C',  impact: 'Optimal',  note: 'Ideal range 27–34°C for sugarcane', color: '#16a34a' },
  { icon: '🌧️', factor: 'Rainfall',       value: '96mm/mo',  impact: 'Good',     note: 'Sugarcane needs 1200–1500mm annually', color: '#2563eb' },
  { icon: '💧', factor: 'Humidity',        value: '68%',      impact: 'Moderate', note: 'Higher humidity may increase disease risk', color: '#ca8a04' },
  { icon: '💨', factor: 'Wind Speed',      value: '14 km/h',  impact: 'Low Risk', note: 'Low lodging risk at current wind levels', color: '#16a34a' },
];

export default function WeatherPage() {
  const [tab, setTab] = useState('forecast');

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Climate Intelligence</p>
            <h1 className="page-title">Weather Conditions</h1>
            <p className="page-subtitle">Live weather data, 7-day forecast, and crop impact analysis.</p>
          </div>
          <span className="badge badge-blue">📍 Maharashtra, India</span>
        </div>

        {/* Current conditions */}
        <div className="weather-hero-card">
          <div className="whc-main">
            <div className="whc-icon">⛅</div>
            <div>
              <div className="whc-temp">29°C</div>
              <div className="whc-desc">Partly Cloudy</div>
              <div className="whc-location">Kolhapur, Maharashtra · Sep 26, 2026</div>
            </div>
          </div>
          <div className="whc-metrics">
            {[
              { icon: '💧', label: 'Humidity',   value: '68%' },
              { icon: '🌧️', label: 'Rainfall',  value: '12 mm' },
              { icon: '💨', label: 'Wind',       value: '14 km/h' },
              { icon: '👁️', label: 'Visibility', value: '10 km' },
              { icon: '🌡️', label: 'Feels Like', value: '32°C' },
              { icon: '🔆', label: 'UV Index',   value: '7 (High)' },
            ].map(m => (
              <div className="whc-metric" key={m.label}>
                <span>{m.icon}</span>
                <span className="whc-mval">{m.value}</span>
                <span className="whc-mlabel">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {['forecast', 'history', 'impact'].map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'tab-btn-active' : ''}`} onClick={() => setTab(t)}>
              {t === 'forecast' ? '7-Day Forecast' : t === 'history' ? 'Weather History' : 'Crop Impact'}
            </button>
          ))}
        </div>

        {tab === 'forecast' && (
          <div className="forecast-grid">
            {forecast.map(d => (
              <div className="forecast-card" key={d.day}>
                <span className="fc-day">{d.day}</span>
                <span className="fc-weather-icon">{d.icon}</span>
                <span className="fc-high">{d.high}°</span>
                <span className="fc-low">{d.low}°</span>
                <span className="fc-rain">🌧 {d.rain}mm</span>
                <span className="fc-humid">💧 {d.humidity}%</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Monthly Weather History (2026)</h3>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Avg Temp (°C)</th>
                    <th>Total Rainfall (mm)</th>
                    <th>Sugarcane Suitability</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.month}>
                      <td className="td-bold">{h.month} 2026</td>
                      <td>{h.temp}°C</td>
                      <td>{h.rain} mm</td>
                      <td>
                        <span className={`status-badge status-${h.rain > 100 ? 'good' : h.rain > 50 ? 'moderate' : 'low'}`}>
                          {h.rain > 100 ? 'Optimal' : h.rain > 50 ? 'Good' : 'Low Rainfall'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'impact' && (
          <div className="impact-grid">
            {impacts.map(i => (
              <div className="impact-card" key={i.factor}>
                <div className="impact-header">
                  <span className="impact-icon">{i.icon}</span>
                  <div>
                    <span className="impact-factor">{i.factor}</span>
                    <span className="impact-value">{i.value}</span>
                  </div>
                  <span className="impact-badge" style={{ background: `${i.color}22`, color: i.color }}>{i.impact}</span>
                </div>
                <p className="impact-note">{i.note}</p>
              </div>
            ))}
            <div className="impact-summary">
              <h3>Overall Weather Impact on Yield</h3>
              <div className="impact-meter">
                <div className="impact-fill" style={{ width: '78%' }} />
              </div>
              <p><strong>78% favorable conditions.</strong> Current weather is well-suited for sugarcane growth. Monitor rainfall next week — forecast shows 42mm which may temporarily increase humidity and disease pressure.</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
