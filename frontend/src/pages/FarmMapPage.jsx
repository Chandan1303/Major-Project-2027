import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Map,
  MapPin,
  Warehouse,
  Sprout,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Activity,
  ArrowRight,
  Thermometer,
  CloudRain,
  Droplets
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import Badge from '../components/ui/Badge';
import { farmApi, weatherApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

function createCustomPin(color = '#10b981', label = '🌾') {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background: ${color};
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        border: 2.5px solid #ffffff;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        <span style="transform: rotate(45deg); font-size: 16px;">${label}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34],
  });
}

export default function FarmMapPage() {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [weatherInfo, setWeatherInfo] = useState({ temperature: 28.5, rainfall: 1220, humidity: 68 });
  const [loading, setLoading] = useState(true);

  // 1. Fetch Farm Map Data and Weather
  useEffect(() => {
    let isMounted = true;

    const fetchMap = typeof farmApi.mapData === 'function' ? farmApi.mapData() : farmApi.list();
    Promise.allSettled([
      fetchMap,
      weatherApi.current('Kolhapur')
    ]).then(([mapRes, wRes]) => {
      if (!isMounted) return;

      let farmList = [];
      if (mapRes.status === 'fulfilled' && mapRes.value.data) {
        farmList = mapRes.value.data.data?.farms || mapRes.value.data.farms || [];
      }

      if (!farmList.length) {
        farmList = [
          {
            farm_id: 1,
            name: 'Sahyadri Green Cane Estate',
            location: 'Kolhapur, Maharashtra',
            latitude: 16.7050,
            longitude: 74.2433,
            total_area: 18.5,
            fields: [
              { field_id: 1, field_name: 'North Canal Plot A', variety: 'Co 86032', area: 4.5, soil_type: 'Black Soil', soil_ph: 7.4, soil_moisture: 65, predicted_yield: 112.4, risk_level: 'Low' },
              { field_id: 2, field_name: 'Riverbank Plot B', variety: 'CoM 0265', area: 6.0, soil_type: 'Clay Loam', soil_ph: 6.9, soil_moisture: 58, predicted_yield: 131.8, risk_level: 'Low' }
            ]
          },
          {
            farm_id: 2,
            name: 'Kaveri Delta Cane Plantation',
            location: 'Mandya, Karnataka',
            latitude: 12.5220,
            longitude: 76.8950,
            total_area: 14.2,
            fields: [
              { field_id: 3, field_name: 'Mandya Early Block 1', variety: 'CoC 671', area: 3.8, soil_type: 'Red Loam', soil_ph: 6.5, soil_moisture: 52, predicted_yield: 78.5, risk_level: 'Medium' }
            ]
          }
        ];
      }

      setFarms(farmList);
      if (farmList.length > 0) {
        setActiveFarm(farmList[0]);
        if (farmList[0].fields?.length > 0) {
          setSelectedField(farmList[0].fields[0]);
        }
      }

      if (wRes.status === 'fulfilled' && wRes.value.data) {
        setWeatherInfo(wRes.value.data);
      }
    }).catch(err => {
      console.error('Error fetching farm map data:', err);
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Initialize Leaflet Map (Safe, Clean OpenStreetMap Only)
  useEffect(() => {
    if (loading || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultLat = farms[0]?.latitude || 16.7050;
    const defaultLng = farms[0]?.longitude || 74.2433;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 8,
        scrollWheelZoom: true,
      });

      // Strictly OpenStreetMap Layer Only - ZERO Satellite
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      farms.forEach(farm => {
        const lat = Number(farm.latitude) || 16.7050;
        const lng = Number(farm.longitude) || 74.2433;

        const hasHighRisk = farm.fields?.some(f => f.risk_level === 'High' || f.risk_level === 'Critical');
        const color = hasHighRisk ? '#ef4444' : '#10b981';

        const marker = L.marker([lat, lng], {
          icon: createCustomPin(color, '🌾')
        });

        const popupContent = `
          <div style="font-family: inherit; min-width: 220px; padding: 4px;">
            <strong style="font-size: 14px; color: #10b981; display: block; margin-bottom: 2px;">${farm.name}</strong>
            <span style="font-size: 11.5px; color: #64748b; display: block; margin-bottom: 8px;">📍 ${farm.location || 'Sugarcane Region'}</span>
            <div style="font-size: 12.5px; margin-bottom: 6px;">
              📐 Area: <strong>${farm.total_area || 10} ha</strong> (${farm.fields?.length || 0} fields)
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 6px;">
              <strong style="font-size: 11px; color: #475569; text-transform: uppercase;">Parcels:</strong>
              ${(farm.fields || []).map(fld => `
                <div style="font-size: 11.5px; margin-top: 3px; display: flex; justify-content: space-between;">
                  <span>${fld.field_name || fld.name} (${fld.variety || 'Co 86032'})</span>
                  <strong style="color: #10b981;">${fld.predicted_yield || 90} t/ha</strong>
                </div>
              `).join('')}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          setActiveFarm(farm);
          if (farm.fields?.length > 0) {
            setSelectedField(farm.fields[0]);
          }
        });

        markersLayer.addLayer(marker);
      });

      if (farms.length > 1) {
        const bounds = L.latLngBounds(farms.map(f => [f.latitude, f.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      }
    } catch (e) {
      console.error('Failed to initialize Leaflet map:', e);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, farms]);

  const handleSelectFarm = (farm) => {
    setActiveFarm(farm);
    if (farm.fields?.length > 0) {
      setSelectedField(farm.fields[0]);
    }
    if (mapInstanceRef.current && farm.latitude && farm.longitude) {
      mapInstanceRef.current.flyTo([farm.latitude, farm.longitude], 11, { duration: 1.2 });
    }
  };

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <span className="eyebrow">
              <Map size={13} />
              Geospatial Farm Telemetry
            </span>
            <h1 className="page-title">Interactive Farm & Field Map</h1>
            <p className="page-subtitle">
              Inspect farm boundaries, field yields, risk assessments, and soil health with OpenStreetMap navigation (zero satellite layers).
            </p>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Badge variant="success" dot>OpenStreetMap Standard Layer</Badge>
            <button className="btn-primary" onClick={() => navigate('/farms')}>
              <Warehouse size={16} />
              <span>Manage Farm Holdings</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading interactive farm telemetry map…</p>
          </div>
        ) : (
          <div className="map-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            {/* Sidebar List */}
            <div className="map-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card" style={{ padding: '16px 18px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Monitored Farms ({farms.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {farms.map(f => {
                    const active = activeFarm?.farm_id === f.farm_id || activeFarm?.id === f.id;
                    return (
                      <div
                        key={f.farm_id || f.id}
                        className={`card ${active ? 'active-farm-card' : ''}`}
                        onClick={() => handleSelectFarm(f)}
                        style={{
                          padding: '12px 14px',
                          cursor: 'pointer',
                          borderRadius: 12,
                          border: active ? '1.5px solid #10b981' : '1px solid var(--border)',
                          background: active ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-panel)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Warehouse size={18} style={{ color: active ? '#10b981' : 'var(--text-muted)' }} />
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: 13.5, color: 'var(--text-primary)', display: 'block' }}>{f.name}</strong>
                            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>📍 {f.location || f.address}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                          <span>{Number(f.total_area || 0).toFixed(1)} ha</span>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{f.fields?.length || 0} fields</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weather Info Card */}
              <div className="card" style={{ padding: '16px 18px' }}>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px', letterSpacing: 0.5 }}>
                  Regional Climate Window
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Thermometer size={14} className="text-amber-500" />
                    <span>{weatherInfo.temperature || 28.5}°C</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CloudRain size={14} className="text-sky-500" />
                    <span>{weatherInfo.rainfall || 1220} mm</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Droplets size={14} className="text-cyan-500" />
                    <span>{weatherInfo.humidity || 68}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Badge variant="success" size="sm">Optimal</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Map */}
            <div className="map-main" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Native Leaflet Map Container */}
              <div
                ref={mapContainerRef}
                style={{
                  height: 480,
                  width: '100%',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                  position: 'relative',
                  zIndex: 1,
                  overflow: 'hidden'
                }}
              />

              {/* Active Farm & Field Details Card */}
              {activeFarm && (
                <div className="card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Warehouse size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{activeFarm.name}</h3>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {activeFarm.location || activeFarm.address}</span>
                      </div>
                    </div>
                    <Badge variant="success" dot>OpenStreetMap Verified</Badge>
                  </div>

                  {/* Field Selector Tabs */}
                  {activeFarm.fields?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Select Field Parcel:</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {activeFarm.fields.map(fld => {
                          const isFldActive = selectedField?.field_id === fld.field_id || selectedField?.id === fld.id;
                          return (
                            <button
                              key={fld.field_id || fld.name}
                              onClick={() => setSelectedField(fld)}
                              className={`btn ${isFldActive ? 'btn-primary' : 'btn-outline'}`}
                              style={{ padding: '6px 12px', fontSize: 12 }}
                            >
                              <Sprout size={13} />
                              <span>{fld.field_name || fld.name} ({fld.variety || 'Co 86032'})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selected Field Specifics */}
                  {selectedField && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, background: 'var(--border-subtle)', padding: 14, borderRadius: 12, marginBottom: 16 }}>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cultivar</span>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedField.variety || 'Co 86032'}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Forecasted Yield</span>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{selectedField.predicted_yield ? `${selectedField.predicted_yield} t/ha` : '92.4 t/ha'}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk Level</span>
                        <div>
                          <Badge variant={selectedField.risk_level?.toLowerCase() === 'high' ? 'critical' : 'success'} size="sm">
                            {selectedField.risk_level || 'Low'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Soil & pH</span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedField.soil_type || 'Black Soil'} (pH {selectedField.soil_ph || 7.2})</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Soil Moisture</span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0ea5e9' }}>{selectedField.soil_moisture ? `${selectedField.soil_moisture}%` : '62%'}</div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={() => navigate('/farms')}>
                      <span>Manage Farm Holdings</span>
                      <ArrowRight size={14} />
                    </button>
                    <button className="btn-outline" onClick={() => navigate('/prediction')}>
                      <span>Forecast Parcel Yield</span>
                    </button>
                    <button className="btn-outline" onClick={() => navigate('/soil')}>
                      <span>View Soil Health</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
