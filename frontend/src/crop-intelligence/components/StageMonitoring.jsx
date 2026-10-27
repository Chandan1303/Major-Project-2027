import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, ClipboardList, Eye, Sprout } from 'lucide-react';
import ObservationForm from './ObservationForm';

export default function StageMonitoring({ cycle, stages, onRefresh, onMessage, initialStageKey }) {
  const defaultStage = stages.find(item => item.key === initialStageKey)?.key || cycle.current_stage?.key || stages[0]?.key;
  const [activeKey, setActiveKey] = useState(defaultStage);
  const [recording, setRecording] = useState(false);
  const stage = stages.find(item => item.key === activeKey) || stages[0];
  const stageSummary = cycle.stage_summaries?.find(item => item.stage_key === stage?.key);
  const observations = useMemo(() => cycle.observations?.filter(item => item.dap >= stage.start_day && (stage.end_day == null || item.dap <= stage.end_day)) || [], [cycle.observations, stage]);
  const tasks = useMemo(() => cycle.tasks?.filter(item => {
    const dap = Math.round((new Date(`${item.due_date}T00:00:00`) - new Date(`${cycle.cycle.planting_date}T00:00:00`)) / 86400000);
    return dap >= stage.start_day && (stage.end_day == null || dap <= stage.end_day);
  }) || [], [cycle.tasks, stage, cycle.cycle.planting_date]);
  const regionValues = new Set([cycle.cycle.farm_state, cycle.cycle.farm_district].filter(Boolean).map(value => value.trim().toLocaleLowerCase()));
  if (regionValues.has('belagavi')) regionValues.add('belgaum');
  if (regionValues.has('belgaum')) regionValues.add('belagavi');
  const referenceRanges = (cycle.variety_reference?.growth_reference_ranges || []).filter(item =>
    item.metric && item.region && regionValues.has(item.region.trim().toLocaleLowerCase()) &&
    Number(item.start_day) <= (stage.end_day ?? Infinity) && Number(item.end_day) >= stage.start_day
  );
  const isCurrentStage = cycle.current_stage?.key === stage.key;
  const hasTrialBands = referenceRanges.some(item => item.evidence_class === 'trial_mean_plus_minus_one_sd');

  if (!stage) return null;
  return <div className="ci-module-stack">
    <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Each window has its own evidence and tasks</span><h2>Stage-wise monitoring</h2></div></div>
      <div className="ci-stage-picker">{stages.map(item => { const summary = cycle.stage_summaries?.find(row => row.stage_key === item.key); return <button key={item.key} type="button" className={`ci-stage-tab ${activeKey === item.key ? 'active' : ''} ${summary?.is_current ? 'current' : ''}`} onClick={() => { setActiveKey(item.key); setRecording(false); }}><small>{item.start_day}{item.end_day ? `–${item.end_day}` : '+'} DAP</small><strong>{item.name}</strong>{summary?.is_current && <em>Current</em>}</button>; })}</div>
      <div className="ci-stage-detail"><span className="ci-eyebrow">Planning range · day {stage.start_day}{stage.end_day ? ` to ${stage.end_day}` : ' onward'}</span><h3>{stage.name}</h3><p>{stage.process}</p>
        <div className="ci-stage-context"><div><small>Selected variety</small><strong>{cycle.cycle.variety_code}</strong></div><div><small>Actual crop age</small><strong>{cycle.actual_dap < 0 ? `Planting in ${Math.abs(cycle.actual_dap)} days` : `Day ${cycle.actual_dap} after planting`}</strong></div><div><small>Current stage</small><strong>{cycle.current_stage?.name || 'Before planting'}</strong></div><div><small>Selected stage progress</small><strong>{isCurrentStage && cycle.stage_progress_pct != null ? `${cycle.stage_progress_pct}%` : isCurrentStage ? 'Ongoing' : 'Not current'}</strong></div></div>
        {isCurrentStage && cycle.stage_progress_pct != null && <div className="ci-stage-progress" role="progressbar" aria-label={`${stage.name} progress`} aria-valuenow={cycle.stage_progress_pct} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${cycle.stage_progress_pct}%` }} /></div>}
        <div className="ci-data-notice"><strong>{hasTrialBands ? `Published trial comparison for ${cycle.cycle.variety_code}` : `Ideal growth reference for ${cycle.cycle.variety_code}`}</strong>{hasTrialBands && <p>Trial means ± 1 SD are shown for context only. They are not healthy-growth targets; the study conditions may differ from this field.</p>}{referenceRanges.length ? <ul>{referenceRanges.map((item, index) => <li key={`${item.metric}-${index}`}><strong>{item.metric.replaceAll('_', ' ')}{item.evidence_class === 'trial_mean_plus_minus_one_sd' ? ' · trial mean ± 1 SD' : ''}:</strong> {item.low}–{item.high} {item.unit} · {item.region} · DAP {item.start_day}–{item.end_day}<br /><small>{item.conditions}; method: {item.method}; source: {item.source?.title} ({item.source?.verified})</small></li>)}</ul> : <p>Variety-specific reference data unavailable for this stage and farm region. No generic target is substituted.</p>}</div>
        <p className="ci-frequency"><strong>Suggested observation frequency:</strong> {stage.frequency}</p>
        <div className="ci-stage-observations"><strong>What to observe</strong><ul>{stage.observations.map((item, index) => <li key={index}>{item}</li>)}</ul></div>
        <div className="ci-activity-list"><strong>Activities and why they matter</strong>{stage.activities.map((item, index) => <article key={`${item.title}-${index}`}><div><b>{item.title}</b><p>{item.why}</p></div><span className={`ci-priority ci-priority-${item.priority}`}>{item.priority}</span></article>)}</div>
        <p className="ci-source-note">Reference class: general stage-planning guidance. This is not a variety-specific growth target.</p>
      </div>
    </section>
    <div className="ci-two-col">
      <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Persisted crop evidence</span><h2>Stage observations</h2></div><button className="ci-primary" onClick={() => setRecording(value => !value)}><Sprout size={15} />Record</button></div>
        {recording && <ObservationForm cycle={cycle.cycle} onSaved={async () => { setRecording(false); await onRefresh(); }} onCancel={() => setRecording(false)} onMessage={onMessage} />}
        {observations.length ? <div className="ci-record-list">{observations.map(item => <article key={item.id}><div><strong>{item.observation_date} · DAP {item.dap}</strong><p>{[item.plant_height_cm != null && `${item.plant_height_cm} cm height`, item.tiller_count != null && `${item.tiller_count} tillers/${item.measurement_area_m2} m²`, item.leaf_condition, item.soil_moisture_pct != null && `${item.soil_moisture_pct}% soil moisture`].filter(Boolean).join(' · ') || item.notes || 'Qualitative field note recorded'}</p></div><span className="ci-source-pill">{item.source}</span></article>)}</div> : <p className="ci-empty-note">No observations have been recorded in this planning window.</p>}
      </section>
      <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Stage evidence summary</span><h2>Completion and follow-up</h2></div><ClipboardList size={18} /></div>
        <div className="ci-check-row"><span><Eye size={16} /> Observations</span><strong>{stageSummary?.observations || 0} recorded</strong></div>
        <div className="ci-check-row"><span><CheckCircle2 size={16} /> Tasks</span><strong>{stageSummary?.tasks_completed || 0} done · {stageSummary?.tasks_pending || 0} pending</strong></div>
        <div className="ci-check-row"><span><Circle size={16} /> Unresolved warnings</span><strong>{stageSummary?.unresolved_alerts || 0}</strong></div>
        <div className="ci-data-notice"><strong>Assessment</strong><p>{stageSummary?.assessment}</p><small>Completing tasks does not automatically mark crop growth as healthy.</small></div>
        {tasks.length > 0 && <div className="ci-record-list">{tasks.map(task => <article key={task.id}><div><strong>{task.title}</strong><p>Due {task.due_date} · {task.status.replace('_', ' ')}</p></div></article>)}</div>}
      </section>
    </div>
  </div>;
}
