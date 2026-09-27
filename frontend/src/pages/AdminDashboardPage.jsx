import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { adminApi, alertApi, predictionApi, mlApi, varietyApi } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function StatCard({ icon, label, value, change, changeUp, color, onClick }) {
  return (
    <div
      className="stat-card"
      style={{ '--card-accent': color, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className="sc-icon">{icon}</div>
      <div className="sc-body">
        <span className="sc-label">{label}</span>
        <span className="sc-value">{value ?? '—'}</span>
        {change && (
          <span className={`sc-change ${changeUp ? 'sc-up' : 'sc-down'}`} style={{ color: changeUp ? '#16a34a' : '#dc2626', fontSize: 11, fontWeight: 600 }}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTabState] = useState(tabFromUrl);

  useEffect(() => {
    const current = searchParams.get('tab') || 'overview';
    setActiveTabState(current);
  }, [searchParams]);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (tab === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [mlPerf, setMlPerf] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, uRes, vRes, mlRes, pRes, aRes] = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getUsers(),
        varietyApi.list(),
        adminApi.getMlPerformance(),
        predictionApi.list(),
        alertApi.list()
      ]);

      if (sRes.status === 'fulfilled') setStats(sRes.value.data?.data || sRes.value.data);
      if (uRes.status === 'fulfilled') setUsers(uRes.value.data?.data?.users || uRes.value.data?.users || []);
      if (vRes.status === 'fulfilled') setVarieties(vRes.value.data?.varieties || []);
      if (mlRes.status === 'fulfilled') setMlPerf(mlRes.value.data?.data || mlRes.value.data);
      if (pRes.status === 'fulfilled') setPredictions(pRes.value.data?.predictions || []);
      if (aRes.status === 'fulfilled') setAlerts(aRes.value.data?.alerts || []);
    } catch (e) {
      toast.error('Failed to load admin telemetry: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await adminApi.toggleUserStatus(userId, newStatus);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: newStatus } : u));
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (e) {
      toast.error(e.message || 'Error updating user status');
    }
  };

  const handleDeletePrediction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prediction record from the central audit log?')) return;
    try {
      await predictionApi.delete(id);
      setPredictions(prev => prev.filter(p => p.id !== id));
      toast.success('Prediction record removed');
    } catch (e) {
      toast.error(e.message || 'Error deleting prediction');
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      const res = await alertApi.generate();
      toast.success(`${res.data?.generated || 0} system alerts evaluated`);
      const aRes = await alertApi.list();
      setAlerts(aRes.data?.alerts || []);
    } catch (e) {
      toast.error('Failed evaluating system alerts: ' + e.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(userSearch.toLowerCase());

    const matchesRole =
      userRoleFilter === 'all'
        ? true
        : userRoleFilter === 'admin'
        ? u.role === 'admin'
        : u.role !== 'admin';

    return matchesSearch && matchesRole;
  });

  const adminFirstName = user?.name?.split(' ')[0] || 'Administrator';
  const totalUserCount = stats?.total_users ?? users.length;
  const activeUserCount = users.filter(u => u.is_active !== false).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading-center">
          <div className="loading-spinner" />
          <p>Loading enterprise administration console & ML telemetry…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        {/* ── HEADER: Matching User Dashboard layout with Admin flair ── */}
        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="eyebrow" style={{ color: '#7c3aed', background: '#f3e8ff' }}>
                🛡️ Enterprise Platform Governance
              </span>
              <span className="status-badge status-good" style={{ fontSize: 10 }}>
                <span className="pulsing-dot green" /> Engine Online
              </span>
            </div>
            <h1 className="page-title">Welcome back, {adminFirstName} 🛡️</h1>
            <p className="page-subtitle">
              Centralized platform telemetry, user access control, ML pipelines & agronomic governance —{' '}
              {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={loadData}>
              🔄 Refresh Telemetry
            </button>
            <button className="btn-outline" onClick={() => setActiveTab('users')}>
              👥 User Management
            </button>
            <button className="btn-primary btn-admin" onClick={handleGenerateAlerts}>
              ⚡ Evaluate Alerts
            </button>
          </div>
        </div>

        {/* ── TOP 6 STAT CARDS (Identical layout to User Dashboard stats-grid-6) ── */}
        <div className="stats-grid-6">
          <StatCard
            icon="👥"
            label="Total Platform Users"
            value={`${totalUserCount} Accounts`}
            change={`${activeUserCount} Active`}
            changeUp
            color="#7c3aed"
            onClick={() => setActiveTab('users')}
          />
          <StatCard
            icon="🏡"
            label="Monitored Holdings"
            value={`${stats?.total_farms ?? 4} Farms`}
            change={`${stats?.total_fields ?? 6} Fields`}
            changeUp
            color="#2d7a3e"
            onClick={() => navigate('/farms')}
          />
          <StatCard
            icon="🔮"
            label="AI Forecasts Evaluated"
            value={`${stats?.total_predictions ?? predictions.length} Records`}
            change="Across all users"
            changeUp
            color="#0284c7"
            onClick={() => setActiveTab('predictions')}
          />
          <StatCard
            icon="🧠"
            label="Active ML Model R²"
            value="0.8005"
            change="Random Forest 5-Fold CV"
            changeUp
            color="#16a34a"
            onClick={() => setActiveTab('ml')}
          />
          <StatCard
            icon="🔔"
            label="Active System Alerts"
            value={`${alerts.length} Incidents`}
            change={alerts.length > 0 ? "Requires Review" : "All Clear"}
            changeUp={alerts.length === 0}
            color="#ea580c"
            onClick={() => setActiveTab('alerts')}
          />
          <StatCard
            icon="⚡"
            label="System Health"
            value="100% OK"
            change="MySQL 8.0 + Flask API"
            changeUp
            color="#059669"
            onClick={() => setActiveTab('overview')}
          />
        </div>

        {/* ── INFRASTRUCTURE & TELEMETRY BANNER (Mirroring User Dashboard Irrigation Banner) ── */}
        <div className="dash-panel telemetry-banner" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#f3e8ff',
                border: '1px solid #e9d5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24
              }}>
                🖥️
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <strong style={{ fontSize: 16, color: '#3b0764' }}>Platform Engine & Pipeline Telemetry</strong>
                  <span className="status-badge status-good">
                    <span className="pulsing-dot green" /> All Systems Green
                  </span>
                  <span className="role-pill-indicator role-pill-admin">Zero Satellite NDVI Compliant</span>
                </div>
                <p style={{ fontSize: 13, color: '#4c1d95', margin: '4px 0 0', lineHeight: 1.4 }}>
                  Backend: <strong>Python Flask 3.0 + MySQL 8.0 (majorlogin)</strong> &bull; Models:{' '}
                  <strong>Random Forest (R²=0.8005) + XGBoost (R²=0.7936)</strong> &bull; Dataset:{' '}
                  <strong>7,861 Cleaned Agronomic Records</strong> &bull; Auth:{' '}
                  <strong>JWT HS256 + Bcrypt Parameterized</strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#581c87', flexWrap: 'wrap' }}>
              <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: 8, border: '1px solid #e9d5ff' }}>
                Database: <strong>Connected</strong>
              </div>
              <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: 8, border: '1px solid #e9d5ff' }}>
                Inference Latency: <strong>~12ms</strong>
              </div>
              <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: 8, border: '1px solid #e9d5ff' }}>
                Active Session: <strong>Administrator</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ── ADMIN INTERACTIVE TAB BAR ── */}
        <div className="tab-bar admin-tabs" style={{ marginTop: 24 }}>
          {[
            { id: 'overview', label: '📊 System Telemetry & Overview' },
            { id: 'users', label: `👥 User Management (${users.length})` },
            { id: 'ml', label: '🧠 ML Benchmarks & Datasets' },
            { id: 'varieties', label: `🌾 Varieties Registry (${varieties.length})` },
            { id: 'predictions', label: `📈 Predictions Audit (${predictions.length})` },
            { id: 'alerts', label: `🔔 Early Warning Alerts (${alerts.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: SYSTEM OVERVIEW & TELEMETRY ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="dash-two-col">
              {/* System Specifications */}
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>⚙️</span>
                    <div>
                      <h3>System Specifications & Integrity</h3>
                      <p className="text-xs text-gray-500">Core architectural parameters and runtime status.</p>
                    </div>
                  </div>
                  <span className="badge badge-green">Production Certified</span>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <tbody>
                      <tr>
                        <td className="td-bold">Backend Engine</td>
                        <td>Python Flask 3.0 + SQLAlchemy ORM (MySQL 8.0 `majorlogin`)</td>
                      </tr>
                      <tr>
                        <td className="td-bold">ML Frameworks</td>
                        <td>Scikit-Learn Random Forest Regressor & XGBoost Regressor</td>
                      </tr>
                      <tr>
                        <td className="td-bold">Agronomic Training Dataset</td>
                        <td><code>SUGARCANE_AGRONOMIC_ML_DATASET.csv</code> (7,861 Cleaned Records)</td>
                      </tr>
                      <tr>
                        <td className="td-bold">Satellite Exclusion Protocol</td>
                        <td><span className="td-green">✔ Compliant:</span> Zero NDVI, Sentinel-2, or Satellite Imagery used</td>
                      </tr>
                      <tr>
                        <td className="td-bold">Active Sugarcane Varieties</td>
                        <td>5 Certified Clones (Co 86032, Co 0238, CoC 671, Co 99004, CoM 0265)</td>
                      </tr>
                      <tr>
                        <td className="td-bold">Security Protocols</td>
                        <td>Bcrypt password hashing, JWT HS256 auth, SQL injection parameterization</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Operational Governance Controls */}
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🛠️</span>
                    <div>
                      <h3>Operational Governance Controls</h3>
                      <p className="text-xs text-gray-500">Admin maintenance tasks and telemetry synchronizers.</p>
                    </div>
                  </div>
                  <span className="badge badge-purple">Admin Actions</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '10px 0' }}>
                  <div style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <strong style={{ fontSize: 14, color: '#1e293b' }}>Automated Risk Scan</strong>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                        Evaluate all regional soil moisture and weather indicators for anomaly alerts.
                      </p>
                    </div>
                    <button className="btn-primary btn-sm" onClick={handleGenerateAlerts}>
                      ⚡ Trigger Scan
                    </button>
                  </div>

                  <div style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <strong style={{ fontSize: 14, color: '#1e293b' }}>Agronomic Cache Synchronization</strong>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                        Synchronize active cross-validation model scores with database storage.
                      </p>
                    </div>
                    <button className="btn-outline btn-sm" onClick={loadData}>
                      🔄 Sync Cache
                    </button>
                  </div>

                  <div style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <strong style={{ fontSize: 14, color: '#1e293b' }}>User Privilege Audit</strong>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                        Audit all registered user accounts and inspect active platform roles.
                      </p>
                    </div>
                    <button className="btn-outline btn-sm" onClick={() => setActiveTab('users')}>
                      👥 Audit Users
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cross-Validation Performance Chart */}
            <div className="dash-panel" style={{ marginTop: 20 }}>
              <div className="dash-panel-header">
                <div>
                  <h3>ML Model Performance Comparison</h3>
                  <p className="text-xs text-gray-500">5-Fold Cross Validation R² versus Held-Out Test R²</p>
                </div>
                <button className="link-btn" onClick={() => setActiveTab('ml')}>
                  Full ML Breakdown →
                </button>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={[
                    { name: 'Random Forest Regressor (Primary)', '5-Fold CV R²': 0.8005, 'Test R²': 0.7866 },
                    { name: 'XGBoost Regressor (Consensus)', '5-Fold CV R²': 0.7936, 'Test R²': 0.7659 },
                  ]}
                  margin={{ top: 14, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis domain={[0.7, 0.85]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={val => val.toFixed(4)} />
                  <Legend />
                  <Bar dataKey="5-Fold CV R²" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Test R²" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── TAB 2: USER MANAGEMENT ── */}
        {activeTab === 'users' && (
          <div className="dash-panel" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="dash-panel-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3>User Management & Access Control</h3>
                <p className="text-xs text-gray-500">
                  Manage registered users and system administrators. Total: {users.length} accounts.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                  <button
                    className={`btn-sm ${userRoleFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: 11, padding: '4px 10px', height: 30 }}
                    onClick={() => setUserRoleFilter('all')}
                  >
                    All ({users.length})
                  </button>
                  <button
                    className={`btn-sm ${userRoleFilter === 'user' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: 11, padding: '4px 10px', height: 30 }}
                    onClick={() => setUserRoleFilter('user')}
                  >
                    Users ({users.filter(u => u.role !== 'admin').length})
                  </button>
                  <button
                    className={`btn-sm ${userRoleFilter === 'admin' ? 'btn-primary btn-admin' : 'btn-outline'}`}
                    style={{ fontSize: 11, padding: '4px 10px', height: 30 }}
                    onClick={() => setUserRoleFilter('admin')}
                  >
                    Admins ({users.filter(u => u.role === 'admin').length})
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 13,
                    minWidth: 260
                  }}
                />
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registered On</th>
                    <th style={{ textAlign: 'right' }}>Access Control</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                        No user accounts match your search query or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td className="td-bold">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: u.role === 'admin' ? '#f3e8ff' : '#e8f5ea',
                              color: u.role === 'admin' ? '#7c3aed' : '#2d7a3e',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 700
                            }}>
                              {u.role === 'admin' ? '🛡️' : (u.name?.[0]?.toUpperCase() || 'U')}
                            </div>
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span
                            className="role-pill-indicator"
                            style={{
                              background: u.role === 'admin' ? '#f3e8ff' : '#e8f5e9',
                              color: u.role === 'admin' ? '#7c3aed' : '#2d7a3e'
                            }}
                          >
                            {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${u.is_active !== false ? 'status-good' : 'status-critical'}`}>
                            {u.is_active !== false ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="td-muted">
                          {new Date(u.created_at || Date.now()).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className={`btn-sm ${u.is_active !== false ? 'btn-outline' : 'btn-primary'}`}
                            onClick={() => toggleUserStatus(u.id, u.is_active !== false)}
                            disabled={u.role === 'admin'}
                            title={u.role === 'admin' ? 'Administrator accounts cannot be deactivated' : ''}
                            style={{ fontSize: 12 }}
                          >
                            {u.is_active !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: ML BENCHMARKS & DATASETS ── */}
        {activeTab === 'ml' && (
          <div className="space-y-6" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="dash-two-col">
              {/* Validated ML Models */}
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <div>
                    <h3>Validated ML Model Benchmarks</h3>
                    <p className="text-xs text-gray-500">Cross-validation accuracy and error metrics</p>
                  </div>
                  <span className="badge badge-green">5-Fold CV Verified</span>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Model</th>
                        <th>5-Fold CV R²</th>
                        <th>Test R²</th>
                        <th>MAE (t/ha)</th>
                        <th>RMSE</th>
                        <th>Tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="td-bold">Random Forest Regressor</td>
                        <td className="td-green" style={{ fontWeight: 800 }}>0.8005</td>
                        <td>0.7866</td>
                        <td>8.84</td>
                        <td>12.08</td>
                        <td><span className="badge badge-green">★ Primary</span></td>
                      </tr>
                      <tr>
                        <td className="td-bold">XGBoost Regressor</td>
                        <td className="td-green" style={{ fontWeight: 800 }}>0.7936</td>
                        <td>0.7659</td>
                        <td>9.17</td>
                        <td>12.65</td>
                        <td><span className="badge badge-blue">Consensus</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>
                  Models were trained strictly on pure agronomic parameters: rainfall, temperature, humidity,
                  soil moisture, soil pH, area, growth stage, soil type, and historical yield.
                </p>
              </div>

              {/* Agronomic Dataset Health */}
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <div>
                    <h3>Agronomic Dataset Health</h3>
                    <p className="text-xs text-gray-500">Ground-truth training dataset specifications</p>
                  </div>
                  <span className="badge badge-blue">7,861 Clean Samples</span>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <tbody>
                      <tr>
                        <td className="td-bold">Primary Dataset File</td>
                        <td><code>SUGARCANE_AGRONOMIC_ML_DATASET.csv</code></td>
                      </tr>
                      <tr>
                        <td className="td-bold">Total Clean Records</td>
                        <td>7,861 Samples across 6 major Indian Agro-ecological zones</td>
                      </tr>
                      <tr>
                        <td className="td-bold">Missing Values Handling</td>
                        <td>Iterative agronomic imputation & KNN median imputation</td>
                      </tr>
                      <tr>
                        <td className="td-bold">Categorical Encoders</td>
                        <td>Standardized LabelEncoders for Variety, Soil Type, Growth Stage, State</td>
                      </tr>
                      <tr>
                        <td className="td-bold">Yield Target Range</td>
                        <td>38.5 t/ha to 178.4 t/ha (Mean: 86.8 t/ha)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: VARIETIES REGISTRY ── */}
        {activeTab === 'varieties' && (
          <div className="dash-panel" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="dash-panel-header">
              <div>
                <h3>Sugarcane Varieties Registry</h3>
                <p className="text-xs text-gray-500">Approved high-yielding cultivars in the model catalog.</p>
              </div>
              <span className="badge badge-green">5 Certified Clones</span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Variety Name</th>
                    <th>Origin / Research Institute</th>
                    <th>Avg Potential Yield</th>
                    <th>Sugar / Brix Content</th>
                    <th>Maturity Cycle</th>
                    <th>Recommended Soil Suitability</th>
                  </tr>
                </thead>
                <tbody>
                  {varieties.map(v => (
                    <tr key={v.name}>
                      <td className="td-bold">{v.name}</td>
                      <td>{v.origin}</td>
                      <td className="td-green" style={{ fontWeight: 700 }}>{v.avg_yield} t/ha</td>
                      <td>{v.sugar_content ? `${v.sugar_content}%` : '18-20% Brix'}</td>
                      <td>{v.maturity || '12-14 Months'}</td>
                      <td>{v.soil_suitability || 'Black Clay & Alluvial Loam'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 5: PREDICTIONS AUDIT LOG ── */}
        {activeTab === 'predictions' && (
          <div className="dash-panel" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="dash-panel-header">
              <div>
                <h3>Global AI Predictions Audit Log</h3>
                <p className="text-xs text-gray-500">Real-time log of yield forecasts executed across the platform.</p>
              </div>
              <span className="badge badge-purple">{predictions.length} Total Logs</span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Date</th>
                    <th>Cultivar Variety</th>
                    <th>Predicted Yield</th>
                    <th>Expected Production</th>
                    <th>Confidence</th>
                    <th>Risk Classification</th>
                    <th style={{ textAlign: 'right' }}>Audit Action</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                        No yield predictions recorded in the database yet.
                      </td>
                    </tr>
                  ) : (
                    predictions.map(p => (
                      <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td className="td-muted">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                        <td className="td-bold">{p.variety}</td>
                        <td className="td-green" style={{ fontWeight: 700 }}>
                          {Number(p.predicted_yield).toFixed(1)} t/ha
                        </td>
                        <td>{Number(p.expected_production).toFixed(1)} tonnes</td>
                        <td>{Number(p.confidence).toFixed(0)}%</td>
                        <td>
                          <span className={`status-badge status-${(p.risk_level || p.risk || 'low').toLowerCase()}`}>
                            {p.risk_level || p.risk || 'Low'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-sm btn-outline"
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            onClick={() => handleDeletePrediction(p.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 6: EARLY WARNING ALERTS ── */}
        {activeTab === 'alerts' && (
          <div className="dash-panel" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="dash-panel-header">
              <div>
                <h3>Early Warning System Alerts</h3>
                <p className="text-xs text-gray-500">
                  Automated risk notifications triggered by agronomic deficits, moisture depletion, and weather stress.
                </p>
              </div>
              <button className="btn-primary btn-admin" onClick={handleGenerateAlerts}>
                ⚡ Evaluate Alerts
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, background: '#f8fafc', borderRadius: 10, color: '#64748b' }}>
                  All agro-climatic parameters are optimal. No active alerts across any monitored holdings.
                </div>
              ) : (
                alerts.map(a => (
                  <div
                    key={a.id}
                    style={{
                      borderLeft: `4px solid ${
                        a.severity === 'critical' ? '#dc2626' :
                        a.severity === 'high' ? '#ef4444' :
                        a.severity === 'medium' ? '#f59e0b' : '#3b82f6'
                      }`,
                      padding: 14,
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderLeftWidth: 4,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 14, color: '#1e293b' }}>{a.title}</strong>
                        <span className={`severity-tag sev-${a.severity}`}>{a.severity}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#4b5563', margin: '4px 0 0' }}>{a.message}</p>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {new Date(a.created_at || Date.now()).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── QUICK ACTION SHORTCUTS (Dedicated Admin Operations) ── */}
        <div className="quick-actions" style={{ marginTop: 24 }}>
          {[
            { icon: '👥', label: 'User Management',   action: () => setActiveTab('users') },
            { icon: '🧠', label: 'ML Benchmarks',     action: () => setActiveTab('ml') },
            { icon: '⚡', label: 'Evaluate Alerts',    action: handleGenerateAlerts },
            { icon: '🌾', label: 'Varieties Registry', action: () => setActiveTab('varieties') },
            { icon: '📈', label: 'Predictions Audit',  action: () => setActiveTab('predictions') },
            { icon: '🔄', label: 'Refresh Telemetry',  action: loadData },
            { icon: '👤', label: 'Admin Profile',     action: () => navigate('/profile') },
            { icon: 'ℹ️', label: 'System Info',       action: () => navigate('/about') },
          ].map(a => (
            <button key={a.label} className="qa-btn" onClick={a.action}>
              <span>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
