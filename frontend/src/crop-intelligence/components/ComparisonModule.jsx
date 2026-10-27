import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, Ruler } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cropIntelligenceApi } from '../api';

function ComparisonTable({ rows }) {
  return <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Indicator</th><th>Measured</th><th>Published trial / reference</th><th>Assessment</th></tr></thead><tbody>{rows.map(row => <tr key={row.metric}><td>{row.label}</td><td>{row.actual == null ? 'Not recorded' : `${row.actual} ${row.unit || ''}`}</td><td>{row.reference ? <>{row.reference.low}–{row.reference.high} {row.reference.unit}{row.reference.evidence_class === 'trial_mean_plus_minus_one_sd' && <small>Trial mean ± 1 SD · {row.reference.region}</small>}</> : 'Unavailable for this variety, age, and region'}</td><td><span className={`ci-comparison-status ${row.status}`}>{row.status.replaceAll('_', ' ')}</span><small>{row.explanation}</small>{row.reference?.conditions && <small className="ci-reference-context">Context: {row.reference.conditions}</small>}{row.reference?.source?.url && <a className="ci-reference-source" href={row.reference.source.url} target="_blank" rel="noreferrer">{row.reference.source.title} ↗</a>}</td></tr>)}</tbody></table></div>;
}

export default function ComparisonModule({ cycle, onMessage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setLoading(true);
    cropIntelligenceApi.comparison(cycle.cycle.id).then(result => { if (live) setData(result.data); }).catch(error => onMessage?.(error.message)).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [cycle.cycle.id]);
  const heightData = useMemo(() => data?.comparisons?.filter(item => item.measurements.some(row => row.metric === 'plant_height_cm' && row.actual != null)).map(item => ({ date: item.observation_date, dap: item.dap, actual: item.measurements.find(row => row.metric === 'plant_height_cm')?.actual })) || [], [data]);
  const tillerData = useMemo(() => data?.comparisons?.filter(item => item.measurements.some(row => row.metric === 'tiller_count' && row.actual != null)).map(item => ({ date: item.observation_date, dap: item.dap, actual: item.measurements.find(row => row.metric === 'tiller_count')?.actual, area: item.measurements.find(row => row.metric === 'measurement_area_m2')?.actual })) || [], [data]);
  const last = data?.comparisons?.at(-1);
  if (loading) return <div className="ci-loading">Comparing stored measurements with available variety references…</div>;
  return <div className="ci-module-stack">
    <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Measured data only</span><h2>Growth comparison and plant development</h2></div><Ruler size={20} /></div><p className="ci-assessment-copy">{data?.reference_status}</p>
      {last ? <ComparisonTable rows={last.measurements} /> : <div className="ci-empty-state"><Activity size={23} /><div><strong>No crop measurements yet</strong><p>Record a real height, tiller count with sample area, establishment, or soil-moisture value to begin.</p></div></div>}
    </section>
    <div className="ci-two-col">
      <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Stored observations</span><h2>Plant height by crop age</h2></div></div>{heightData.length ? <ResponsiveContainer width="100%" height={260}><LineChart data={heightData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="dap" type="number" label={{ value: 'Days after planting', position: 'insideBottom', offset: -4 }} /><YAxis unit=" cm" /><Tooltip labelFormatter={dap => `DAP ${dap}`} formatter={value => [`${value} cm`, 'Recorded height']} /><Line type="monotone" dataKey="actual" name="Recorded plant height" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} /></LineChart></ResponsiveContainer> : <p className="ci-empty-note">Height trend will appear after actual plant heights are recorded.</p>}</section>
      <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Sampling area shown in the records</span><h2>Tiller count by crop age</h2></div></div>{tillerData.length ? <ResponsiveContainer width="100%" height={260}><LineChart data={tillerData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="dap" type="number" label={{ value: 'Days after planting', position: 'insideBottom', offset: -4 }} /><YAxis /><Tooltip labelFormatter={dap => `DAP ${dap}`} formatter={(value, name) => name === 'area' ? [`${value} m²`, 'Sample area'] : [value, 'Recorded tillers']} /><Line type="monotone" dataKey="actual" name="Recorded tillers" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} /></LineChart></ResponsiveContainer> : <p className="ci-empty-note">Tiller trend will appear after counts and their sampling areas are recorded.</p>}</section>
    </div>
    {data?.comparisons?.map(item => <section className="ci-panel" key={item.observation_id}><div className="ci-section-heading"><div><span className="ci-eyebrow">DAP {item.dap} · {item.source}</span><h2>{item.observation_date} comparison</h2></div></div><ComparisonTable rows={item.measurements} />{item.data_quality?.map((issue, index) => <p className="ci-data-quality-line" key={index}><AlertCircle size={14} />{issue}</p>)}</section>)}
  </div>;
}
