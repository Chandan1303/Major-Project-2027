import React, { useEffect, useState, useRef, useMemo } from 'react';
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
import { useField } from '../context/FieldContext';

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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function normalizeMapCoordinates(latitude, longitude, indiaOnly = false) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const isValidPair = (candidateLat, candidateLng) => Number.isFinite(candidateLat)
    && Number.isFinite(candidateLng)
    && candidateLat >= -90 && candidateLat <= 90
    && candidateLng >= -180 && candidateLng <= 180;
  const isInIndia = (candidateLat, candidateLng) => candidateLat >= 6 && candidateLat <= 38
    && candidateLng >= 68 && candidateLng <= 98.5;

  if (!isValidPair(lat, lng)) return null;
  if (isInIndia(lat, lng)) return { latitude: lat, longitude: lng, corrected: false };
  if (isValidPair(lng, lat) && isInIndia(lng, lat)) {
    return { latitude: lng, longitude: lat, corrected: true };
  }
  // (0, 0) is commonly stored as a default; it is not a valid Indian farm pin.
  if ((lat === 0 && lng === 0) || indiaOnly) return null;
  return { latitude: lat, longitude: lng, corrected: false };
}

function hasCurrentRiskAssessment(field) {
  const assessedAt = field?.risk_assessed_at ? new Date(field.risk_assessed_at).getTime() : NaN;
  const age = Date.now() - assessedAt;
  return Number.isFinite(assessedAt) && age >= 0 && age <= 30 * 86400000;
}

const VILLAGE_BOUNDARY_QUERY_URL = 'https://livingatlas.esri.in/server/rest/services/IAB2024/IAB_Village_2024/MapServer/0/query';
const KNOWN_TOWN_CENTERS = {
  belagavi: { latitude: 15.8497, longitude: 74.4977, label: 'Belagavi' },
  erode: { latitude: 11.3306, longitude: 77.7277, label: 'Erode' },
  kolhapur: { latitude: 16.7050, longitude: 74.2433, label: 'Kolhapur' },
  mandya: { latitude: 12.5218, longitude: 76.8951, label: 'Mandya' },
  meerut: { latitude: 28.9845, longitude: 77.7064, label: 'Meerut' },
  pune: { latitude: 18.5204, longitude: 73.8567, label: 'Pune' }
};

function resolveKnownTownCenter(farm) {
  const location = [farm.location, farm.district, farm.state].filter(Boolean).join(', ').toLowerCase();
  const match = Object.entries(KNOWN_TOWN_CENTERS).find(([name]) => location.includes(name));
  return match ? { ...match[1], location_source: 'town_center' } : null;
}

async function resolveVillageCenter(farm) {
  const village = String(farm.location || '').trim();
  const district = String(farm.district || '').trim();
  const state = String(farm.state || '').trim();
  if (!village || !district || !state) return null;

  const cacheKey = `sugar-yield-village-center:${state.toLowerCase()}:${district.toLowerCase()}:${village.toLowerCase()}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch { /* Ignore unavailable or invalid local cache. */ }

  const safeSql = value => value.replace(/'/g, "''");
  const villageSql = safeSql(village);
  const where = `state='${safeSql(state)}' AND district='${safeSql(district)}' AND (name LIKE '${villageSql}' OR lgd_villagename LIKE '${villageSql}' OR censusname LIKE '${villageSql}')`;
  const params = new URLSearchParams({
    where,
    outFields: 'name,district,state,lgd_villagecode',
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: '1',
    f: 'geojson'
  });

  try {
    const response = await fetch(`${VILLAGE_BOUNDARY_QUERY_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return null;
    const data = await response.json();
    const feature = data.features?.[0];
    if (!feature?.geometry) return null;
    const bounds = L.geoJSON(feature).getBounds();
    if (!bounds.isValid()) return null;
    const center = bounds.getCenter();
    const result = {
      latitude: center.lat,
      longitude: center.lng,
      location_source: 'village_center',
      matched_village: feature.properties?.lgd_villagecode || feature.properties?.name || village
    };
    try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch { /* Cache is optional. */ }
    return result;
  } catch (error) {
    console.warn(`Could not locate village ${village} on the map.`, error);
    return null;
  }
}

export default function FarmMapPage() {
  const navigate = useNavigate();
  const { selectedFarm: globalFarm, selectedField: globalField, selectFarm, selectField } = useField();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [selectedField, setSelectedField] = useState(globalField || null);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  const farmVarieties = useMemo(() => {
    if (!activeFarm?.fields?.length) return [];
    const map = {};
    for (const f of activeFarm.fields) {
      const v = f.sugarcane_variety || 'Unspecified Variety';
      map[v] = (map[v] || 0) + (Number(f.area) || 0);
    }
    return Object.entries(map).map(([variety, area]) => ({ variety, area: Number(area.toFixed(1)) }));
  }, [activeFarm]);

  const farmAgronomics = useMemo(() => {
    if (!activeFarm?.fields?.length) return { soils: [], irrigations: [], avgMoisture: null, avgPh: null };
    const soils = [...new Set(activeFarm.fields.map(f => f.soil_type).filter(Boolean))];
    const irrigations = [...new Set(activeFarm.fields.map(f => f.irrigation_method).filter(Boolean))];
    const moistureFields = activeFarm.fields.filter(f => {
      const measuredAt = f.soil_moisture_recorded_at ? new Date(f.soil_moisture_recorded_at).getTime() : NaN;
      const age = Date.now() - measuredAt;
      return f.soil_moisture != null && Number.isFinite(Number(f.soil_moisture))
        && Number.isFinite(measuredAt) && age >= 0 && age <= 30 * 86400000;
    });
    const avgMoisture = moistureFields.length
      ? Math.round(moistureFields.reduce((sum, f) => sum + Number(f.soil_moisture), 0) / moistureFields.length)
      : null;
    const phFields = activeFarm.fields.filter(f => f.soil_ph != null && Number.isFinite(Number(f.soil_ph)));
    const avgPh = phFields.length
      ? (phFields.reduce((sum, f) => sum + Number(f.soil_ph), 0) / phFields.length).toFixed(1)
      : null;
    return { soils, irrigations, avgMoisture, avgPh };
  }, [activeFarm]);

  const selectedMoistureTimestamp = selectedField?.soil_moisture_recorded_at
    ? new Date(selectedField.soil_moisture_recorded_at).getTime()
    : NaN;
  const selectedMoistureIsFresh = selectedField?.soil_moisture != null
    && Number.isFinite(selectedMoistureTimestamp)
    && Date.now() - selectedMoistureTimestamp >= 0
    && Date.now() - selectedMoistureTimestamp <= 30 * 86400000;

  const hasSpatialData = farms.some(farm =>
    Boolean(normalizeMapCoordinates(farm.latitude, farm.longitude, Boolean(farm.state)))
    || (farm.fields || []).some(field =>
      Boolean(normalizeMapCoordinates(field.latitude, field.longitude, Boolean(farm.state))) || Boolean(field.boundary_geojson)
    )
  );

  // 1. Fetch Farm Map Data and Weather
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setMapError('');

    const fetchMap = async () => {
      try {
        let farmList = [];
        if (typeof farmApi.mapData === 'function') {
          try {
            const response = await farmApi.mapData();
            farmList = response?.data?.farms || response?.farms || [];
          } catch (mapError) {
            console.warn('Farm map details unavailable; loading the registered farm list instead.', mapError);
          }
        }
        if (!Array.isArray(farmList) || farmList.length === 0) {
          const response = await farmApi.list();
          farmList = response?.data?.farms || response?.farms || [];
        }
        if (Array.isArray(farmList)) {
          farmList = await Promise.all(farmList.map(async farm => {
            const coordinates = normalizeMapCoordinates(farm.latitude, farm.longitude, Boolean(farm.state));
            if (coordinates) {
              return {
                ...farm,
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                location_source: coordinates.corrected ? 'coordinate_order_corrected' : farm.location_source
              };
            }
            const villageCenter = await resolveVillageCenter(farm);
            const townCenter = villageCenter ? null : resolveKnownTownCenter(farm);
            return villageCenter || townCenter
              ? { ...farm, ...(villageCenter || townCenter) }
              : { ...farm, latitude: null, longitude: null };
          }));
        }
        if (!isMounted) return;
        setFarms(Array.isArray(farmList) ? farmList : []);
        if (farmList.length > 0) {
          setActiveFarm(farmList.find(farm => String(farm.id || farm.farm_id) === String(globalFarm?.id)) || farmList[0]);
          setSelectedField(globalField || null);
        } else {
          setActiveFarm(null);
          setSelectedField(null);
        }
      } catch (error) {
        if (!isMounted) return;
        setFarms([]);
        setActiveFarm(null);
        setMapError(error.message || 'Farm and map data could not be loaded.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMap();

    return () => {
      isMounted = false;
    };
  }, [loadAttempt]);

  useEffect(() => {
    if (!activeFarm?.location && !activeFarm?.district) { setWeatherInfo(null); return; }
    weatherApi.current(activeFarm.location || activeFarm.district)
      .then(res => {
        const weather = res.data || null;
        setWeatherInfo(weather);
        const coordinates = normalizeMapCoordinates(weather?.latitude, weather?.longitude, Boolean(activeFarm.state));
        if (!coordinates) return;
        const activeId = String(activeFarm.id || activeFarm.farm_id);
        setFarms(current => current.map(farm => {
          if (String(farm.id || farm.farm_id) !== activeId
            || normalizeMapCoordinates(farm.latitude, farm.longitude, Boolean(farm.state))) return farm;
          return {
            ...farm,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            location_source: 'weather_center'
          };
        }));
      })
      .catch(() => setWeatherInfo(null));
  }, [activeFarm?.id, activeFarm?.farm_id, activeFarm?.location, activeFarm?.district]);

  useEffect(() => {
    if (globalFarm) {
      const matchingFarm = farms.find(farm => String(farm.id || farm.farm_id) === String(globalFarm.id));
      if (matchingFarm) setActiveFarm(matchingFarm);
    }
    setSelectedField(globalField || null);
  }, [globalFarm, globalField, farms]);

  // 2. Initialize Leaflet Map (Safe, Clean OpenStreetMap Only)
  useEffect(() => {
    if (loading || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const geolocatedFarms = farms.filter(farm => normalizeMapCoordinates(farm.latitude, farm.longitude, Boolean(farm.state)));
    const fieldLocations = farms.flatMap(farm => (farm.fields || [])
      .map(field => normalizeMapCoordinates(field.latitude, field.longitude, Boolean(farm.state)))
      .filter(Boolean)
      .map(({ latitude, longitude }) => [latitude, longitude]));
    const mapLocations = [
      ...geolocatedFarms.map(farm => [Number(farm.latitude), Number(farm.longitude)]),
      ...fieldLocations
    ];

    try {
      const map = L.map(mapContainerRef.current, {
        center: mapLocations.length ? mapLocations[0] : [20.5937, 78.9629],
        zoom: mapLocations.length ? 8 : 4,
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

      geolocatedFarms.forEach(farm => {
        const { latitude: lat, longitude: lng } = normalizeMapCoordinates(farm.latitude, farm.longitude, Boolean(farm.state));

        const currentAssessments = (farm.fields || []).filter(hasCurrentRiskAssessment);
        const hasHighRisk = currentAssessments.some(f => ['high', 'critical'].includes(String(f.risk_level || '').toLowerCase()));
        const hasNormalRisk = currentAssessments.some(f => String(f.risk_level || '').toLowerCase() === 'low');
        const hasMonitorRisk = currentAssessments.some(f => String(f.risk_level || '').toLowerCase() === 'medium');
        const color = hasHighRisk ? '#ef4444' : hasMonitorRisk ? '#f59e0b' : hasNormalRisk ? '#10b981' : '#64748b';

        const marker = L.marker([lat, lng], {
          icon: createCustomPin(color, '🌾')
        });

        const popupContent = `
          <div style="font-family: inherit; min-width: 220px; padding: 4px;">
            <strong style="font-size: 14px; color: #10b981; display: block; margin-bottom: 2px;">${escapeHtml(farm.name)}</strong>
            <span style="font-size: 11.5px; color: #64748b; display: block; margin-bottom: 8px;">${escapeHtml([farm.location, farm.district, farm.state].filter(Boolean).join(', ') || 'Sugarcane Region')}</span>
            ${farm.location_source === 'village_center' ? '<span style="font-size: 11px; color: #2563eb; display: block; margin-bottom: 8px;">Approximate village center</span>' : ''}
            ${farm.location_source === 'weather_center' ? '<span style="font-size: 11px; color: #2563eb; display: block; margin-bottom: 8px;">Approximate town center; set farm coordinates for an exact pin</span>' : ''}
            ${farm.location_source === 'town_center' ? '<span style="font-size: 11px; color: #2563eb; display: block; margin-bottom: 8px;">Approximate town center; set farm coordinates for an exact pin</span>' : ''}
            <div style="font-size: 12.5px; margin-bottom: 6px;">
              📐 Area: <strong>${farm.total_area ?? '—'} ha</strong> (${farm.fields?.length || 0} fields)
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 6px;">
              <strong style="font-size: 11px; color: #475569; text-transform: uppercase;">Parcels:</strong>
              ${(farm.fields || []).map(fld => `
                <div style="font-size: 11.5px; margin-top: 3px; display: flex; justify-content: space-between;">
                  <span>${escapeHtml(fld.field_name || fld.name || 'Field')} (${escapeHtml(fld.variety || fld.sugarcane_variety || 'Variety unavailable')})</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => handleSelectFarm(farm));

        markersLayer.addLayer(marker);
      });

      farms.forEach(farm => {
        (farm.fields || []).forEach(field => {
          const fieldId = field.field_id || field.id;
          const fieldName = field.field_name || field.name || `Field ${fieldId || ''}`;
          const variety = field.variety || field.sugarcane_variety || 'Variety unavailable';
          const riskIsCurrent = hasCurrentRiskAssessment(field);
          const fieldRisk = riskIsCurrent ? String(field.risk_level || '').toLowerCase() : '';
          const color = ['high', 'critical'].includes(fieldRisk) ? '#dc2626'
            : fieldRisk === 'medium' ? '#f59e0b' : fieldRisk === 'low' ? '#059669' : '#64748b';
          const selectParcel = () => {
            setActiveFarm(farm);
            setSelectedField(field);
            selectFarm(farm.farm_id || farm.id);
            if (fieldId) selectField(fieldId);
          };

          if (field.boundary_geojson) {
            try {
              const boundary = typeof field.boundary_geojson === 'string'
                ? JSON.parse(field.boundary_geojson)
                : field.boundary_geojson;
              const boundaryLayer = L.geoJSON(boundary, {
                style: { color, weight: 2, fillColor: color, fillOpacity: 0.18 }
              });
              boundaryLayer.bindPopup(`<strong>${escapeHtml(fieldName)}</strong><br>${escapeHtml(farm.name)} · ${escapeHtml(variety)}`);
              boundaryLayer.on('click', selectParcel);
              boundaryLayer.addTo(map);
              const boundaryBounds = boundaryLayer.getBounds();
              if (boundaryBounds.isValid()) mapLocations.push(...boundaryBounds.getSouthWest().equals(boundaryBounds.getNorthEast()) ? [boundaryBounds.getSouthWest()] : [boundaryBounds.getSouthWest(), boundaryBounds.getNorthEast()]);
            } catch {
              console.warn(`Invalid parcel boundary GeoJSON for field ${fieldId}.`);
            }
          }

          const fieldCoordinates = normalizeMapCoordinates(field.latitude, field.longitude, Boolean(farm.state));
          if (fieldCoordinates) {
            const marker = L.marker([fieldCoordinates.latitude, fieldCoordinates.longitude], { icon: createCustomPin(color, 'F') });
            marker.bindPopup(`<strong>${escapeHtml(fieldName)}</strong><br>${escapeHtml(farm.name)} · ${escapeHtml(variety)}<br>${Number(field.area || 0).toFixed(1)} ha`);
            marker.on('click', selectParcel);
            markersLayer.addLayer(marker);
          }
        });
      });

      if (mapLocations.length > 1) {
        const bounds = L.latLngBounds(mapLocations);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      } else if (mapLocations.length === 1) {
        map.setView(mapLocations[0], 11);
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
    selectFarm(farm.id || farm.farm_id);
    if (mapInstanceRef.current && farm.latitude != null && farm.longitude != null) {
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
        ) : mapError ? (
          <div className="card" role="alert" style={{ padding: 28, textAlign: 'center' }}>
            <AlertTriangle size={24} style={{ color: '#d97706', marginBottom: 8 }} />
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Farm map unavailable</h2>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 16px' }}>{mapError}</p>
            <button className="btn-primary" onClick={() => setLoadAttempt(attempt => attempt + 1)}>Try again</button>
          </div>
        ) : farms.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <Warehouse size={25} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>No registered farms</h2>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 16px' }}>Add a farm to see it on the map.</p>
            <button className="btn-primary" onClick={() => navigate('/farms')}>Manage farms</button>
          </div>
        ) : (
          <div className="map-layout">
            {/* Sidebar List */}
            <div className="map-sidebar">
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                          <span>{Number(f.total_area || 0).toFixed(1)} ha • {f.fields?.length || 0} fields</span>
                            {(f.latitude == null || f.longitude == null) ? (
                            <span style={{ color: '#d97706', fontSize: 10.5, fontWeight: 600 }}>Not geolocated</span>
                            ) : f.location_source === 'village_center' ? (
                              <span style={{ color: '#2563eb', fontSize: 10.5, fontWeight: 600 }}>Village center estimate</span>
                            ) : ['weather_center', 'town_center'].includes(f.location_source) ? (
                              <span style={{ color: '#2563eb', fontSize: 10.5, fontWeight: 600 }}>Town center estimate</span>
                          ) : f.location_source === 'coordinate_order_corrected' ? (
                            <span style={{ color: '#2563eb', fontSize: 10.5, fontWeight: 600 }}>Coordinates corrected</span>
                          ) : (
                            <span style={{ color: '#10b981', fontSize: 10.5, fontWeight: 600 }}>📍 Coordinates recorded</span>
                          )}
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
                    <span>{weatherInfo?.temperature ?? 'Unavailable'}{weatherInfo?.temperature != null ? '°C' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CloudRain size={14} className="text-sky-500" />
                    <span>{weatherInfo?.rainfall ?? 'Unavailable'}{weatherInfo?.rainfall != null ? ' mm' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Droplets size={14} className="text-cyan-500" />
                    <span>{weatherInfo?.humidity ?? 'Unavailable'}{weatherInfo?.humidity != null ? '%' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{weatherInfo?.observed_at || weatherInfo?.updated_at || 'Observation time unavailable'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Map */}
            <div className="map-main" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Native Leaflet Map Container */}
              {hasSpatialData ? (
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
              ) : (
                <div className="card" style={{ minHeight: 300, display: 'grid', placeContent: 'center', textAlign: 'center', padding: 24 }}>
                  <MapPin size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
                  <strong>Farm location needs coordinates</strong>
                  <span style={{ color: 'var(--text-muted)', marginTop: 6 }}>
                    No valid Indian farm or field coordinates were found. Check the village, district, and state, or enter the parcel’s latitude and longitude under Manage Farm Holdings. We hide invalid points instead of placing them in the wrong country.
                  </span>
                </div>
              )}
              {farms.some(farm => ['village_center', 'weather_center', 'town_center'].includes(farm.location_source)) && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: -8 }}>
                  Estimated town or village centers; markers do not show surveyed farm boundaries. Add farm coordinates for an exact pin.
                </div>
              )}

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
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{[activeFarm.district, activeFarm.location || activeFarm.address].filter(Boolean).join(' · ')}</span>
                      </div>
                    </div>
                    <Badge variant={activeFarm.latitude != null && activeFarm.longitude != null ? (['village_center', 'weather_center', 'town_center', 'coordinate_order_corrected'].includes(activeFarm.location_source) ? 'warning' : 'success') : 'warning'} dot>
                      {activeFarm.location_source === 'village_center' ? 'Village center estimate' : ['weather_center', 'town_center'].includes(activeFarm.location_source) ? 'Approximate town center' : activeFarm.location_source === 'coordinate_order_corrected' ? 'Coordinate order corrected' : activeFarm.latitude != null && activeFarm.longitude != null ? 'Farm coordinates recorded' : 'Farm not geolocated'}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}>
                    <div><span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>TOTAL FARM AREA</span><strong>{Number(activeFarm.total_area || 0).toFixed(1)} ha</strong></div>
                    <div><span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>REGISTERED FIELDS</span><strong>{activeFarm.fields?.length || 0}</strong></div>
                  </div>

                  {/* Selected Farm Live Weather Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'var(--bg-panel)', border: '1px solid var(--border)', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CloudRain size={16} style={{ color: '#10b981' }} />
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>Microclimate Telemetry:</strong>
                      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>📍 {activeFarm.location || activeFarm.district || 'Regional station'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12.5 }}>
                      <div>Temp: <strong>{weatherInfo?.temperature != null ? `${weatherInfo.temperature}°C` : 'Unavailable'}</strong></div>
                      <div>Precip: <strong>{weatherInfo?.rainfall != null ? `${weatherInfo.rainfall} mm` : 'Unavailable'}</strong></div>
                      <div>Humidity: <strong>{weatherInfo?.humidity != null ? `${weatherInfo.humidity}%` : 'Unavailable'}</strong></div>
                    </div>
                    <span style={{ flexBasis: '100%', fontSize: 11, color: 'var(--text-muted)' }}>
                      Observed: {weatherInfo?.observed_at || 'Unavailable'} · Source: {weatherInfo?.source || 'Unavailable'}
                    </span>
                  </div>

                  {/* Cultivar Variety Breakdown */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Sugarcane Cultivar Distribution ({activeFarm.fields?.length || 0} Parcels):
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {farmVarieties.length === 0 ? (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No cultivar varieties assigned</span>
                      ) : (
                        farmVarieties.map((v, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: 8,
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: 'var(--primary)',
                              border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}
                          >
                            🌱 {v.variety} ({v.area} ha)
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Edaphic & Irrigation Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, background: 'var(--border-subtle)', padding: 12, borderRadius: 12, marginBottom: 16 }}>
                    <div>
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dominant Soils</span>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                        {farmAgronomics.soils.join(', ') || 'Soil data unavailable'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Irrigation Delivery</span>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0284c7', marginTop: 2 }}>
                        {farmAgronomics.irrigations.join(', ') || 'Drip / Furrow'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mean Moisture & pH</span>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginTop: 2 }}>
                        {farmAgronomics.avgMoisture != null ? `${farmAgronomics.avgMoisture}%` : 'Moisture unavailable'}
                        {farmAgronomics.avgPh != null ? ` • pH ${farmAgronomics.avgPh}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Field Selector Tabs */}
                  {activeFarm.fields?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Select Field Parcel:</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {activeFarm.fields.map(fld => {
                          const isFldActive = String(selectedField?.field_id || selectedField?.id) === String(fld.field_id || fld.id);
                          return (
                            <button
                              key={fld.field_id || fld.name}
                              onClick={() => { setSelectedField(fld); selectField(fld.id || fld.field_id); }}
                              className={`btn ${isFldActive ? 'btn-primary' : 'btn-outline'}`}
                              style={{ padding: '6px 12px', fontSize: 12 }}
                            >
                              <Sprout size={13} />
                            <span>{fld.field_name || fld.name} ({fld.variety || fld.sugarcane_variety || 'Variety unavailable'})</span>
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
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedField.sugarcane_variety || selectedField.variety || 'Unavailable'}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Forecasted Yield</span>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{selectedField.predicted_yield != null ? `${selectedField.predicted_yield} t/ha` : 'No prediction recorded'}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk Level</span>
                        <div>
                          <Badge variant={!hasCurrentRiskAssessment(selectedField) ? 'default' : ['high', 'critical'].includes(selectedField.risk_level?.toLowerCase()) ? 'critical' : selectedField.risk_level?.toLowerCase() === 'low' ? 'success' : 'warning'} size="sm">
                            {hasCurrentRiskAssessment(selectedField) ? selectedField.risk_level : 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Soil & pH</span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedField.soil_type || 'Unavailable'} (pH {selectedField.soil_ph ?? 'Unavailable'})</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Soil Moisture</span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0ea5e9' }}>
                          {selectedMoistureIsFresh ? `${selectedField.soil_moisture}%` : selectedField.soil_moisture_recorded_at ? 'Reading outdated' : 'Data unavailable'}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={() => navigate('/farms')}>
                      <span>Manage Farm Holdings</span>
                      <ArrowRight size={14} />
                    </button>
                    <button className="btn-outline" onClick={() => navigate(selectedField ? `/prediction?farm_id=${activeFarm.id || activeFarm.farm_id}&field_id=${selectedField.id || selectedField.field_id}` : `/prediction?farm_id=${activeFarm.id || activeFarm.farm_id}`)}>
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
