import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Plus, TriangleAlert } from 'lucide-react';
import ObservationForm from './ObservationForm';
import { cropIntelligenceApi } from '../api';
import { localDateInput, shiftLocalDate } from '../date';

export default function CalendarModule({ cycle, onRefresh, onMessage }) {
  const cycleId = cycle.cycle.id;
  const today = cycle.as_of_date || localDateInput();
  const [view, setView] = useState('week');
  const [anchor, setAnchor] = useState(today);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [recording, setRecording] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', due_date: today, category: 'scouting', details: '', priority: 'normal' });
  const [stageFilter, setStageFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [warningFilter, setWarningFilter] = useState('all');

  const visibleDays = days.filter(day =>
    (stageFilter === 'all' || day.stage?.key === stageFilter) &&
    (taskFilter === 'all' || day.tasks?.some(task => task.status === taskFilter)) &&
    (warningFilter === 'all' || (warningFilter === 'with' ? day.alerts?.length > 0 : !day.alerts?.length))
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    cropIntelligenceApi.calendar(cycleId, { date: anchor, view }).then(response => {
      if (!cancelled) {
        setDays(response.data.days || []);
        setSelected(current => response.data.days.find(day => day.date === current?.date) || response.data.days.find(day => day.date === anchor) || response.data.days[0] || null);
      }
    }).catch(error => onMessage?.(error.message)).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cycleId, anchor, view]);

  const shift = (amount) => {
    const step = view === 'day' ? 1 : view === 'week' ? 7 : 30;
    setAnchor(value => shiftLocalDate(value, amount * step));
  };

  const addTask = async (event) => {
    event.preventDefault();
    try {
      await cropIntelligenceApi.addTask(cycleId, taskForm);
      onMessage?.('Task saved for the selected crop cycle.');
      setTaskForm(current => ({ ...current, title: '', details: '' }));
      await onRefresh();
      const response = await cropIntelligenceApi.calendar(cycleId, { date: anchor, view });
      setDays(response.data.days || []);
    } catch (error) { onMessage?.(error.message); }
  };

  return <div className="ci-module-stack">
    <section className="ci-panel">
      <div className="ci-section-heading"><div><span className="ci-eyebrow">Planting date based · no invented observations</span><h2>Daily and weekly growth calendar</h2></div><CalendarDays size={20} /></div>
      <div className="ci-calendar-toolbar"><div className="ci-calendar-views">{['day', 'week', 'stage'].map(item => <button key={item} type="button" className={view === item ? 'active' : ''} onClick={() => setView(item)}>{item === 'day' ? 'Daily' : item === 'week' ? 'Weekly' : 'Stage'}</button>)}</div><div className="ci-calendar-nav"><button aria-label="Previous dates" onClick={() => shift(-1)}><ArrowLeft size={16} /></button><input type="date" value={anchor} onChange={event => setAnchor(event.target.value)} /><button aria-label="Upcoming dates" onClick={() => shift(1)}><ArrowRight size={16} /></button><button className="ci-today" onClick={() => setAnchor(today)}>Today</button></div></div>
      <div className="ci-calendar-filters"><label>Stage<select value={stageFilter} onChange={event => setStageFilter(event.target.value)}><option value="all">All stages</option>{cycle.stage_summaries?.map(stage => <option key={stage.stage_key} value={stage.stage_key}>{stage.name}</option>)}</select></label><label>Task status<select value={taskFilter} onChange={event => setTaskFilter(event.target.value)}><option value="all">Any task</option>{['pending', 'in_progress', 'completed', 'cancelled'].map(status => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}</select></label><label>Warnings<select value={warningFilter} onChange={event => setWarningFilter(event.target.value)}><option value="all">All dates</option><option value="with">With warnings</option><option value="without">Without warnings</option></select></label></div>
      {loading ? <div className="ci-loading">Loading the persisted calendar…</div> : <div className={`ci-calendar-days ${view === 'day' ? 'single' : ''}`}>
        {visibleDays.map(day => <button type="button" key={day.date} className={`ci-calendar-day ${day.date === selected?.date ? 'selected' : ''} ${day.is_recorded ? 'recorded' : ''}`} onClick={() => { setSelected(day); setRecording(false); setTaskForm(current => ({ ...current, due_date: day.date })); }}>
          <span className="ci-calendar-date">{new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <strong>DAP {day.dap}</strong><span className="ci-calendar-stage">{day.stage?.name || 'Before planting'}</span>
          <span className="ci-calendar-marker-row">{day.is_recorded ? <em className="recorded-marker"><CheckCircle2 size={13} />Recorded</em> : <em className="unrecorded-marker">Unrecorded</em>}{day.missed_observation && <em className="missed-marker">Check-in due</em>}{day.alerts?.length > 0 && <em className="warning-marker"><TriangleAlert size={12} />{day.alerts.length} alert</em>}</span>
          {day.tasks?.map(task => <span className={`ci-calendar-task ${task.status}`} key={task.id}>{task.title}</span>)}
          {day.activities?.map(activity => <span className="ci-calendar-task activity" key={`activity-${activity.id}`}>{activity.activity_type}: {activity.details}</span>)}
        </button>)}
        {!days.length && <p className="ci-empty-note">No dates in this view.</p>}
      </div>}
    </section>

    {selected && <div className="ci-two-col ci-calendar-detail">
      <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">{selected.date} · DAP {selected.dap}</span><h2>{selected.stage?.name || 'Before planting'}</h2></div><button className="ci-primary" onClick={() => setRecording(value => !value)}><Plus size={15} />Record observation</button></div>
        {selected.developmental_activity && <p>{selected.developmental_activity}</p>}
        {selected.recommended_observation && <div className="ci-data-notice"><strong>Suggested observation</strong><p>{selected.recommended_observation}</p><small>{selected.observation_frequency}</small></div>}
        {selected.observation ? <div className="ci-record-list"><article><div><strong>Recorded evidence · {selected.observation.source}</strong><p>{[selected.observation.plant_height_cm != null && `${selected.observation.plant_height_cm} cm height`, selected.observation.tiller_count != null && `${selected.observation.tiller_count} tillers in ${selected.observation.measurement_area_m2} m²`, selected.observation.leaf_condition, selected.observation.notes].filter(Boolean).join(' · ') || 'Observation recorded.'}</p></div></article></div> : <p className="ci-empty-note">No observation was recorded for this date. The calendar does not fill in missed measurements.</p>}
        {selected.alerts?.map(alert => <div className="ci-alert-compact" key={alert.id}><TriangleAlert size={15} /><span><strong>{alert.indicator}</strong> · {alert.evidence}</span></div>)}
        {selected.activities?.length > 0 && <div className="ci-record-list">{selected.activities.map(activity => <article key={activity.id}><div><strong>{activity.activity_type.replace('_', ' ')}</strong><p>{activity.details}{activity.amount != null ? ` · ${activity.amount} ${activity.amount_unit || ''}` : ''}</p></div></article>)}</div>}
        {recording && <ObservationForm cycle={cycle.cycle} initialDate={selected.date} onSaved={async () => { setRecording(false); await onRefresh(); const response = await cropIntelligenceApi.calendar(cycleId, { date: anchor, view }); setDays(response.data.days || []); }} onCancel={() => setRecording(false)} onMessage={onMessage} />}
      </section>
      <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Future or follow-up activity</span><h2>Schedule a task</h2></div></div><form className="ci-form" onSubmit={addTask}><label className="ci-field"><span>Task</span><input required maxLength="180" value={taskForm.title} onChange={event => setTaskForm(current => ({ ...current, title: event.target.value }))} placeholder="e.g. Recheck marked tiller-count area" /></label><label className="ci-field"><span>Due date</span><input required type="date" value={taskForm.due_date} onChange={event => setTaskForm(current => ({ ...current, due_date: event.target.value }))} /></label><div className="ci-measure-grid"><label className="ci-field"><span>Category</span><select value={taskForm.category} onChange={event => setTaskForm(current => ({ ...current, category: event.target.value }))}>{['irrigation', 'nutrition', 'weeds', 'pest_disease', 'soil', 'scouting', 'assessment', 'other'].map(value => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select></label><label className="ci-field"><span>Priority</span><select value={taskForm.priority} onChange={event => setTaskForm(current => ({ ...current, priority: event.target.value }))}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label></div><label className="ci-field"><span>Details and reason</span><textarea rows="2" maxLength="3000" value={taskForm.details} onChange={event => setTaskForm(current => ({ ...current, details: event.target.value }))} /></label><button className="ci-primary" type="submit">Save task</button></form>
      </section>
    </div>}
  </div>;
}
