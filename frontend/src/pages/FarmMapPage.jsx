import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AppLayout from '../components/AppLayout';
import { farmApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function greenIcon() {
  return new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });
}

// Known coordinates for major sugarcane regions
const LOCATION_COORDS = {
  'Maharashtra':    { lat: 18.5204, lng: 73.8567 },
  'Karnataka':      { lat: 12.9716, lng: 77.5946 },
  'Tamil Nadu':     { lat: 11.1271, lng: 78.6569 },
  'Uttar Pradesh':  { lat: 26.8467, lng: 80.9462 },
  'Gujarat':        { lat: 22.2587, lng: 71.1924 },
  'Andhra Pradesh': { lat: 15.9129, lng: 79.7400 },
  'Bihar':          { lat: 25.0961, lng: 85.3131 },
  'Punjab':         { lat: 31.1471, lng: 75.3412 },
  'Haryana':        { lat: 29.0588, lng: 76.0856 },
  'Kolhapur':  { lat: 16.7050, lng: 74.2433 },
  'Mandya':    { lat: 12.5220, lng: 76.8950 },
  'Belgaum':   { lat: 15.8497, lng: 74.4977 },
  'Nashik':    { lat: 19.9975, lng: 73.7898 },
  'Solapur':   { lat: 17.6599, lng: 75.9064 },
  'Lucknow':   { lat: 26.8467, lng: 80.9462 },
};

function getCoords(farm) {
  if (farm.latitude && farm.longitude) return { lat: Number(farm.latitude), lng: Number(farm.longitude) };
  // Try matching location/district/state to known coords
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if ((farm.location || '').toLowerCase().includes(key.toLowerCase()) ||
        (farm.district || '').toLowerCase().includes(key.toLowerCase()) ||
        (farm.state    || '').toLowerCase().includes(key.toLowerCase())) {
      return { lat: coords.lat + (Math.random() - 0.5) * 0.5, lng: coords.lng + (Math.random() - 0.5) * 0.5 };
    }
  }
  // Default to central India
  return { lat: 20.5937 + (Math.random() - 0.5) * 3, lng: 78.9629 + (Math.random() - 0.5) * 3 };
}

export default function FarmMapPage() {
  const navigate    = useNavigate();
  const [farms, setFarms] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    farmApi.list().then(r => {
      const list = (r.data?.farms || []).map(f => ({ ...f, _coords: getCoords(f) }));
      setFarms(list);
      if (list.length) setActive(list[0]);
    }).catch(e => console.error(e)).finally(() => setLoading(false));
  }, []);

  const center = farms.length ? [farms[0]._coords.lat, farms[0]._coords.lng] : [18.5204, 73.8567];

  if (loading) return <AppLayout><div className="page-loading-center"><div className="loading-spinner" /><p>Loading map…</p></div></AppLayout>;

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Farm Intelligence</p>
            <h1 className="page-title">Interactive Farm Map</h1>
            <p className="page-subtitle">View all your farms on an interactive map. Click a marker to see farm details.</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/farms')}>+ Add Farm</button>
        </div>

        {farms.length === 0 ? (
          <div className="empty-page-state">
            <div className="eps-icon">🗺️</div>
            <h2>No Farms to Show</h2>
            <p>Add farms with location data to see them on the map.</p>
            <button className="btn-primary" onClick={() => navigate('/farms')}>Add Farm →</button>
          </div>
        ) : (
          <div className="map-layout">
            {/* Sidebar farm list */}
            <div className="map-sidebar">
              <h3>Your Farms ({farms.length})</h3>
              {farms.map(f => (
                <div key={f.id} className={`map-farm-row ${active?.id===f.id?'map-farm-active':''}`} onClick={() => setActive(f)}>
                  <div className="mfr-icon">🏡</div>
                  <div className="mfr-body">
                    <span className="mfr-name">{f.name}</span>
                    <span className="mfr-loc">📍 {f.location}, {f.state}</span>
                    <div className="mfr-stats">
                      <span>{Number(f.total_area).toFixed(1)} ha</span>
                      <span>{f.fields?.length || 0} fields</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="map-main">
              <MapContainer center={center} zoom={7} style={{ height: 520, width: '100%', borderRadius: 12 }} zoomControl={true}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {farms.map(f => (
                  <Marker key={f.id} position={[f._coords.lat, f._coords.lng]} icon={greenIcon()} eventHandlers={{ click: () => setActive(f) }}>
                    <Popup>
                      <div className="map-popup">
                        <strong>{f.name}</strong><br />
                        📍 {f.location}, {f.district}, {f.state}<br />
                        📐 {Number(f.total_area).toFixed(1)} ha<br />
                        🌾 {f.fields?.length || 0} fields<br />
                        <button className="popup-btn" onClick={() => navigate('/farms')}>View Details →</button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Active farm info panel */}
              {active && (
                <div className="map-info-card">
                  <div className="mic-header">
                    <span className="mic-icon">🏡</span>
                    <div>
                      <span className="mic-name">{active.name}</span>
                      <span className="mic-loc">📍 {active.location}, {active.district}, {active.state}</span>
                    </div>
                  </div>
                  <div className="mic-stats">
                    <div className="mic-stat"><span>{Number(active.total_area).toFixed(1)} ha</span><span>Total Area</span></div>
                    <div className="mic-stat"><span>{active.fields?.length || 0}</span><span>Fields</span></div>
                    <div className="mic-stat"><span>{active._coords.lat.toFixed(4)}°N</span><span>Latitude</span></div>
                    <div className="mic-stat"><span>{active._coords.lng.toFixed(4)}°E</span><span>Longitude</span></div>
                  </div>
                  {active.fields?.length > 0 && (
                    <div className="mic-fields">
                      {active.fields.slice(0,3).map(f => (
                        <span key={f.id} className="mic-field-tag">{f.name} ({Number(f.area).toFixed(1)} ha)</span>
                      ))}
                    </div>
                  )}
                  <div className="mic-actions">
                    <button className="btn-primary" onClick={() => navigate('/farms')}>Manage Farm →</button>
                    <button className="btn-outline"  onClick={() => navigate('/prediction')}>Predict Yield →</button>
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
