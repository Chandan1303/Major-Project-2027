import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const buildApiUrl = (path) => {
  const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
  return `${base}${path}`;
};

// States and districts - ALL NOW HAVE NDVI DATA ✅
const INDIA_GEOGRAPHY = [
  {
    state: "Karnataka",
    districts: ["Belagavi", "Mandya", "Mysuru", "Bagalkot", "Shivamogga", "Vijayapura", "Chikkamagaluru", "Davangere", "Raichur", "Bellary", "Chitradurga", "Uttara Kannada"]
  },
  {
    state: "Punjab",
    districts: ["Jalandhar", "Gurdaspur", "Amritsar"]
  },
  {
    state: "Tamil Nadu",
    districts: ["Coimbatore", "Erode", "Salem", "Thanjavur", "Tiruchirappalli", "Cuddalore", "Tirunelveli", "Thoothukudi", "Villupuram", "Namakkal", "Karur", "Perambalur"]
  },
  {
    state: "Uttar Pradesh",
    districts: ["Muzaffarnagar", "Meerut", "Bijnor", "Saharanpur", "Bareilly", "Lakhimpur Kheri", "Deoria", "Basti", "Gonda", "Gorakhpur", "Pilibhit", "Shahjahanpur", "Bulandshahr"]
  },
  {
    state: "Maharashtra",
    districts: ["Kolhapur", "Sangli", "Satara", "Ahmednagar", "Pune", "Solapur", "Nashik", "Jalgaon", "Dhule", "Nandurbar", "Beed", "Osmanabad"]
  },
  {
    state: "Andhra Pradesh",
    districts: ["East Godavari", "West Godavari", "Krishna", "Visakhapatnam", "Guntur", "Prakasam", "Chittoor", "Nellore"]
  },
  {
    state: "Gujarat",
    districts: ["Surat", "Navsari", "Bharuch", "Valsad", "Tapi", "Narmada", "Ahmedabad", "Kheda"]
  },
  {
    state: "Haryana",
    districts: ["Yamuna Nagar", "Karnal", "Kurukshetra"]
  },
  {
    state: "Bihar",
    districts: ["Champaran", "Siwan", "Gopalganj", "Muzaffarpur", "Saran", "Darbhanga", "Vaishali"]
  },
  {
    state: "Telangana",
    districts: ["Nizamabad", "Medak", "Karimnagar", "Khammam", "Warangal", "Nalgonda", "Sangareddy"]
  },
  {
    state: "Uttarakhand",
    districts: ["Haridwar", "Dehradun"]
  }
];

function healthColor(h) {
  if (h === 'Healthy' || h === 'Excellent') return '#16a34a';
  if (h === 'Good')    return '#65a30d';
  if (h === 'Moderate' || h === 'Fair') return '#ca8a04';
  if (h === 'Poor') return '#f97316';
  return '#dc2626';
}

export default function CropHealthPage() {
  const [ndviData, setNdviData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedState, setSelectedState] = useState('Karnataka');
  const [selectedDistrict, setSelectedDistrict] = useState('Belagavi');
  const [healthThresholds, setHealthThresholds] = useState([]);
  
  
  // Get districts for selected state
  const availableDistricts = INDIA_GEOGRAPHY.find(s => s.state === selectedState)?.districts || [];
  
  // Update district when state changes
  useEffect(() => {
    if (availableDistricts.length > 0 && !availableDistricts.includes(selectedDistrict)) {
      setSelectedDistrict(availableDistricts[0]);
    }
  }, [selectedState]);

  // Fetch health thresholds on mount
  useEffect(() => {
    fetchHealthThresholds();
  }, []);

  // Fetch NDVI data when state/district changes
  useEffect(() => {
    if (selectedState && selectedDistrict) {
      // Add small delay to prevent multiple rapid calls
      const timer = setTimeout(() => {
        fetchNDVIData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedState, selectedDistrict]);

  const fetchHealthThresholds = async () => {
    try {
      const response = await axios.get(buildApiUrl('/ndvi/health-thresholds'));
      if (response.data.success) {
        setHealthThresholds(response.data.data.thresholds || []);
      } else {
        setHealthThresholds([]);
      }
    } catch (err) {
      console.error('Failed to fetch health thresholds:', err);
    }
  };

  const fetchNDVIData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(buildApiUrl('/ndvi/current'), {
        params: {
          state: selectedState,
          district: selectedDistrict,
          days_back: 30
        }
      });

      if (response.data.success) {
        setNdviData(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch NDVI data');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch NDVI data');
      console.error('NDVI fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Convert NDVI (0-1) to Vigor percentage (0-100)
  const ndviToVigor = (ndvi) => Math.round(ndvi * 100);

  // Get current NDVI health if available
  const currentNDVIHealth = ndviData?.ndvi_data?.average_health || null;
  const currentNDVIValue = currentNDVIHealth?.ndvi_value ?? null;
  const currentVigor = currentNDVIValue == null ? null : ndviToVigor(Number(currentNDVIValue));
  const currentHealthStatus = currentNDVIHealth?.category || 'Unavailable';
  const currentHealthColor = currentNDVIHealth?.color || '#64748b';

  return (
    <AppLayout>
      <div className="page-container crop-health-page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Regional NDVI Monitoring</p>
            <h1 className="page-title">Crop Health & Vegetation Analysis</h1>
            <p className="page-subtitle">
              District-level historical vegetation averages. Live Sentinel-2 readings are unavailable because Google Earth Engine is not configured.
            </p>
          </div>
          <span className="badge badge-green">{ndviData?.data_source === 'realtime' ? '🛰️ Live Sentinel-2' : '📊 Historical regional data'}</span>
        </div>

        {/* Location Selector */}
        <div className="dash-panel" style={{ marginBottom: 24 }}>
          <div className="dash-panel-header">
            <h3>📍 Select Location for NDVI Monitoring</h3>
          </div>
          <div style={{ display: 'flex', gap: 16, padding: '16px 24px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>State</label>
              <select 
                value={selectedState} 
                onChange={(e) => setSelectedState(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ddd' }}
              >
                {INDIA_GEOGRAPHY.map(item => (
                  <option key={item.state} value={item.state}>{item.state}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>District</label>
              <select 
                value={selectedDistrict} 
                onChange={(e) => setSelectedDistrict(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ddd' }}
              >
                {availableDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={fetchNDVIData}
              disabled={loading}
              style={{ 
                padding: '10px 24px', 
                background: '#16a34a', 
                color: 'white', 
                border: 'none', 
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 22
              }}
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh NDVI'}
            </button>
          </div>
          
          {error && (
            <div className="ndvi-error-callout" style={{ 
              margin: '0 24px 16px', 
              padding: 12, 
              background: '#fef2f2', 
              border: '1px solid #fca5a5', 
              borderRadius: 8,
              color: '#dc2626'
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* NDVI Overview - Enhanced with Real Data */}
        <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))' }}>
          <div className="summary-card" style={{ '--card-accent': currentHealthColor }}>
            <div className="sc-icon">🛰️</div>
            <div className="sc-body">
              <span className="sc-label">NDVI Value</span>
              <span className="sc-value">{currentNDVIValue ? currentNDVIValue.toFixed(3) : '—'}</span>
              {ndviData?.data_source && (
                <span style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                  {ndviData.data_source === 'realtime' ? '📡 Real-time' : '📊 Historical'}
                </span>
              )}
            </div>
          </div>

          <div className="summary-card" style={{ '--card-accent': currentHealthColor }}>
            <div className="sc-icon">{currentNDVIHealth?.icon || '💚'}</div>
            <div className="sc-body">
              <span className="sc-label">Crop Health Status</span>
              <span className={`sc-value crop-health-status ndvi-status-${currentHealthStatus.toLowerCase().replace(/\s+/g, '-')}`} style={{ color: currentHealthColor }}>
                {currentHealthStatus}
              </span>
            </div>
          </div>

          <div className="summary-card" style={{ '--card-accent': currentHealthColor }}>
            <div className="sc-icon">🌿</div>
            <div className="sc-body">
              <span className="sc-label">Vegetation Vigor</span>
              <span className="sc-value">{currentVigor == null ? '—' : `${currentVigor}%`}</span>
            </div>
          </div>

          <div className="summary-card" style={{ '--card-accent': '#2d7a3e' }}>
            <div className="sc-icon">📈</div>
            <div className="sc-body">
              <span className="sc-label">Growth Stage</span>
              <span className="sc-value">Not provided</span>
            </div>
          </div>

          <div className="summary-card" style={{ '--card-accent': '#3b82f6' }}>
            <div className="sc-icon">📅</div>
            <div className="sc-body">
              <span className="sc-label">Last Observation</span>
              <span className="sc-value" style={{ fontSize: 14 }}>
                {ndviData?.ndvi_data?.observation_date || (ndviData ? 'Date not provided' : 'No reading loaded')}
              </span>
            </div>
          </div>
        </div>

        {/* NDVI Health Classification Guide */}
        {currentNDVIHealth && (
          <div className="dash-panel" style={{ marginBottom: 24 }}>
            <div className="dash-panel-header">
              <h3>🔍 Current Health Analysis</h3>
              <span className={`badge crop-health-status-badge ndvi-status-${currentHealthStatus.toLowerCase().replace(/\s+/g, '-')}`} style={{ background: currentHealthColor, color: 'white' }}>
                {currentHealthStatus}
              </span>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ flex: 2 }}>
                  <p style={{ fontSize: 16, marginBottom: 12, fontWeight: 500 }}>
                    {currentNDVIHealth.description}
                  </p>
                  <div style={{ marginBottom: 16 }}>
                    <strong>NDVI Range:</strong>{' '}
                    {currentNDVIHealth.ndvi_range?.[0]?.toFixed(2)} - {currentNDVIHealth.ndvi_range?.[1]?.toFixed(2)}
                  </div>
                  
                  {currentNDVIHealth.action_required && (
                    <div className="ndvi-action-callout" style={{ 
                      padding: 12, 
                      background: '#fef3c7', 
                      border: '1px solid #fbbf24',
                      borderRadius: 8,
                      marginBottom: 12
                    }}>
                      <strong>⚠️ Action Required ({currentNDVIHealth.priority} Priority)</strong>
                    </div>
                  )}

                  <div>
                    <strong style={{ display: 'block', marginBottom: 8 }}>📋 Recommendations:</strong>
                    <ul style={{ marginLeft: 20, lineHeight: 1.8 }}>
                      {currentNDVIHealth.recommendations?.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Visual NDVI Gauge */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div className="ndvi-gauge-track" style={{ 
                    width: 150, 
                    height: 150, 
                    borderRadius: '50%',
                    background: `conic-gradient(${currentHealthColor} ${currentVigor}%, var(--ndvi-gauge-track, #e5e7eb) ${currentVigor}%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <div className="ndvi-gauge-center" style={{ 
                      width: 120, 
                      height: 120, 
                      borderRadius: '50%', 
                      background: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div className="ndvi-gauge-value" style={{ fontSize: 32, fontWeight: 'bold', color: currentHealthColor }}>
                        {currentVigor}%
                      </div>
                    <div className="ndvi-gauge-caption" style={{ fontSize: 12, color: '#666' }}>Vigor</div>
                    </div>
                  </div>
                  <div className="ndvi-gauge-caption" style={{ fontSize: 13, color: '#666' }}>
                    NDVI: {currentNDVIValue?.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="dash-two-col">
          {/* The API provides regional averages only, not parcel or sensor readings. */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Field-level NDVI</h3>
            </div>
            <div style={{ padding: '18px 24px', color: '#64748b', lineHeight: 1.6 }}>
              {selectedDistrict}, {selectedState}: {currentNDVIValue == null ? 'no reading loaded' : `regional mean NDVI ${Number(currentNDVIValue).toFixed(3)}`}.
              {' '}The current data source does not include per-field zones or ground-sensor readings. Changing the district updates this regional average; it does not provide live satellite refreshes.
            </div>
          </div>

          {/* NDVI Health Thresholds */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>📊 NDVI Health Classification Standards</h3>
            </div>
            <div style={{ padding: '16px 24px' }}>
              {healthThresholds.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {healthThresholds.map(threshold => (
                    <div className={`ndvi-threshold-row${threshold.category === currentHealthStatus ? ' active' : ''}`}
                      key={threshold.category}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12,
                        padding: 12,
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        background: threshold.category === currentHealthStatus ? `${threshold.color}11` : 'transparent'
                      }}
                    >
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: threshold.color,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20
                      }}>
                        {threshold.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          {threshold.category}
                        </div>
                        <div className="ndvi-threshold-range" style={{ fontSize: 13, color: '#666' }}>
                          NDVI: {threshold.ndvi_range.min.toFixed(2)} - {threshold.ndvi_range.max.toFixed(2)}
                        </div>
                      </div>
                      {threshold.action_required && (
                        <span className="badge badge-orange" style={{ fontSize: 11 }}>
                          Action Required
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#666', textAlign: 'center', padding: 24 }}>
                  Loading health thresholds...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Data Source Info */}
        {ndviData && (
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>ℹ️ Data Source Information</h3>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <div className="ndvi-meta-label" style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Source</div>
                  <div style={{ fontWeight: 500 }}>
                    {ndviData.data_source === 'realtime' ? '🛰️ Sentinel-2 Satellite' : '📊 Historical Database'}
                  </div>
                </div>
                <div>
                  <div className="ndvi-meta-label" style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Location</div>
                  <div style={{ fontWeight: 500 }}>
                    {ndviData.location.district}, {ndviData.location.state}
                  </div>
                </div>
                <div>
                  <div className="ndvi-meta-label" style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Resolution</div>
                  <div style={{ fontWeight: 500 }}>
                    {ndviData.ndvi_data?.resolution_meters ? `${ndviData.ndvi_data.resolution_meters}m` : 'Regional Average'}
                  </div>
                </div>
                <div>
                  <div className="ndvi-meta-label" style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Retrieved</div>
                  <div style={{ fontWeight: 500 }}>
                    {new Date(ndviData.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .ndvi-map-visual {
          padding: 24px;
        }
        .ndvi-map-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .map-zone {
          padding: 20px;
          border-radius: 12px;
          border: 2px solid;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .map-zone:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .map-zone-active {
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          transform: scale(1.02);
        }
        .map-zone-label {
          font-weight: 600;
          font-size: 16px;
        }
        .map-zone-ndvi {
          font-size: 20px;
          font-weight: 700;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          align-self: flex-start;
        }
        .status-healthy { background: #dcfce7; color: #166534; }
        .status-good { background: #ecfccb; color: #3f6212; }
        .status-moderate { background: #fef3c7; color: #92400e; }
        .status-poor { background: #fed7aa; color: #9a3412; }
        .status-critical { background: #fecaca; color: #991b1b; }
        .ndvi-map-legend {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: #666;
        }
      `}</style>
    </AppLayout>
  );
}
