import { useState } from 'react';
import { Archive, Pencil, Plus, RotateCcw, Sprout } from 'lucide-react';
import { cropIntelligenceApi } from '../api';
import { localDateInput } from '../date';

const OTHER_OPTION = '__other__';
const PLANTING_METHODS = [
  ['Furrow planting', 'Furrow planting'],
  ['Trench planting', 'Trench planting'],
  ['Paired-row planting', 'Paired-row planting'],
  ['Pit / ring-pit planting', 'Pit / ring-pit planting'],
  ['Sett planting', 'Sett planting'],
  ['Single-bud sett planting', 'Single-bud sett planting'],
  ['Bud-chip seedling planting', 'Bud-chip seedling planting'],
];
const PLANTING_SEASONS = [
  ['Adsali', 'Adsali'], ['Pre-seasonal', 'Pre-seasonal'], ['Suru', 'Suru'],
  ['Late Suru', 'Late Suru'], ['Autumn', 'Autumn'], ['Spring', 'Spring'],
  ['Monsoon / Kharif', 'Monsoon / Kharif'],
];
const EMPTY_FORM = { field_id: '', planting_date: '', variety_code: '', planting_system: '', planting_system_custom: '', season: '', season_custom: '', notes: '' };

export default function CycleChooser({ cycles, fields, varieties, selectedCycleId, onSelect, onCreated, onUpdated, onArchived, onRestored, onMessage }) {
  const [formMode, setFormMode] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const selectedCycle = cycles.find(item => String(item.cycle.id) === String(selectedCycleId));
  const selectedField = fields.find(item => String(item.id) === String(form.field_id));

  const chooseField = (fieldId) => {
    const field = fields.find(item => String(item.id) === String(fieldId));
    setForm(current => ({ ...current, field_id: fieldId, planting_date: field?.planting_date || current.planting_date, variety_code: field?.variety_code || current.variety_code }));
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setFormMode(formMode === 'create' ? null : 'create');
  };

  const openEdit = () => {
    if (!selectedCycle) return;
    const item = selectedCycle.cycle;
    const methodKnown = PLANTING_METHODS.some(([value]) => value === item.planting_system);
    const seasonKnown = PLANTING_SEASONS.some(([value]) => value === item.season);
    setForm({
      ...EMPTY_FORM,
      field_id: String(item.field_id),
      planting_date: item.planting_date,
      variety_code: item.variety_code,
      planting_system: item.planting_system ? (methodKnown ? item.planting_system : OTHER_OPTION) : '',
      planting_system_custom: methodKnown ? '' : (item.planting_system || ''),
      season: item.season ? (seasonKnown ? item.season : OTHER_OPTION) : '',
      season_custom: seasonKnown ? '' : (item.season || ''),
      notes: item.notes || '',
    });
    setFormMode('edit');
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...(formMode === 'create' ? { field_id: Number(form.field_id) } : {}),
        planting_date: form.planting_date,
        variety_code: form.variety_code,
        planting_system: form.planting_system === OTHER_OPTION ? form.planting_system_custom.trim() : form.planting_system,
        season: form.season === OTHER_OPTION ? form.season_custom.trim() : form.season,
        notes: form.notes,
      };
      if (formMode === 'create') {
        const result = await cropIntelligenceApi.createCycle(payload);
        setFormMode(null);
        await onCreated?.(result.data);
      } else {
        const result = await cropIntelligenceApi.updateCycle(selectedCycle.cycle.id, payload);
        setFormMode(null);
        await onUpdated?.(result.data);
        onMessage?.('Monitoring cycle updated. Existing observations and history remain saved.');
      }
    } catch (error) {
      onMessage?.(error.message);
    } finally { setBusy(false); }
  };

  const archive = async () => {
    if (!selectedCycle || !window.confirm(`Delete the active monitoring cycle for ${selectedCycle.cycle.field_name}? It will be archived so its observations, reports, and task history remain recoverable.`)) return;
    setBusy(true);
    try {
      const result = await cropIntelligenceApi.archiveCycle(selectedCycle.cycle.id);
      setFormMode(null);
      await onArchived?.(String(selectedCycle.cycle.id), result.data);
      onMessage?.('Monitoring cycle archived. Its crop history is preserved.');
    } catch (error) { onMessage?.(error.message); }
    finally { setBusy(false); }
  };

  const restore = async () => {
    if (!selectedCycle) return;
    setBusy(true);
    try {
      const result = await cropIntelligenceApi.updateCycle(selectedCycle.cycle.id, { status: 'active' });
      await onRestored?.(result.data);
      onMessage?.('Monitoring cycle restored.');
    } catch (error) { onMessage?.(error.message); }
    finally { setBusy(false); }
  };

  const editing = formMode === 'edit';
  return (
    <section className="ci-cycle-bar">
      <div className="ci-cycle-select-wrap"><Sprout size={19} /><label htmlFor="ci-cycle-select">Monitoring crop</label><select id="ci-cycle-select" value={selectedCycleId || ''} onChange={event => { setFormMode(null); onSelect(event.target.value); }}><option value="">Choose crop cycle</option>{cycles.map(item => <option key={item.cycle.id} value={item.cycle.id}>{item.cycle.status === 'archived' ? '[Archived] ' : ''}{item.cycle.farm_name} · {item.cycle.field_name} · {item.cycle.variety_code} · planted {item.cycle.planting_date}</option>)}</select></div>
      <div className="ci-cycle-actions">
        {selectedCycle?.cycle.status === 'active' && <button type="button" className="ci-secondary" onClick={openEdit} disabled={busy}><Pencil size={15} />Edit cycle</button>}
        {selectedCycle?.cycle.status === 'active' && <button type="button" className="ci-secondary" onClick={archive} disabled={busy}><Archive size={15} />Delete cycle</button>}
        {selectedCycle?.cycle.status === 'archived' && <button type="button" className="ci-secondary" onClick={restore} disabled={busy}><RotateCcw size={15} />Restore cycle</button>}
        <button type="button" className="ci-secondary" onClick={openCreate} disabled={busy}><Plus size={16} />Start crop cycle</button>
      </div>
      {formMode && <form className="ci-cycle-create" onSubmit={save}>
        <div className="ci-cycle-form-heading"><strong>{editing ? `Edit cycle · ${selectedCycle?.cycle.field_name}` : 'Create a monitoring cycle'}</strong>{editing && <span className="ci-field-help">Farm field stays linked to preserve this crop’s history.</span>}</div>
        {!editing && <label className="ci-field"><span>Farm field</span><select required value={form.field_id} onChange={event => chooseField(event.target.value)}><option value="">Choose a field</option>{fields.map(field => <option key={field.id} value={field.id}>{field.farm_name} · {field.name}</option>)}</select></label>}
        <label className="ci-field"><span>Planting date</span><input required type="date" max={localDateInput()} value={form.planting_date} onChange={event => setForm(current => ({ ...current, planting_date: event.target.value }))} /></label>
        <label className="ci-field"><span>Variety</span><select required value={form.variety_code} onChange={event => setForm(current => ({ ...current, variety_code: event.target.value }))}><option value="">Choose variety</option>{varieties.map(item => <option key={item.code} value={item.code}>{item.code}</option>)}{selectedField?.variety_code && !varieties.some(item => item.code === selectedField.variety_code) && <option value={selectedField.variety_code}>{selectedField.variety_code}</option>}</select></label>
        <label className="ci-field"><span>Planting method <small>(optional)</small></span><select value={form.planting_system} onChange={event => setForm(current => ({ ...current, planting_system: event.target.value }))}><option value="">Choose a method</option>{PLANTING_METHODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}<option value={OTHER_OPTION}>Other / local method</option></select></label>
        {form.planting_system === OTHER_OPTION && <label className="ci-field"><span>Local planting method</span><input required maxLength="80" placeholder="Enter the method used in your area" value={form.planting_system_custom} onChange={event => setForm(current => ({ ...current, planting_system_custom: event.target.value }))} /></label>}
        <label className="ci-field"><span>Planting season <small>(optional)</small></span><select value={form.season} onChange={event => setForm(current => ({ ...current, season: event.target.value }))}><option value="">Choose a season</option>{PLANTING_SEASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}<option value={OTHER_OPTION}>Other / local season</option></select><small className="ci-field-help">Season names and timing vary by region; selection records your cycle details but does not confirm local suitability.</small></label>
        {form.season === OTHER_OPTION && <label className="ci-field"><span>Local season name</span><input required maxLength="80" placeholder="Enter the local season name" value={form.season_custom} onChange={event => setForm(current => ({ ...current, season_custom: event.target.value }))} /></label>}
        <label className="ci-field ci-field-wide"><span>Notes <small>(optional)</small></span><textarea rows="2" maxLength="2000" value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} /></label>
        <div className="ci-cycle-form-actions"><button type="button" className="ci-secondary" onClick={() => setFormMode(null)} disabled={busy}>Cancel</button><button className="ci-primary" disabled={busy || (!editing && !fields.length)} type="submit">{busy ? 'Saving…' : editing ? 'Save cycle changes' : 'Create monitoring cycle'}</button></div>
      </form>}
      {!fields.length && formMode === 'create' && <p className="ci-empty-note">Add a farm field before starting a crop monitoring cycle.</p>}
    </section>
  );
}
