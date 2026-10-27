import { useState } from 'react';
import { Camera, History, Pencil, Plus, Sprout } from 'lucide-react';
import ObservationForm from './ObservationForm';
import { cropIntelligenceApi } from '../api';

export default function ObservationsModule({ cycle, onRefresh, onMessage }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [revision, setRevision] = useState(null);
  const observations = cycle.observations || [];
  const openEdit = (item) => { setEditing(item); setFormOpen(true); };

  const showRevision = async (item) => {
    try { const result = await cropIntelligenceApi.revisions(cycle.cycle.id, item.id); setRevision({ id: item.id, items: result.data.revisions }); }
    catch (error) { onMessage?.(error.message); }
  };

  const saved = async () => { setFormOpen(false); setEditing(null); await onRefresh(); };

  return <div className="ci-module-stack">
    <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Manual entry · correction history preserved</span><h2>Daily crop observations</h2></div><button className="ci-primary" onClick={() => { setEditing(null); setFormOpen(value => !value); }}><Plus size={15} />New observation</button></div>
      {formOpen && <ObservationForm cycle={cycle.cycle} observation={editing} onSaved={saved} onCancel={() => { setFormOpen(false); setEditing(null); }} onMessage={onMessage} />}
      {observations.length ? <div className="ci-observation-list">{[...observations].reverse().map(item => <article className="ci-observation-card" key={item.id}><div className="ci-observation-date"><span>{item.observation_date}</span><strong>DAP {item.dap}</strong></div><div className="ci-observation-body"><div className="ci-observation-measurements">{item.plant_height_cm != null && <span><strong>{item.plant_height_cm} cm</strong> height</span>}{item.tiller_count != null && <span><strong>{item.tiller_count}</strong> tillers / {item.measurement_area_m2} m²</span>}{item.establishment_pct != null && <span><strong>{item.establishment_pct}%</strong> establishment</span>}{item.soil_moisture_pct != null && <span><strong>{item.soil_moisture_pct}%</strong> soil moisture</span>}{item.rainfall_mm != null && <span><strong>{item.rainfall_mm} mm</strong> rainfall</span>}{item.leaf_condition && <span><strong>{item.leaf_condition}</strong> leaf condition</span>}</div><p>{[item.leaf_symptoms, item.irrigation_activity, item.pest_symptoms && `Possible pest: ${item.pest_symptoms}`, item.disease_symptoms && `Possible disease: ${item.disease_symptoms}`, item.soil_or_drainage, item.notes].filter(Boolean).join(' · ') || 'No additional notes'}</p><span className="ci-source-pill">{item.source === 'imported' ? 'Imported record' : 'Manual record'}</span>{item.photo_available && <a className="ci-photo-link" href={cropIntelligenceApi.photoUrl(cycle.cycle.id, item.id)} target="_blank" rel="noreferrer"><Camera size={14} />View private photo</a>}</div><div className="ci-observation-actions"><button className="ci-secondary" onClick={() => openEdit(item)}><Pencil size={14} />Correct</button><button className="ci-secondary" onClick={() => showRevision(item)}><History size={14} />History</button></div></article>)}</div> : <div className="ci-empty-state"><Sprout size={22} /><div><strong>No observations recorded</strong><p>Record actual crop measurements or notes. Missed days stay unrecorded.</p></div></div>}
    </section>
    {revision && <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Observation {revision.id}</span><h2>Correction history</h2></div><button className="ci-link-button" onClick={() => setRevision(null)}>Close</button></div>{revision.items.length ? <div className="ci-record-list">{revision.items.map(item => <article key={item.id}><div><strong>{new Date(item.created_at).toLocaleString()}</strong><p>{JSON.stringify(item.snapshot)}</p></div></article>)}</div> : <p className="ci-empty-note">No corrections have been made to this observation.</p>}</section>}
  </div>;
}
