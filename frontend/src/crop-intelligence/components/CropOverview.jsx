import { Activity, AlertTriangle, CalendarDays, ClipboardCheck, Sprout } from 'lucide-react';

function Metric({ icon: Icon, label, value, detail }) {
  return <div className="ci-metric"><span className="ci-metric-icon"><Icon size={17} /></span><span className="ci-metric-label">{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

export default function CropOverview({ cycle, onGo }) {
  if (!cycle) return null;
  const data = cycle.latest_assessment;
  const summary = cycle.stage_summaries?.find(stage => stage.is_current) || cycle.stage_summaries?.[0];
  const unresolved = cycle.alerts?.filter(alert => !['resolved', 'unconfirmed'].includes(alert.status)).length || 0;
  return <>
    <section className="ci-hero">
      <div><span className="ci-eyebrow">Crop monitoring · {cycle.cycle.farm_name}</span><h1>{cycle.cycle.field_name}</h1><p>{cycle.cycle.variety_code} · planted {cycle.cycle.planting_date} · {cycle.cycle.season || 'season not recorded'}</p></div>
      <div className="ci-hero-stage"><span>Current planning stage</span><strong>{cycle.current_stage?.name || 'Before planting'}</strong><small>{cycle.stage_progress_pct == null ? 'Continued monitoring' : `${cycle.stage_progress_pct}% through stage`}</small></div>
    </section>
    <div className="ci-metric-grid">
      <Metric icon={CalendarDays} label="Crop age" value={`${Math.max(0, cycle.actual_dap)} DAP`} detail="Age recalculated from planting date" />
      <Metric icon={Sprout} label="Sugarcane variety" value={cycle.cycle.variety_code} detail={cycle.variety_reference?.regions || 'No regional note available'} />
      <Metric icon={Activity} label="Recorded observations" value={cycle.observations?.length || 0} detail={cycle.observations?.length ? `Latest: ${cycle.observations.at(-1).observation_date}` : 'No measurements recorded yet'} />
      <Metric icon={AlertTriangle} label="Open warnings" value={unresolved} detail={unresolved ? 'Review evidence and follow-up steps' : 'No active abnormality alerts'} />
    </div>
    <section className="ci-panel">
      <div className="ci-section-heading"><div><span className="ci-eyebrow">Current assessment</span><h2>{summary?.name || 'Crop cycle'}</h2></div><button className="ci-link-button" onClick={() => onGo('stages')}>Open stage monitoring →</button></div>
      <p className="ci-assessment-copy">{summary?.assessment || 'Select a field to begin monitoring.'}</p>
      {data?.data_quality?.length > 0 && <div className="ci-data-notice"><strong>Data quality</strong><ul>{data.data_quality.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
      {!cycle.observations?.length && <div className="ci-empty-state"><Sprout size={24} /><div><strong>Start with a real field observation</strong><p>Add height, tiller count with sampling area, leaf condition, soil moisture, irrigation, or notes that you actually observed.</p></div><button className="ci-primary" onClick={() => onGo('observations')}>Record an observation</button></div>}
    </section>
    <section className="ci-panel">
      <div className="ci-section-heading"><div><span className="ci-eyebrow">Six planning windows and continued monitoring</span><h2>Growth-stage progress</h2></div><button className="ci-link-button" onClick={() => onGo('calendar')}>Open calendar →</button></div>
      <div className="ci-stage-overview-grid">{cycle.stage_summaries?.map(stage => <button type="button" className={`ci-stage-mini ${stage.is_current ? 'is-current' : ''}`} key={stage.stage_key} onClick={() => onGo('stages', stage.stage_key)}><span>{stage.start_day}{stage.end_day ? `–${stage.end_day}` : '+'} DAP</span><strong>{stage.name}</strong><small>{stage.observations} observations · {stage.tasks_completed} tasks done</small>{stage.unresolved_alerts > 0 && <em>{stage.unresolved_alerts} open alert{stage.unresolved_alerts === 1 ? '' : 's'}</em>}</button>)}</div>
      <div className="ci-report-hint"><ClipboardCheck size={17} /><span>Next checkpoint: {cycle.next_checkpoint ? `day ${cycle.next_checkpoint}` : 'past day 180 — keep monitoring and use local maturity guidance'}</span></div>
    </section>
  </>;
}
