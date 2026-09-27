import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  CloudSun,
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  Droplets,
  Wind,
  Thermometer,
  Eye,
  Compass,
  Search,
  ArrowRight,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import Badge from '../components/ui/Badge';
import { useField } from '../context/FieldContext';
import { weatherApi } from '../services/api';

export default function WeatherPage() {
  const navigate = useNavigate();
  const { selectedFarm } = useField();
  const farmLoc = selectedFarm ? (selectedFarm.district || selectedFarm.location?.split(',')[0]?.trim() || 'Kolhapur') : 'Kolhapur';
  const [location, setLocation] = useState(farmLoc);
  const [input, setInput]       = useState(farmLoc);
  const [current, setCurrent]   = useState(null);
  const [forecast, setForecast] = useState([]);
  const [history, setHistory]   = useState([]);
  const [impact, setImpact]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('forecast');

  useEffect(() => {
    if (selectedFarm) {
      const loc = selectedFarm.district || selectedFarm.location?.split(',')[0]?.trim() || 'Kolhapur';
      setLocation(loc);
      setInput(loc);
    }
  }, [selectedFarm]);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(location); }, [location]);

  const c = current;

  const renderWeatherIcon = (desc, size = 32) => {
    if (!desc) return <CloudSun size={size} className="text-amber-400" />;
    const d = desc.toLowerCase();
    if (d.includes('rain') || d.includes('drizzle')) return <CloudRain size={size} className="text-sky-400" />;
    if (d.includes('cloud')) return <Cloud size={size} className="text-slate-400" />;
    if (d.includes('clear') || d.includes('sun')) return <Sun size={size} className="text-amber-400" />;
    if (d.includes('storm') || d.includes('thunder')) return <CloudLightning size={size} className="text-purple-400" />;
    return <CloudSun size={size} className="text-amber-400" />;
  };

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <span className="eyebrow">
              <CloudSun size={13} />
              Climate Intelligence Engine
            </span>
            <h1 className="page-title">Agro-Meteorological Dashboard</h1>
            <p className="page-subtitle">Live local observations, 7-day forecast, seasonal telemetry, and cane biomass impact.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {c?.is_demo && <Badge variant="warning" dot>Demo Data Feed</Badge>}
            <button
              className="btn-primary"
              onClick={() => navigate(`/prediction?location=${encodeURIComponent(location)}`)}
            >
              <Sparkles size={16} />
              <span>Predict Yield with Weather</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Location Search Bar */}
        <div className="card" style={{ padding: '12px 18px', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, color: 'var(--text-muted)' }} />
              <input
                placeholder="Enter sugarcane farming district (e.g. Kolhapur, Mandya, Pune, Belagavi)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setLocation(input)}
                style={{ paddingLeft: 42 }}
              />
            </div>
            <button className="btn-primary" onClick={() => setLocation(input)}>
              Search Weather
            </button>
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Fetching live meteorological telemetry for {location}…</p>
          </div>
        ) : (
          <>
            {/* Current Weather Hero */}
            {c && (
              <div style={{
                background: 'linear-gradient(135deg, #0c281e 0%, #0e3d2c 50%, #084030 100%)',
                borderRadius: 18,
                padding: '28px 32px',
                color: '#ffffff',
                marginBottom: 24,
                boxShadow: '0 16px 36px -8px rgba(12, 40, 30, 0.4)',
                border: '1px solid rgba(52, 211, 153, 0.25)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {renderWeatherIcon(c.description, 36)}
                    </div>
                    <div>
                      <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        {c.temperature}°<span style={{ fontSize: 22, fontWeight: 500, color: '#a7f3d0' }}>C</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#6ee7b7', margin: '4px 0' }}>
                        {c.description || 'Partly Cloudy'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#d1fae5' }}>
                        <MapPin size={13} /> {c.location}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, minWidth: 320 }}>
                    {[
                      { icon: Droplets, label: 'Humidity', value: `${c.humidity}%` },
                      { icon: CloudRain, label: 'Rainfall', value: `${c.rainfall || 0} mm` },
                      { icon: Wind, label: 'Wind Speed', value: `${c.wind_speed || 0} km/h` },
                      { icon: Thermometer, label: 'Feels Like', value: `${c.feels_like || c.temperature}°C` },
                      { icon: Eye, label: 'Visibility', value: `${c.visibility || 10} km` },
                      { icon: Compass, label: 'Pressure', value: `${c.pressure || 1012} hPa` },
                    ].map(m => {
                      const MetricIcon = m.icon;
                      return (
                        <div key={m.label} style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <MetricIcon size={14} style={{ color: '#6ee7b7', marginBottom: 2 }} />
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>{m.value}</div>
                          <div style={{ fontSize: 11, color: '#a7f3d0' }}>{m.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              {[
                { id: 'forecast', label: '7-Day Forecast', icon: Calendar },
                { id: 'history', label: 'Seasonal Telemetry History', icon: CloudSun },
                { id: 'impact', label: 'Sugarcane Phenology Impact', icon: Sparkles }
              ].map(t => {
                const TabIcon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    className={`btn ${active ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setTab(t.id)}
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    <TabIcon size={15} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: 7-Day Forecast */}
            {tab === 'forecast' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
                {forecast.map(d => (
                  <div key={d.day} className="card" style={{ padding: '18px 14px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{d.day}</span>
                    <div style={{ padding: 6 }}>{renderWeatherIcon(d.description, 26)}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{d.high}°</span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{d.low}°</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CloudRain size={12} /> {d.rainfall}mm
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Droplets size={12} /> {d.humidity}%
                    </div>
                    {d.sugarcane_impact && (
                      <Badge variant={d.sugarcane_impact === 'Optimal' ? 'success' : 'warning'} size="sm">
                        {d.sugarcane_impact}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Seasonal History */}
            {tab === 'history' && history.length > 0 && (
              <div className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Monthly Meteorological Distribution</h3>
                  <Badge variant="info">Historical Observations</Badge>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={history} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 232, 240, 0.6)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis yAxisId="temp" orientation="left" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis yAxisId="rain" orientation="right" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip contentStyle={{ borderRadius: 10 }} />
                    <Legend />
                    <Bar yAxisId="temp" dataKey="avg_temp" fill="#f59e0b" name="Avg Temp (°C)" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="rain" dataKey="total_rainfall" fill="#0ea5e9" name="Precipitation (mm)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div style={{ marginTop: 20, overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Avg Temp (°C)</th>
                        <th>Precipitation (mm)</th>
                        <th>Avg Humidity</th>
                        <th>Sugarcane Growth Compatibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(h => (
                        <tr key={h.month}>
                          <td><strong>{h.month}</strong></td>
                          <td>{h.avg_temp}°C</td>
                          <td>{h.total_rainfall} mm</td>
                          <td>{h.avg_humidity}%</td>
                          <td>
                            <Badge variant={h.sugarcane_suitability === 'Good' ? 'success' : 'warning'} size="sm">
                              {h.sugarcane_suitability}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Crop Impact */}
            {tab === 'impact' && impact && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                <div className="card" style={{ padding: 22 }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Thermometer size={18} className="text-amber-500" />
                    Thermal Degree Days Impact
                  </h3>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {impact.thermal_impact || 'Current day-night thermal regime supports steady internode elongation and biomass synthesis without heat stress.'}
                  </p>
                </div>

                <div className="card" style={{ padding: 22 }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Droplets size={18} className="text-sky-500" />
                    Vapor Pressure Deficit (VPD)
                  </h3>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {impact.moisture_impact || 'Relative humidity remains in the optimal 65-75% transpiration window, minimizing moisture-deficit stomatal closure.'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
