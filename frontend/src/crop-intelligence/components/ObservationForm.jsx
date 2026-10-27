import { useEffect, useState } from 'react';
import { Camera, Save } from 'lucide-react';
import { cropIntelligenceApi } from '../api';
import { localDateInput } from '../date';

const blank = (dateValue) => ({
  observation_date: dateValue || localDateInput(),
  plant_height_cm: '', tiller_count: '', measurement_area_m2: '', establishment_pct: '',
  leaf_condition: '', leaf_symptoms: '', soil_moisture_pct: '', rainfall_mm: '',
  irrigation_activity: '', pest_symptoms: '', disease_symptoms: '', soil_or_drainage: '', notes: '',
});

const fields = [
  ['plant_height_cm', 'Plant height', 'number', 'cm'],
  ['tiller_count', 'Tiller count', 'number', 'count'],
  ['measurement_area_m2', 'Counted area', 'number', 'm²'],
  ['establishment_pct', 'Establishment', 'number', '%'],
  ['soil_moisture_pct', 'Soil moisture', 'number', '%'],
  ['rainfall_mm', 'Rainfall', 'number', 'mm'],
];

export default function ObservationForm({ cycle, initialDate, observation, onSaved, onCancel, onMessage }) {
  const [form, setForm] = useState(blank(initialDate));
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!observation) { setForm(blank(initialDate)); return; }
    const values = blank(observation.observation_date);
    for (const key of Object.keys(values)) values[key] = observation[key] ?? '';
    setForm(values);
  }, [observation, initialDate]);

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const payload = { ...form };
    for (const key of fields.map(([name]) => name)) payload[key] = payload[key] === '' ? null : Number(payload[key]);
    try {
      const result = observation
        ? await cropIntelligenceApi.correctObservation(cycle.id, observation.id, payload)
        : await cropIntelligenceApi.addObservation(cycle.id, payload);
      const saved = result.data?.observation;
      if (photo && saved?.id) await cropIntelligenceApi.uploadPhoto(cycle.id, saved.id, photo);
      onMessage?.(observation ? 'Observation corrected and history preserved.' : 'Observation saved.');
      setPhoto(null);
      await onSaved?.();
    } catch (error) {
      onMessage?.(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="ci-form" onSubmit={submit}>
      <div className="ci-form-heading">
        <div><h3>{observation ? 'Correct observation' : 'Record crop observation'}</h3><p>Only record measurements you actually collected. DAP is calculated from the planting date.</p></div>
      </div>
      <label className="ci-field"><span>Observation date</span><input type="date" required min={cycle.planting_date} max={localDateInput()} value={form.observation_date} onChange={event => set('observation_date', event.target.value)} /></label>
      <div className="ci-measure-grid">
        {fields.map(([key, label, type, unit]) => <label className="ci-field" key={key}><span>{label} <small>({unit})</small></span><input type={type} min="0" step={key === 'tiller_count' ? '1' : 'any'} value={form[key]} onChange={event => set(key, event.target.value)} /></label>)}
      </div>
      <label className="ci-field"><span>Leaf condition</span><select value={form.leaf_condition} onChange={event => set('leaf_condition', event.target.value)}><option value="">Not observed</option><option value="normal">No visible concern</option><option value="yellowing">Yellowing</option><option value="drying">Drying</option><option value="curling">Curling</option><option value="discoloration">Other discoloration</option><option value="wilting">Wilting</option><option value="other">Other</option></select></label>
      {[
        ['leaf_symptoms', 'Leaf symptoms and affected leaves'], ['irrigation_activity', 'Irrigation activity'],
        ['pest_symptoms', 'Possible pest symptoms'], ['disease_symptoms', 'Possible disease symptoms'],
        ['soil_or_drainage', 'Soil and drainage observations'], ['notes', 'Farmer notes'],
      ].map(([key, label]) => <label className="ci-field" key={key}><span>{label}</span><textarea rows="2" maxLength="4000" value={form[key]} onChange={event => set(key, event.target.value)} /></label>)}
      <label className="ci-photo-input"><Camera size={16} /><span>{photo?.name || (observation?.photo_available ? 'Photo already recorded' : 'Attach an optional field photo')}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setPhoto(event.target.files?.[0] || null)} /></label>
      <div className="ci-form-actions"><button className="ci-primary" disabled={busy} type="submit"><Save size={16} />{busy ? 'Saving…' : 'Save observation'}</button>{onCancel && <button type="button" className="ci-secondary" onClick={onCancel}>Cancel</button>}</div>
    </form>
  );
}
