import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ReferenceLine } from 'recharts';
import AppLayout from '../components/AppLayout';
import { predictionApi, farmApi } from '../services/api';

export default function AnalyticsPage() {
  const [preds, setPreds]   = useState([]);
  const [farms, setFarms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ variety: 'all', farm: 'all' });

  useEffect(() => {
    Promise.all([predictionApi.list(), farmApi.list()])
      .then(([pr, fr]) => {
        setPreds(pr.data?.predictions || []);
        setFarms(fr.data?.farms || []);
      }).catch(e => console.error(e)).finally(() => setLoading(false));
  }, []);

  const varieties = [...new Set(preds.map(p => p.variety))];
  const farmNames = [...new Set(preds.map(p => p.farm_name).filter(Boolean))];

  const filtered = preds.filter(p =>
    (filter.variety === 'all' || p.variety === filter.variety) &&
    (filter.farm    === 'all' || p.farm_name === filter.farm)
  );

  const sortedChron = [...filtered].reverse();

  const trendData  = sortedChron.map((p, i) => ({ index: i+1, yield: Number(Number(p.predicted_yield).toFixed(1)), confidence: Number(Number(p.confidence).toFixed(0)) }));
  const byVariety  = varieties.map(v => {
    const vPreds = preds.filter(p => p.variety === v);
    const avg = vPreds.length ? (vPreds.reduce((s, p) => s + Number(p.predicted_yield), 0) / vPreds.length).toFixed(1) : 0;
    const min = Math.min(...vPreds.map(p => Number(p.predicted_yield)));
    const max = Math.max(...vPreds.map(p => Number(p.predicted_yield)));
    return { name: v, avg: Number(avg), min: Number(min.toFixed(1)), max: Number(max.toFixed(1)), count: vPreds.length };
  });

  const overallAvg = preds.length ? (preds.reduce((s, p) => s + Number(p.predicted_yield), 0) / preds.length).toFixed(1) : 0;
  const overallConf = preds.length ? (preds.reduce((s, p) => s + Number(p.confidence), 0) / preds.length).toFixed(0) : 0;
  const totalProd  = preds.reduce((s, p) => s + Number(p.expected_production || 0), 0).toFixed(1);

  if (loading) return <AppLayout><div className="page-loading-center"><div className="loading-spinner" /><p>Loading analytics…</p></div></AppLayout>;

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Historical Analytics</p>
            <h1 className="page-title">Yield Analytics</h1>
            <p className="page-subtitle">Historical yield analysis, trends, and performance insights from your predictions.</p>
          </div>
        </div>

        {preds.length === 0 ? (
          <div className="empty-page-state">
            <div className="eps-icon">📈</div>
            <h2>No Data Yet</h2>
            <p>Run predictions to see analytics and trend data here.</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="stats-grid-4">
              {[
                { icon:'📊', label:'Total Predictions', value:preds.length,      color:'#2d7a3e' },
                { icon:'🌾', label:'Avg Yield',          value:`${overallAvg} t/ha`, color:'#16a34a' },
                { icon:'🎯', label:'Avg Confidence',     value:`${overallConf}%`,    color:'#6366f1' },
                { icon:'📦', label:'Total Production',   value:`${totalProd} t`,     color:'#f59e0b' },
              ].map(s => (
                <div key={s.label} className="stat-card" style={{ '--card-accent': s.color }}>
                  <div className="sc-icon">{s.icon}</div>
                  <div className="sc-body"><span className="sc-label">{s.label}</span><span className="sc-value">{s.value}</span></div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="analytics-filters">
              <div className="form-group" style={{ minWidth:160 }}>
                <label>Filter by Variety</label>
                <select value={filter.variety} onChange={e => setFilter(f => ({...f, variety: e.target.value}))}>
                  <option value="all">All Varieties</option>
                  {varieties.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ minWidth:160 }}>
                <label>Filter by Farm</label>
                <select value={filter.farm} onChange={e => setFilter(f => ({...f, farm: e.target.value}))}>
                  <option value="all">All Farms</option>
                  {farmNames.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>

            {/* Trend chart */}
            {trendData.length >= 2 && (
              <div className="dash-panel">
                <div className="dash-panel-header"><h3>Yield Trend Over Time</h3><span className="badge badge-green">{filtered.length} predictions</span></div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendData} margin={{ top:4, right:8, bottom:0, left:-10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="index" label={{ value:'Prediction #', position:'insideBottom', offset:-2, fontSize:11 }} tick={{ fontSize:11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize:11 }} unit="t/ha" />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11 }} unit="%" />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine yAxisId="left" y={Number(overallAvg)} stroke="#94a3b8" strokeDasharray="4 4" label={{ value:'Avg', fontSize:10 }} />
                    <Line yAxisId="left" type="monotone" dataKey="yield" stroke="#2d7a3e" strokeWidth={2} dot={{ r:3 }} name="Yield (t/ha)" />
                    <Line yAxisId="right" type="monotone" dataKey="confidence" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Confidence %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* By variety */}
            {byVariety.length > 0 && (
              <div className="dash-panel">
                <div className="dash-panel-header"><h3>Performance by Variety</h3></div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byVariety} margin={{ top:4, right:8, bottom:0, left:-10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:11 }} unit="t/ha" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg" name="Avg Yield" fill="#2d7a3e" radius={[4,4,0,0]} />
                    <Bar dataKey="max" name="Max Yield" fill="#86efac" radius={[4,4,0,0]} />
                    <Bar dataKey="min" name="Min Yield" fill="#fca5a5" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Detail table */}
            <div className="dash-panel">
              <div className="dash-panel-header"><h3>All Predictions</h3><span className="badge badge-blue">{filtered.length} records</span></div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Variety</th><th>Farm</th><th>Location</th><th>Yield (t/ha)</th><th>Production (t)</th><th>Area (ha)</th><th>Conf.</th><th>Health</th></tr></thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id}>
                        <td className="td-muted">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                        <td className="td-bold">{p.variety}</td>
                        <td>{p.farm_name || '—'}</td>
                        <td>{p.location}</td>
                        <td className="td-green">{Number(p.predicted_yield).toFixed(1)}</td>
                        <td>{Number(p.expected_production).toFixed(1)}</td>
                        <td>{Number(p.area).toFixed(1)}</td>
                        <td>{Number(p.confidence).toFixed(0)}%</td>
                        <td><span className={`status-badge status-${(p.crop_health||'').toLowerCase()}`}>{p.crop_health}</span></td>
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
