import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, SearchCheck } from 'lucide-react';
import { cropIntelligenceApi } from '../api';

export default function AlertsModule({ cycle, onRefresh, onMessage }) {
  const [filter, setFilter] = useState('open');
  const [busyId, setBusyId] = useState(null);
  const all = cycle.alerts || [];
  const alerts = all.filter(item => filter === 'all' || (filter === 'open' ? !['resolved', 'unconfirmed'].includes(item.status) : item.status === filter));

  const update = async (alert, status) => {
    setBusyId(alert.id);
    try {
      await cropIntelligenceApi.updateAlert(cycle.cycle.id, alert.id, { status, note: status === 'resolved' ? 'Follow-up recorded by farmer.' : '' });
      onMessage?.(`Alert marked ${status}.`);
      await onRefresh();
    } catch (error) { onMessage?.(error.message); }
    finally { setBusyId(null); }
  };

  return <div className="ci-module-stack">
    <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Rule-based prompts from saved evidence</span><h2>Crop abnormalities and follow-up</h2></div><AlertTriangle size={20} /></div><p className="ci-assessment-copy">A warning is a prompt to investigate, not a confirmed diagnosis. Missing measurements appear as data-quality reminders and do not create abnormality alerts.</p>
      <div className="ci-alert-filters">{[['open', 'Open'], ['new', 'New'], ['acknowledged', 'Acknowledged'], ['monitoring', 'Monitoring'], ['resolved', 'Resolved'], ['all', 'All history']].map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}{value === 'open' ? ` (${all.filter(item => !['resolved', 'unconfirmed'].includes(item.status)).length})` : ''}</button>)}</div>
      {alerts.length ? <div className="ci-alert-list">{alerts.map(alert => {
        const mitigation = alert.mitigation && !Array.isArray(alert.mitigation) ? alert.mitigation : {};
        return <article className={`ci-alert-card severity-${alert.severity}`} key={alert.id}><div className="ci-alert-heading"><span className="ci-alert-icon"><AlertTriangle size={18} /></span><div><span className="ci-alert-meta">{alert.severity} · {alert.status} · {alert.observation_date} · DAP {alert.dap || '—'}</span><h3>{alert.indicator}</h3><p>{alert.evidence}</p></div><span className="ci-alert-variety">{cycle.cycle.variety_code}</span></div>
          {alert.observed_value && <p className="ci-alert-reference"><strong>Observed:</strong> {alert.observed_value} {alert.reference_value && <><span> · </span><strong>Reference/rule:</strong> {alert.reference_value}</>}</p>}
          <div className="ci-two-col ci-alert-detail-grid"><div><strong>Possible explanations</strong><ul>{alert.possible_explanations?.map((item, index) => <li key={index}>{item}</li>)}</ul><strong>Check first</strong><ul>{alert.investigate?.map((item, index) => <li key={index}>{item}</li>)}</ul></div><div><strong>Low-risk next steps</strong><ul>{mitigation.actions?.map((item, index) => <li key={index}>{item}</li>)}</ul>{mitigation.avoid?.length > 0 && <><strong>Avoid</strong><ul>{mitigation.avoid.map((item, index) => <li key={index}>{item}</li>)}</ul></>}{mitigation.expert_help && <p className="ci-expert-help">{mitigation.expert_help}</p>}<small>Follow-up: {alert.follow_up_date || 'review after collecting evidence'}</small></div></div>
          {alert.resolution_notes && <p className="ci-data-notice"><strong>Resolution note:</strong> {alert.resolution_notes}</p>}
          {alert.status !== 'resolved' && alert.status !== 'unconfirmed' && <div className="ci-form-actions"><button disabled={busyId === alert.id} className="ci-secondary" onClick={() => update(alert, 'acknowledged')}><SearchCheck size={15} />Acknowledge</button><button disabled={busyId === alert.id} className="ci-secondary" onClick={() => update(alert, 'monitoring')}><Clock3 size={15} />Monitor</button><button disabled={busyId === alert.id} className="ci-primary" onClick={() => update(alert, 'resolved')}><CheckCircle2 size={15} />Resolve</button></div>}
        </article>;
      })}</div> : <div className="ci-empty-state"><CheckCircle2 size={22} /><div><strong>{filter === 'open' ? 'No unresolved alerts' : 'No alerts in this view'}</strong><p>When a farmer records symptoms or a sourced reference comparison falls outside its range, the system will show its evidence and investigation steps here.</p></div></div>}
    </section>
  </div>;
}
