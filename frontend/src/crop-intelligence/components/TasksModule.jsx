import { useEffect, useState } from 'react';
import { Check, ClipboardList, Droplets, Plus } from 'lucide-react';
import { cropIntelligenceApi } from '../api';
import { localDateInput } from '../date';

const today = localDateInput;

export default function TasksModule({ cycle, onRefresh, onMessage }) {
  const [activities, setActivities] = useState([]);
  const [taskForm, setTaskForm] = useState({ title: '', due_date: today(), category: 'scouting', priority: 'normal', details: '' });
  const [activityForm, setActivityForm] = useState({ activity_date: today(), activity_type: 'irrigation', details: '', amount: '', amount_unit: '' });
  const [saving, setSaving] = useState(false);

  const loadActivities = async () => {
    try { const result = await cropIntelligenceApi.activities(cycle.cycle.id); setActivities(result.data.activities || []); }
    catch (error) { onMessage?.(error.message); }
  };
  useEffect(() => { loadActivities(); }, [cycle.cycle.id]);

  const saveTask = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const result = await cropIntelligenceApi.addTask(cycle.cycle.id, taskForm);
      onMessage?.(result.data.duplicate ? 'This task already exists; no duplicate was added.' : 'Task scheduled.');
      setTaskForm(current => ({ ...current, title: '', details: '' })); await onRefresh();
    } catch (error) { onMessage?.(error.message); } finally { setSaving(false); }
  };

  const saveActivity = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      await cropIntelligenceApi.addActivity(cycle.cycle.id, { ...activityForm, amount: activityForm.amount === '' ? null : Number(activityForm.amount) });
      onMessage?.('Farming activity recorded.');
      setActivityForm(current => ({ ...current, details: '', amount: '' })); await loadActivities();
    } catch (error) { onMessage?.(error.message); } finally { setSaving(false); }
  };

  const setStatus = async (task, status) => {
    try { await cropIntelligenceApi.updateTask(cycle.cycle.id, task.id, { status }); onMessage?.('Task status updated.'); await onRefresh(); }
    catch (error) { onMessage?.(error.message); }
  };

  return <div className="ci-module-stack">
    <div className="ci-two-col">
      <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Daily and weekly follow-ups</span><h2>Farming tasks</h2></div><ClipboardList size={20} /></div>
        <form className="ci-form" onSubmit={saveTask}><label className="ci-field"><span>Task name</span><input required maxLength="180" value={taskForm.title} onChange={event => setTaskForm(current => ({ ...current, title: event.target.value }))} placeholder="What needs follow-up?" /></label><div className="ci-measure-grid"><label className="ci-field"><span>Due date</span><input type="date" required value={taskForm.due_date} onChange={event => setTaskForm(current => ({ ...current, due_date: event.target.value }))} /></label><label className="ci-field"><span>Category</span><select value={taskForm.category} onChange={event => setTaskForm(current => ({ ...current, category: event.target.value }))}>{['irrigation', 'nutrition', 'weeds', 'pest_disease', 'soil', 'scouting', 'assessment', 'other'].map(item => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select></label></div><label className="ci-field"><span>Why / details</span><textarea rows="2" maxLength="3000" value={taskForm.details} onChange={event => setTaskForm(current => ({ ...current, details: event.target.value }))} /></label><label className="ci-field"><span>Priority</span><select value={taskForm.priority} onChange={event => setTaskForm(current => ({ ...current, priority: event.target.value }))}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label><button className="ci-primary" disabled={saving} type="submit"><Plus size={15} />Save task</button></form>
      </section>
      <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Record what happened</span><h2>Irrigation and farm activity</h2></div><Droplets size={19} /></div>
        <form className="ci-form" onSubmit={saveActivity}><label className="ci-field"><span>Activity date</span><input type="date" min={cycle.cycle.planting_date} max={today()} required value={activityForm.activity_date} onChange={event => setActivityForm(current => ({ ...current, activity_date: event.target.value }))} /></label><label className="ci-field"><span>Activity type</span><select value={activityForm.activity_type} onChange={event => setActivityForm(current => ({ ...current, activity_type: event.target.value }))}>{['irrigation', 'nutrition', 'weeding', 'scouting', 'soil', 'pest_disease', 'other'].map(item => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select></label><label className="ci-field"><span>What was done / observed</span><textarea required rows="3" maxLength="3000" value={activityForm.details} onChange={event => setActivityForm(current => ({ ...current, details: event.target.value }))} /></label><div className="ci-measure-grid"><label className="ci-field"><span>Amount <small>(optional)</small></span><input type="number" min="0" step="any" value={activityForm.amount} onChange={event => setActivityForm(current => ({ ...current, amount: event.target.value }))} /></label><label className="ci-field"><span>Unit <small>(optional)</small></span><input maxLength="32" placeholder="as recorded" value={activityForm.amount_unit} onChange={event => setActivityForm(current => ({ ...current, amount_unit: event.target.value }))} /></label></div><button className="ci-primary" disabled={saving} type="submit">Record activity</button></form>
      </section>
    </div>
    <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Persisted task history</span><h2>Tasks for this crop</h2></div><span className="ci-source-pill">{cycle.tasks?.length || 0} tasks</span></div>{cycle.tasks?.length ? <div className="ci-task-list">{cycle.tasks.map(task => <article key={task.id} className={task.status === 'completed' ? 'completed' : ''}><div className="ci-task-check">{task.status === 'completed' ? <Check size={16} /> : <span />}</div><div className="ci-task-copy"><strong>{task.title}</strong><p>{task.due_date} · {task.category.replace('_', ' ')} · {task.priority} · {task.details || 'No details added'}</p></div><select aria-label={`Status for ${task.title}`} value={task.status} onChange={event => setStatus(task, event.target.value)}><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></article>)}</div> : <p className="ci-empty-note">No tasks are scheduled. Add follow-up work when it is appropriate for this field.</p>}</section>
    <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Farmer-recorded management history</span><h2>Irrigation and farm activities</h2></div></div>{activities.length ? <div className="ci-record-list">{activities.map(item => <article key={item.id}><div><strong>{item.activity_date} · {item.activity_type.replace('_', ' ')}</strong><p>{item.details}{item.amount != null ? ` · ${item.amount} ${item.amount_unit || ''}` : ''}</p></div></article>)}</div> : <p className="ci-empty-note">No irrigation or farming activity has been recorded for this crop cycle.</p>}</section>
  </div>;
}
