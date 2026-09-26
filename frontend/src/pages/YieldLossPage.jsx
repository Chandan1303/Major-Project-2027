import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import AppLayout from '../components/AppLayout';
import { predictionApi, mlApi } from '../services/api';

const REF_YIELD = 85;

export default function YieldLossPage() {
  const [preds, setPreds]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [explain, setExplain]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    predictionApi.list().then(r => {
      const list = r.data?.predictions || [];
      setPreds(list);
      if (list.length) setSelected(list[0]);
    }).catch(e => console.error(e)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    mlApi.explain({
      predicted_yield: selected.predicted_yield,
      rainfall_mm: selected.rainfall, temperature_c: selected.temperature,
      soil_ph: selected.soil_ph, soil_moisture: selected.soil_moisture, soil_nitrogen: 150
    }).then(r => setExplain(r.data)).catch(() => {});
  }, [selected]);

  if (loading) return <AppLayout><div className="page-loading-center"><div className="loading-spinner" /><p>Loading loss analysis…</p></div></AppLayout>;

  const calcLoss = (p) => {
    const yld  = Number(p.predicted_yield);
    const loss = Math.max(0, REF_YIELD - yld);
    const pct  = ((loss / REF_YIELD) * 100).toFixed(1);
    const risk = loss < 8.5 ? 'Low' : loss < 21.25 ? 'Medium' : loss < 34 ? 'High' : 'Critical';
    return { yld, loss: +loss.toFixed(2), pct: +pct, risk };
  };

  const sel = selected ? calcLoss(selected) : null;
  const allData = preds.map(p => {
    const { yld, loss, pct, risk } = calcLoss(p);
    return { name: p.variety, predicted: yld, reference: REF_YIELD, loss, pct, risk, variety: p.variety, date: new Date(p.created_at).toLocaleDateString('en-IN') };
  });

  const riskColors = { Low:'#16a34a', Medium:'#f59e0b', High:'#ef4444', Critical:'#dc2626' };

  const pieData = Object.entries(
    preds.reduce((acc, p) => { const { risk } = calcLoss(p); acc[risk] = (acc[risk]||0)+1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const fiFactors = explain?.feature_importance?.slice(0,6) || [
    { feature:'Rainfall', pct:22 },{ feature:'Soil Nitrogen', pct:18 },{ feature:'Temperature', pct:15 },
    { feature:'Irrigation', pct:12 },{ feature:'Previous Yield', pct:10 },{ feature:'Soil pH', pct:8 },
  ];

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Loss Intelligence</p>
            <h1 className="page-title">Yield & Loss Analysis</h1>
            <p className="page-subtitle">Compare predicted vs reference yield, quantify loss, and identify root causes.</p>
          </div>
        </div>

        {preds.length === 0 ? (
          <div className="empty-page-state">
            <div className="eps-icon">📉</div>
            <h2>No Prediction Data</h2>
            <p>Run predictions first to see yield loss analysis.</p>
          </div>
        ) : (
          <>
            {/* Prediction selector */}
            <div className="profile-selector">
              {preds.map(p => (
                <button key={p.id} className={`profile-btn ${selected?.id===p.id?'profile-btn-active':''}`} onClick={() => setSelected(p)}>
                  🌾 {p.variety} — {new Date(p.created_at).toLocaleDateString('en-IN')}
                </button>
              ))}
            </div>

            {sel && selected && (
              <>
                {/* Summary cards */}
                <div className="stats-grid-4">
                  {[
                    { icon:'🎯', label:'Reference Yield',  value:`${REF_YIELD} t/ha`,     color:'#6366f1' },
                    { icon:'🌾', label:'Predicted Yield',   value:`${sel.yld.toFixed(1)} t/ha`, color: sel.yld >= REF_YIELD ? '#16a34a' : '#f59e0b' },
                    { icon:'📉', label:'Yield Loss',        value:`${sel.loss} t/ha`,      color: sel.loss > 0 ? '#ef4444' : '#16a34a' },
                    { icon:'📊', label:'Loss Percentage',   value:`${sel.pct}%`,           color: riskColors[sel.risk] },
                  ].map(c => (
                    <div key={c.label} className="stat-card" style={{ '--card-accent': c.color }}>
                      <div className="sc-icon">{c.icon}</div>
                      <div className="sc-body"><span className="sc-label">{c.label}</span><span className="sc-value">{c.value}</span></div>
                    </div>
                  ))}
                </div>

                {/* Risk badge */}
                <div className="risk-display-card" style={{ background:`${riskColors[sel.risk]}12`, borderColor:`${riskColors[sel.risk]}40`, color:riskColors[sel.risk] }}>
                  <span className="rdc-icon">{sel.risk==='Low'?'🟢':sel.risk==='Medium'?'🟡':sel.risk==='High'?'🟠':'🔴'}</span>
                  <div>
                    <strong>Risk Level: {sel.risk}</strong>
                    <p>{sel.risk==='Low'?'Yield is within acceptable range of the reference benchmark.':sel.risk==='Medium'?'Moderate loss detected. Monitor conditions and consider corrective action.':sel.risk==='High'?'Significant yield loss expected. Immediate intervention recommended.':'Critical loss predicted. Urgent action required.'}</p>
                  </div>
                </div>
              </>
            )}

            <div className="dash-two-col">
              {/* Bar comparison */}
              <div className="dash-panel">
                <div className="dash-panel-header"><h3>Predicted vs Reference Yield</h3><span className="badge badge-blue">All Predictions</span></div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={allData.slice(0,8)} margin={{ top:4,right:8,bottom:20,left:-10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} unit="t/ha" />
                    <Tooltip formatter={(v) => [`${v} t/ha`]} />
                    <Legend />
                    <Bar dataKey="reference" name="Reference" fill="#e5e7eb" radius={[4,4,0,0]} />
                    <Bar dataKey="predicted" name="Predicted" radius={[4,4,0,0]}>
                      {allData.map((d, i) => <Cell key={i} fill={riskColors[d.risk]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie */}
              <div className="dash-panel">
                <div className="dash-panel-header"><h3>Risk Distribution</h3></div>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                        {pieData.map((entry, i) => <Cell key={i} fill={riskColors[entry.name] || '#6b7280'} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="empty-state-sm"><p>Not enough data yet.</p></div>}
              </div>
            </div>

            {/* Loss factors */}
            <div className="dash-panel">
              <div className="dash-panel-header"><h3>Major Factors Affecting Yield Loss</h3><span className="badge badge-green">Feature Importance</span></div>
              <p style={{ fontSize:13, color:'#6b7280', marginBottom:16 }}>
                Based on the ML model's feature importance, these are the key drivers of yield variance in your predictions.
              </p>
              <div className="loss-factors-grid">
                {fiFactors.map(f => {
                  const pct = f.pct || +(f.importance * 100).toFixed(1);
                  return (
                    <div key={f.feature} className="loss-factor-card" style={{ '--lf-color': '#2d7a3e' }}>
                      <div className="lf-body">
                        <span className="lf-name">{f.feature}</span>
                        <span className="lf-pct">{pct}% importance</span>
                      </div>
                      <div className="lf-bar-wrap"><div className="lf-bar" style={{ width:`${Math.min(pct*4,100)}%`, background:'#2d7a3e' }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All predictions table */}
            <div className="dash-panel">
              <div className="dash-panel-header"><h3>All Predictions — Loss Summary</h3></div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Variety</th><th>Reference</th><th>Predicted</th><th>Loss (t/ha)</th><th>Loss %</th><th>Risk</th></tr></thead>
                  <tbody>
                    {allData.map((row, i) => (
                      <tr key={i}>
                        <td className="td-muted">{row.date}</td>
                        <td className="td-bold">{row.variety}</td>
                        <td>{REF_YIELD} t/ha</td>
                        <td className={row.predicted >= REF_YIELD ? 'td-green' : ''}>{row.predicted.toFixed(1)} t/ha</td>
                        <td style={{ color: row.loss > 0 ? '#ef4444' : '#16a34a' }}>{row.loss > 0 ? `▼ ${row.loss}` : `▲ ${Math.abs(row.loss)}`}</td>
                        <td>{row.pct}%</td>
                        <td><span className="status-badge" style={{ background:`${riskColors[row.risk]}18`, color:riskColors[row.risk] }}>{row.risk}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
