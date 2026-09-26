import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line, Legend } from 'recharts';
import AppLayout from '../components/AppLayout';
import { mlApi, predictionApi } from '../services/api';

export default function InsightsPage() {
  const [perf, setPerf]       = useState(null);
  const [explain, setExplain] = useState(null);
  const [preds, setPreds]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('performance');

  useEffect(() => {
    Promise.all([mlApi.performance(), predictionApi.list()])
      .then(([p, pr]) => {
        setPerf(p.data);
        const list = pr.data?.predictions || [];
        setPreds(list);
        if (list.length > 0) {
          mlApi.explain({ ...JSON.parse(list[0].factors || '[]'), predicted_yield: list[0].predicted_yield,
            rainfall_mm: list[0].rainfall, temperature_c: list[0].temperature, soil_ph: list[0].soil_ph,
            soil_nitrogen: 150, soil_moisture: list[0].soil_moisture }).then(r => setExplain(r.data)).catch(() => {});
        }
      }).catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><div className="page-loading-center"><div className="loading-spinner" /><p>Loading AI insights…</p></div></AppLayout>;

  const fiData = (perf?.feature_importance || []).map(f => ({
    name: f.feature.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
    importance: Number((f.importance * 100).toFixed(1))
  }));

  const modelColors = { xgboost: '#2d7a3e', random_forest: '#1a73e8', linear_regression: '#f59e0b' };

  const actualVsPred = preds.slice(0, 15).map((p, i) => ({
    index: i+1,
    predicted: Number(Number(p.predicted_yield).toFixed(1)),
  }));

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Explainable AI</p>
            <h1 className="page-title">AI Insights & Model Performance</h1>
            <p className="page-subtitle">Understand how the model works, what drives predictions, and evaluate accuracy.</p>
          </div>
          {perf && <span className="badge badge-green">Best Model: {perf.best_model?.toUpperCase()}</span>}
        </div>

        <div className="tab-bar">
          {[{id:'performance',label:'Model Performance'},{id:'importance',label:'Feature Importance'},{id:'explain',label:'Prediction Explanation'},{id:'history',label:'Prediction History'}].map(t => (
            <button key={t.id} className={`tab-btn ${tab===t.id?'tab-btn-active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {tab === 'performance' && perf && (
          <>
            {/* Model cards */}
            <div className="stats-grid-3">
              {perf.models.map(m => (
                <div key={m.name} className={`model-perf-card ${m.is_production ? 'model-perf-active' : ''}`}>
                  {m.is_production && <span className="production-badge">★ Production</span>}
                  <h3 style={{ color: modelColors[m.name] }}>{m.display_name}</h3>
                  <div className="model-metrics">
                    {[
                      { label: 'R² (CV Median)', value: m.cv_median_r2?.toFixed(4) },
                      { label: 'RMSE',           value: `${m.cv_median_rmse?.toFixed(2)} t/ha` },
                      { label: 'MAE',            value: `${m.cv_median_mae?.toFixed(2)} t/ha` },
                      { label: 'Test R²',        value: m.test_r2?.toFixed(4) },
                      { label: 'Training Samples', value: m.n_train?.toLocaleString() },
                      { label: 'Test Samples',   value: m.n_test?.toLocaleString() },
                    ].map(met => (
                      <div key={met.label} className="model-metric-row">
                        <span>{met.label}</span>
                        <strong>{met.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="dash-panel">
              <div className="dash-panel-header"><h3>R² Score Comparison (5-Fold CV)</h3><span className="badge badge-blue">Cross-Validation</span></div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={perf.models.map(m => ({ name: m.display_name, 'CV R²': m.cv_median_r2, 'Test R²': m.test_r2 }))} margin={{ top:4,right:8,bottom:0,left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => v.toFixed(4)} />
                  <Legend />
                  <Bar dataKey="CV R²"   fill="#2d7a3e" radius={[4,4,0,0]} />
                  <Bar dataKey="Test R²" fill="#93c5fd" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="insight-note">
                ℹ️ <strong>MEDIAN aggregation</strong> is used for cross-validation — more robust to outliers than mean. Trained on <strong>{perf.models[0]?.n_train?.toLocaleString()} samples</strong>, tested on <strong>{perf.models[0]?.n_test?.toLocaleString()} samples</strong>.
              </div>
            </div>
          </>
        )}

        {tab === 'importance' && fiData.length > 0 && (
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Feature Importance — {perf?.best_model?.toUpperCase()} Model</h3>
              <span className="badge badge-green">From Training</span>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={fiData} layout="vertical" margin={{ top:4, right:40, bottom:0, left:120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" unit="%" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={v => [`${v}%`, 'Importance']} />
                <Bar dataKey="importance" fill="#2d7a3e" radius={[0,4,4,0]}
                  label={{ position:'right', fontSize:11, formatter:v=>`${v}%` }} />
              </BarChart>
            </ResponsiveContainer>
            <div className="insight-note">
              ℹ️ Feature importance shows which input variables most strongly influence the yield prediction. Higher % = stronger influence on model output.
            </div>
          </div>
        )}

        {tab === 'explain' && (
          <>
            {!explain && preds.length === 0 && (
              <div className="empty-page-state">
                <div className="eps-icon">🤖</div>
                <h2>No Predictions Yet</h2>
                <p>Run a yield prediction first to see AI explanation here.</p>
              </div>
            )}
            {explain && (
              <>
                <div className="insight-hero">
                  <div className="ih-left">
                    <span className="eyebrow">Latest Prediction Analysis</span>
                    <div className="ih-yield">{explain.predicted_yield?.toFixed(1)} <span>t/ha</span></div>
                    <p>{explain.summary}</p>
                  </div>
                </div>
                <div className="dash-two-col">
                  <div className="dash-panel factors-panel factor-pos-panel">
                    <div className="dash-panel-header"><h3>✅ Positive Factors</h3><span className="badge badge-green">Boosting Yield</span></div>
                    <div className="factors-list">
                      {(explain.positive_factors || []).map((f, i) => (
                        <div key={i} className="factor-item factor-pos">
                          <span className="fi-icon">✓</span>
                          <div><strong>{f.factor}</strong><p>{f.note}</p></div>
                        </div>
                      ))}
                      {!explain.positive_factors?.length && <p style={{color:'#9ca3af',fontSize:13}}>No significant positive factors detected.</p>}
                    </div>
                  </div>
                  <div className="dash-panel factors-panel factor-neg-panel">
                    <div className="dash-panel-header"><h3>⚠️ Limiting Factors</h3><span className="badge badge-yellow">Reducing Yield</span></div>
                    <div className="factors-list">
                      {(explain.negative_factors || []).map((f, i) => (
                        <div key={i} className="factor-item factor-neg">
                          <span className="fi-icon">!</span>
                          <div><strong>{f.factor}</strong><p>{f.note}</p></div>
                        </div>
                      ))}
                      {!explain.negative_factors?.length && <p style={{color:'#9ca3af',fontSize:13}}>No significant limiting factors detected.</p>}
                    </div>
                  </div>
                </div>
                {explain.feature_importance?.length > 0 && (
                  <div className="dash-panel">
                    <div className="dash-panel-header"><h3>Feature Contribution</h3></div>
                    {explain.feature_importance.map(f => (
                      <div key={f.feature} className="fi-row">
                        <span className="fi-feature-name">{f.feature}</span>
                        <div className="fi-bar-track"><div className="fi-bar-fill" style={{ width:`${Math.min(f.pct*3, 100)}%`, background:'#2d7a3e' }} /></div>
                        <span className="fi-pct">{f.pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'history' && (
          <div className="dash-panel">
            <div className="dash-panel-header"><h3>Prediction History</h3><span className="badge badge-blue">{preds.length} Records</span></div>
            {preds.length === 0 ? (
              <div className="empty-state-sm"><p>No predictions yet.</p></div>
            ) : (
              <>
                {preds.length >= 3 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={preds.slice(0,15).reverse().map((p,i) => ({ index: i+1, yield: Number(Number(p.predicted_yield).toFixed(1)), confidence: Number(Number(p.confidence).toFixed(0)) }))} margin={{top:4,right:8,bottom:0,left:-10}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="index" tick={{fontSize:11}} />
                      <YAxis tick={{fontSize:11}} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="yield" stroke="#2d7a3e" strokeWidth={2} dot={{r:3}} name="Yield (t/ha)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                <div className="table-wrap" style={{ marginTop: 16 }}>
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Variety</th><th>Location</th><th>Yield</th><th>Production</th><th>Confidence</th><th>Health</th></tr></thead>
                    <tbody>
                      {preds.map(p => (
                        <tr key={p.id}>
                          <td className="td-muted">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                          <td className="td-bold">{p.variety}</td>
                          <td>{p.location}</td>
                          <td className="td-green">{Number(p.predicted_yield).toFixed(1)} t/ha</td>
                          <td>{Number(p.expected_production).toFixed(1)} t</td>
                          <td>{Number(p.confidence).toFixed(0)}%</td>
                          <td><span className={`status-badge status-${(p.crop_health||'').toLowerCase()}`}>{p.crop_health}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
