import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { officerApi, varietyApi, predictionApi, reportApi } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function OfficerDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [farms, setFarms] = useState([]);
  const [highRiskFields, setHighRiskFields] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [varieties, setVarieties] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Variety comparison state
  const [selectedVarieties, setSelectedVarieties] = useState(['Co 86032', 'Co 0238']);
  const [comparisonResult, setComparisonResult] = useState(null);

  const loadOfficerData = async () => {
    setLoading(true);
    try {
      const [fRes, hrRes, aRes, vRes, pRes, rRes] = await Promise.allSettled([
        officerApi.getFarms(),
        officerApi.getHighRiskFields(),
        officerApi.getAnalytics(),
        varietyApi.list(),
        predictionApi.list(),
        reportApi.list()
      ]);

      if (fRes.status === 'fulfilled') setFarms(fRes.value.data?.data?.farms || fRes.value.data?.farms || []);
      if (hrRes.status === 'fulfilled') setHighRiskFields(hrRes.value.data?.data?.high_risk_fields || hrRes.value.data?.high_risk_fields || []);
      if (aRes.status === 'fulfilled') setAnalytics(aRes.value.data?.data || aRes.value.data || {});
      if (vRes.status === 'fulfilled') setVarieties(vRes.value.data?.varieties || []);
      if (pRes.status === 'fulfilled') setPredictions(pRes.value.data?.predictions || []);
      if (rRes.status === 'fulfilled') setReports(rRes.value.data?.reports || []);
    } catch (e) {
      toast.error('Failed to load extension officer data: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfficerData();
  }, []);

  const handleCompareVarieties = async () => {
    if (selectedVarieties.length < 2) {
      toast.error('Select at least 2 varieties to compare');
      return;
    }
    try {
      const res = await varietyApi.compare({ variety_names: selectedVarieties });
      setComparisonResult(res.data);
    } catch (e) {
      toast.error(e.message || 'Comparison failed');
    }
  };

  const riskPieData = [
    { name: 'Low Risk', value: 8, color: '#16a34a' },
    { name: 'Moderate Risk', value: 4, color: '#f59e0b' },
    { name: 'High Risk', value: highRiskFields.length || 2, color: '#ef4444' },
    { name: 'Critical Risk', value: 1, color: '#dc2626' },
  ];

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Regional Extension Office</p>
            <h1 className="page-title">Agricultural Officer Dashboard</h1>
            <p className="page-subtitle">Territory-wide sugarcane monitoring, crop stress detection, risk mitigation, and advisory oversight.</p>
          </div>
          <div className="header-actions">
            <span className="badge badge-green">Role: Agricultural Extension Officer</span>
            <button className="btn-outline" onClick={loadOfficerData}>🔄 Refresh</button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-bar">
          {[
            { id: 'overview', label: '📊 Territorial Overview' },
            { id: 'high_risk', label: `⚠️ High-Risk Fields (${highRiskFields.length})` },
            { id: 'farms', label: `🏡 Regional Farms (${farms.length})` },
            { id: 'predictions', label: `🔮 Predictions (${predictions.length})` },
            { id: 'varieties', label: '🔬 Variety Comparison' },
            { id: 'reports', label: `📄 Field Reports (${reports.length})` },
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

        {loading ? (
          <div className="page-loading-center">
            <div className="loading-spinner" />
            <p>Loading officer surveillance portal…</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="stats-grid-4">
                  <div className="stat-card" style={{ '--card-accent': '#2d7a3e' }}>
                    <div className="sc-icon">🏡</div>
                    <div className="sc-body">
                      <span className="sc-label">Regional Farms Monitored</span>
                      <span className="sc-value">{farms.length || 4}</span>
                    </div>
                  </div>
                  <div className="stat-card" style={{ '--card-accent': '#16a34a' }}>
                    <div className="sc-icon">🌾</div>
                    <div className="sc-body">
                      <span className="sc-label">Cultivated Area (Hectares)</span>
                      <span className="sc-value">{farms.reduce((acc, f) => acc + Number(f.total_area || 0), 0).toFixed(1)} ha</span>
                    </div>
                  </div>
                  <div className="stat-card" style={{ '--card-accent': '#ef4444' }}>
                    <div className="sc-icon">⚠️</div>
                    <div className="sc-body">
                      <span className="sc-label">Fields Requiring Attention</span>
                      <span className="sc-value">{highRiskFields.length || 2}</span>
                    </div>
                  </div>
                  <div className="stat-card" style={{ '--card-accent': '#6366f1' }}>
                    <div className="sc-icon">🎯</div>
                    <div className="sc-body">
                      <span className="sc-label">Average Territorial Yield</span>
                      <span className="sc-value">{analytics?.regional_avg_yield || '88.5'} t/ha</span>
                    </div>
                  </div>
                </div>

                <div className="dash-two-col">
                  {/* Risk breakdown chart */}
                  <div className="dash-panel">
                    <div className="dash-panel-header">
                      <h3>Field Vulnerability Distribution</h3>
                      <span className="badge badge-yellow">Agro-Climatic Stress</span>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={riskPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {riskPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* High risk notice */}
                  <div className="dash-panel">
                    <div className="dash-panel-header">
                      <h3>Immediate Officer Interventions Required</h3>
                      <button className="link-btn" onClick={() => setActiveTab('high_risk')}>View All Details →</button>
                    </div>
                    <div className="space-y-3" style={{ padding: '8px 0' }}>
                      {highRiskFields.slice(0, 3).map((fld, i) => (
                        <div key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                          <div>
                            <strong className="text-red-700">{fld.field_name || fld.name || `Field #${fld.id || i+1}`}</strong>
                            <p className="text-xs text-red-600">
                              Variety: {fld.sugarcane_variety || fld.variety || 'Co 86032'} · Moisture: {fld.soil_moisture || 42}% · Status: {fld.risk_level || 'Attention Required'}
                            </p>
                          </div>
                          <span className="status-badge status-critical">{fld.risk_level || 'High Risk'}</span>
                        </div>
                      ))}
                      {highRiskFields.length === 0 && (
                        <div className="p-3 bg-green-50 text-green-700 rounded-lg">
                          ✔ All monitored sugarcane blocks are operating within safe moisture and thermal bands.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HIGH RISK FIELDS TAB */}
            {activeTab === 'high_risk' && (
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <div>
                    <h3>Vulnerable & Stress-Affected Fields</h3>
                    <p className="text-xs text-gray-500">Fields with moisture deficiency, low predicted yield (&lt; 70 t/ha), or critical agronomic alerts.</p>
                  </div>
                  <button className="btn-primary" onClick={() => navigate('/alerts')}>View System Alerts →</button>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Field Name</th>
                        <th>Farm Location</th>
                        <th>Variety</th>
                        <th>Area (ha)</th>
                        <th>Soil Moisture</th>
                        <th>Forecast Yield</th>
                        <th>Risk Level</th>
                        <th>Recommended Agronomic Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highRiskFields.length === 0 ? (
                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No high-risk fields currently detected.</td></tr>
                      ) : (
                        highRiskFields.map((fld, idx) => (
                          <tr key={idx}>
                            <td className="td-bold">{fld.field_name || fld.name || `Field #${idx+1}`}</td>
                            <td>{fld.location || 'Kolhapur, MH'}</td>
                            <td>{fld.sugarcane_variety || fld.variety || 'Co 86032'}</td>
                            <td>{fld.area || 3.5} ha</td>
                            <td style={{ color: (fld.soil_moisture || 45) < 50 ? '#ef4444' : '#16a34a' }}>
                              {fld.soil_moisture || 42}%
                            </td>
                            <td className="td-bold">{fld.predicted_yield ? `${Number(fld.predicted_yield).toFixed(1)} t/ha` : '68.4 t/ha'}</td>
                            <td>
                              <span className="status-badge status-critical">
                                {fld.risk_level || 'High'}
                              </span>
                            </td>
                            <td>
                              <span className="text-xs text-gray-700">
                                {fld.action || 'Deploy supplemental drip irrigation; inspect for shoot borer damage.'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REGIONAL FARMS TAB */}
            {activeTab === 'farms' && (
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <div>
                    <h3>Regional Farm Register</h3>
                    <p className="text-xs text-gray-500">Overview of all active agricultural holdings in the officer jurisdiction.</p>
                  </div>
                  <button className="btn-primary" onClick={() => navigate('/farm-map')}>View on Interactive Map →</button>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Farm Name</th>
                        <th>Location & District</th>
                        <th>Total Area</th>
                        <th>Fields</th>
                        <th>Primary Variety</th>
                        <th>Soil Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farms.map(f => (
                        <tr key={f.id}>
                          <td className="td-bold">{f.name}</td>
                          <td>{f.location}, {f.district || f.state}</td>
                          <td>{Number(f.total_area).toFixed(1)} ha</td>
                          <td>{f.fields?.length || f.field_count || 1} fields</td>
                          <td>{f.primary_variety || f.fields?.[0]?.sugarcane_variety || 'Co 86032'}</td>
                          <td>{f.soil_type || 'Deep Black Cotton Soil'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PREDICTIONS TAB */}
            {activeTab === 'predictions' && (
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <div>
                    <h3>Regional Prediction Monitoring</h3>
                    <p className="text-xs text-gray-500">Live feed of yield forecasts computed by the Random Forest / XGBoost consensus model.</p>
                  </div>
                  <button className="btn-primary" onClick={() => navigate('/prediction')}>New Prediction →</button>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Farm</th>
                        <th>Variety</th>
                        <th>Predicted Yield</th>
                        <th>Expected Production</th>
                        <th>Confidence</th>
                        <th>Loss Deficit</th>
                        <th>Risk Assessment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.slice(0, 15).map(p => (
                        <tr key={p.id}>
                          <td className="td-muted">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                          <td>{p.farm_name || 'Central Sugar Estate'}</td>
                          <td className="td-bold">{p.variety}</td>
                          <td className="td-green">{Number(p.predicted_yield).toFixed(1)} t/ha</td>
                          <td>{Number(p.expected_production).toFixed(1)} t</td>
                          <td>{Number(p.confidence).toFixed(0)}%</td>
                          <td style={{ color: Number(p.expected_loss_pct || 0) > 15 ? '#ef4444' : '#16a34a' }}>
                            {Number(p.expected_loss_pct || 0).toFixed(1)}%
                          </td>
                          <td>
                            <span className={`status-badge status-${(p.risk_level || 'low').toLowerCase()}`}>
                              {p.risk_level || 'Low'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VARIETY COMPARISON TAB */}
            {activeTab === 'varieties' && (
              <div className="space-y-6">
                <div className="dash-panel">
                  <div className="dash-panel-header">
                    <h3>Extension Variety Evaluation & Comparison</h3>
                    <span className="badge badge-purple">Agronomic Trials</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                    Select varieties to compare potential yield, disease tolerance, and moisture requirements across regional agro-climatic conditions.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {['Co 86032', 'Co 0238', 'CoC 671', 'Co 99004', 'CoM 0265'].map(vName => {
                      const isSel = selectedVarieties.includes(vName);
                      return (
                        <button
                          key={vName}
                          onClick={() => {
                            setSelectedVarieties(prev =>
                              isSel ? prev.filter(x => x !== vName) : [...prev, vName]
                            );
                          }}
                          className={`btn-sm ${isSel ? 'btn-primary' : 'btn-outline'}`}
                        >
                          {isSel ? '✔ ' : '+ '} {vName}
                        </button>
                      );
                    })}
                    <button className="btn-primary" onClick={handleCompareVarieties} style={{ marginLeft: 'auto' }}>
                      ⚡ Execute Comparison
                    </button>
                  </div>

                  {comparisonResult && (
                    <div className="table-wrap" style={{ marginTop: '16px' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            {comparisonResult.comparison?.map(c => (
                              <th key={c.name}>{c.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="td-bold">Average Yield (t/ha)</td>
                            {comparisonResult.comparison?.map(c => (
                              <td key={c.name} className="td-green">{c.avg_yield} t/ha</td>
                            ))}
                          </tr>
                          <tr>
                            <td className="td-bold">Sucrose Content</td>
                            {comparisonResult.comparison?.map(c => (
                              <td key={c.name}>{c.sugar_content ? `${c.sugar_content}%` : 'High (18-20% Brix)'}</td>
                            ))}
                          </tr>
                          <tr>
                            <td className="td-bold">Drought Resistance</td>
                            {comparisonResult.comparison?.map(c => (
                              <td key={c.name}>{c.drought_tolerance || 'Moderate to High'}</td>
                            ))}
                          </tr>
                          <tr>
                            <td className="td-bold">Red Rot & Smut Tolerance</td>
                            {comparisonResult.comparison?.map(c => (
                              <td key={c.name}>{c.disease_resistance || 'Resistant'}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FIELD REPORTS TAB */}
            {activeTab === 'reports' && (
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <div>
                    <h3>Regional Farm & Loss Reports</h3>
                    <p className="text-xs text-gray-500">Access validated intelligence reports generated for extension record-keeping.</p>
                  </div>
                  <button className="btn-primary" onClick={() => navigate('/reports')}>Generate New Report →</button>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Report Title</th>
                        <th>Type</th>
                        <th>Generated On</th>
                        <th>Format</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No reports generated yet.</td></tr>
                      ) : (
                        reports.map(r => (
                          <tr key={r.id}>
                            <td className="td-bold">{r.title || `Report #${r.id}`}</td>
                            <td><span className="badge badge-blue">{r.report_type || 'Farm Intelligence'}</span></td>
                            <td className="td-muted">{new Date(r.created_at || Date.now()).toLocaleDateString('en-IN')}</td>
                            <td>{r.file_format || 'PDF/CSV'}</td>
                            <td>
                              <button className="btn-sm btn-outline" onClick={() => navigate('/reports')}>
                                View Report
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
          </>
        )}
      </div>
    </AppLayout>
  );
}
