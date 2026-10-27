import { useEffect, useState } from 'react';
import { CheckCircle2, Compass, Info } from 'lucide-react';
import { cropIntelligenceApi } from '../api';

export default function RecommendationsModule({ cycle, onMessage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setLoading(true);
    cropIntelligenceApi.recommendations(cycle.cycle.id).then(result => { if (live) setData(result.data); }).catch(error => onMessage?.(error.message)).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [cycle.cycle.id]);
  if (loading) return <div className="ci-loading">Loading evidence-led crop guidance…</div>;
  return <div className="ci-module-stack">
    <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Transparent rules · real crop context</span><h2>Crop-specific recommendations</h2></div><Compass size={20} /></div><p className="ci-assessment-copy">Recommendations combine configured stage guidance with this cycle’s variety, crop age, location, soil, irrigation method, actual observations, and active warnings. No AI or weather service is required for this section.</p><div className="ci-data-notice"><strong>Assessment limits</strong><ul>{data?.limitations?.map((item, index) => <li key={index}>{item}</li>)}</ul></div>{data?.recommendations?.length ? <div className="ci-recommendation-list">{data.recommendations.map((item, index) => <article key={`${item.title}-${index}`}><div className="ci-recommendation-icon"><CheckCircle2 size={17} /></div><div className="ci-recommendation-copy"><span>{item.category} · {item.priority} priority · {item.classification}</span><h3>{item.title}</h3><p>{item.reason}</p><strong>Why it matters</strong><p>{item.expected_benefit || item.why}</p><details><summary>Evidence used and limitations</summary><pre>{JSON.stringify(item.evidence, null, 2)}</pre><a href={item.source?.url} target="_blank" rel="noreferrer">{item.source?.title} ↗</a><small>{item.source?.limitation}</small></details></div></article>)}</div> : <p className="ci-empty-note">No stage-specific guidance is configured for this date.</p>}</section>
    {data?.evidence_based_follow_ups?.length > 0 && <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Saved with observed evidence</span><h2>Mitigation follow-ups</h2></div><Info size={18} /></div><div className="ci-recommendation-list">{data.evidence_based_follow_ups.map(item => <article key={item.id}><div className="ci-recommendation-icon"><Info size={17} /></div><div className="ci-recommendation-copy"><span>{item.classification}</span><h3>{item.title}</h3><p>{item.evidence}</p><details><summary>Investigation and next steps</summary><pre>{JSON.stringify(item, null, 2)}</pre></details></div></article>)}</div></section>}
  </div>;
}
