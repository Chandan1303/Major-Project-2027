import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, ExternalLink, MapPin, Search, Sprout } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useField } from '../context/FieldContext';
import { geographyApi, varietyApi } from '../services/api';
import { cropIntelligenceApi } from '../crop-intelligence/api';

const textList = value => Array.isArray(value) ? value : typeof value === 'string' ? value.split(',').map(item => item.trim()).filter(Boolean) : [];
const hasGuideValue = value => Boolean(value) && !/unavailable|not listed|not available/i.test(String(value));
const regionStatus = (item, state) => {
  const states = textList(item.states || item.recommended_states).map(value => value.toLocaleLowerCase());
  if (!state) return 'Select a state to check whether this variety appears in the app’s regional recommendations.';
  const selected = state.toLocaleLowerCase();
  if (states.includes(selected)) return `Listed for ${state} in the app’s variety dataset.`;
  const subregion = states.find(value => value.includes(selected));
  if (subregion) return `Listed only for ${subregion} in the app’s dataset. Confirm district-level suitability for ${state}.`;
  return `Not listed for ${state} in the app’s variety dataset; verify the current state and mill recommendation before planting.`;
};

export default function VarietyGrowingGuidePage() {
  const { selectedField, selectedFarm } = useField();
  const [varieties, setVarieties] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedCode, setSelectedCode] = useState(selectedField?.sugarcane_variety || '');
  const [state, setState] = useState(selectedFarm?.state || '');
  const [stateVarietyCodes, setStateVarietyCodes] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    Promise.all([varietyApi.list(), cropIntelligenceApi.varieties()])
      .then(([varietyResponse, profileResponse]) => {
        if (!live) return;
        setVarieties(varietyResponse.data?.varieties || []);
        setProfiles(profileResponse.data?.varieties || []);
      })
      .catch(problem => { if (live) setError(problem.message || 'Could not load the variety dataset.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (selectedField?.sugarcane_variety) setSelectedCode(selectedField.sugarcane_variety);
    if (selectedFarm?.state) setState(selectedFarm.state);
  }, [selectedField?.id, selectedFarm?.id]);

  useEffect(() => {
    let live = true;
    if (!state) {
      setStateVarietyCodes(null);
      return () => { live = false; };
    }
    geographyApi.getVarieties(state)
      .then(response => { if (live) setStateVarietyCodes(response.data?.varieties || []); })
      .catch(() => { if (live) setStateVarietyCodes([]); });
    return () => { live = false; };
  }, [state]);

  const stateOptions = useMemo(() => [...new Set(varieties.flatMap(item => textList(item.states || item.recommended_states)))].sort(), [varieties]);
  const regionalVarieties = state
    ? stateVarietyCodes
      ? stateVarietyCodes.map(code => varieties.find(item => (item.variety_code || item.code || '').toLocaleLowerCase() === code.toLocaleLowerCase()) || {
        code,
        name: code,
        description: profiles.find(profile => (profile.code || profile.official_identifier || '').toLocaleLowerCase() === code.toLocaleLowerCase())?.regions || `Listed in the app’s ${state} recommendations. Variety-specific agronomy details are limited in the available dataset.`,
        states: [state],
      })
      : varieties.filter(item => textList(item.states || item.recommended_states).some(value => value.toLocaleLowerCase() === state.toLocaleLowerCase()))
    : varieties;
  const filteredVarieties = regionalVarieties.filter(item => (item.variety_code || item.code || item.name || '').toLowerCase().includes(search.toLowerCase()));
  const selectedVariety = filteredVarieties.find(item => (item.variety_code || item.code) === selectedCode) || filteredVarieties[0];
  const selectedProfile = profiles.find(item => (item.code || item.official_identifier) === (selectedVariety?.variety_code || selectedVariety?.code));
  const code = selectedVariety?.variety_code || selectedVariety?.code || '';
  const maturityAndDuration = [
    selectedProfile?.maturity || selectedVariety?.maturity || selectedVariety?.maturity_type,
    selectedProfile?.duration || selectedVariety?.duration || selectedVariety?.duration_months,
  ].filter(hasGuideValue).join(' · ');
  const conditions = [
    ['Soil and drainage', selectedProfile?.soil_suitability || selectedVariety?.soil_suitability],
    ['Climate and weather', selectedProfile?.weather_suitability || selectedVariety?.weather_suitability],
    ['Growth habit', selectedProfile?.morphology || selectedVariety?.growth_characteristics],
    ['Water and nutrients', selectedProfile?.water_nutrients],
    ['Planting system', selectedProfile?.planting_systems],
    ['Planting season', selectedProfile?.seasons],
    ['Maturity and duration', maturityAndDuration],
    ['Disease considerations', selectedProfile?.pest_disease || selectedVariety?.disease_resistance],
    ['Drought response', selectedProfile?.drought_tolerance || selectedVariety?.drought_tolerance],
    ['Dataset yield range', selectedProfile?.yield_range || selectedVariety?.expected_yield_range || (selectedVariety?.expected_yield_min != null ? `${selectedVariety.expected_yield_min}–${selectedVariety.expected_yield_max} t/ha` : null)],
  ].filter(([, value]) => hasGuideValue(value));

  const origin = selectedProfile?.origin || selectedVariety?.origin;
  const yieldRange = selectedProfile?.yield_range || selectedVariety?.expected_yield_range || (selectedVariety?.expected_yield_min != null ? `${selectedVariety.expected_yield_min}–${selectedVariety.expected_yield_max} t/ha` : null);
  const sucrose = selectedProfile?.sucrose_recovery || (selectedVariety?.sucrose_pct || selectedVariety?.sucrose ? `${selectedVariety.sucrose_pct || selectedVariety.sucrose}%` : null);

  return <AppLayout><div className="page-container guide-page">
    <header className="page-header"><div><p className="eyebrow">Crop and region reference</p><h1 className="page-title">Variety Growing Guide</h1><p className="page-subtitle">Review recorded soil, climate, planting, maturity, and risk information for each sugarcane variety.</p></div><span className="guide-dataset-badge"><BookOpen size={15} /> Existing variety dataset</span></header>

    <section className="guide-context-bar"><div className="guide-context-icon"><MapPin size={18} /></div><div><strong>Check fit for your growing region</strong><span>Regional recommendations are an initial filter. They don’t replace seed availability, local mill acceptance, or KVK / agriculture department advice.</span></div><label>State<select value={state} onChange={event => setState(event.target.value)}><option value="">Choose state</option>{stateOptions.map(item => <option key={item} value={item}>{item}</option>)}</select></label></section>

    {loading ? <div className="guide-loading">Loading the variety dataset…</div> : error ? <div className="guide-error"><AlertTriangle size={18} />{error}</div> : !varieties.length ? <div className="guide-empty">No variety records are available.</div> : state && regionalVarieties.length === 0 ? <div className="guide-empty">No varieties in the app dataset are listed for {state}. Verify local recommendations before planting.</div> : <div className="guide-layout">
      <aside className="guide-list-panel"><label className="guide-search"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search varieties" /></label><div className="guide-variety-list">{filteredVarieties.map(item => { const itemCode = item.variety_code || item.code; const active = itemCode === code; const profile = profiles.find(value => (value.code || value.official_identifier) === itemCode); const maturity = profile?.maturity || item.maturity || item.maturity_type; const duration = profile?.duration_short || item.duration || item.duration_months; const maturityLabel = [maturity, duration].filter(hasGuideValue).join(' · '); return <button key={itemCode} className={`guide-variety-option ${active ? 'active' : ''}`} onClick={() => setSelectedCode(itemCode)}><span className="guide-variety-mark"><Sprout size={17} /></span><span><strong>{itemCode}</strong>{maturityLabel && <small>{maturityLabel}</small>}</span>{active && <CheckCircle2 size={17} />}</button>; })}</div></aside>

      {selectedVariety && <main className="guide-detail-panel"><div className="guide-detail-head"><div><span className="guide-eyebrow">Variety profile</span><h2>{selectedVariety.name || code}</h2><p>{selectedProfile?.regions || selectedVariety.description || `Agronomy details recorded for ${code}.`}</p></div><div className={`guide-region-status ${textList(selectedVariety.states || selectedVariety.recommended_states).some(value => value.toLowerCase() === state.toLowerCase()) ? 'listed' : ''}`}>{textList(selectedVariety.states || selectedVariety.recommended_states).some(value => value.toLowerCase() === state.toLowerCase()) ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}{regionStatus(selectedVariety, state)}</div></div>

        <div className="guide-summary-grid">{hasGuideValue(origin) && <article><small>Origin</small><strong>{origin}</strong></article>}{hasGuideValue(yieldRange) && <article><small>Reported yield</small><strong>{yieldRange}</strong><span>Regional or season-specific reference; not a guarantee.</span></article>}{hasGuideValue(sucrose) && <article><small>Sucrose / recovery</small><strong>{sucrose}</strong><span>Variety sucrose content and factory recovery are different measures.</span></article>}</div>

        <div className="guide-conditions-grid">{conditions.map(([label, value]) => <article key={label} className="guide-condition-card"><span>{label}</span><p>{value}</p></article>)}</div>

        {selectedProfile?.growth_reference_ranges?.length > 0 && <section className="guide-reference-panel"><h3>Published growth observations</h3><p>These are source-specific observations. Their study conditions and measurement method matter; do not interpret them as universal targets.</p>{selectedProfile.growth_reference_ranges.map((range, index) => <article key={`${range.metric}-${index}`}><strong>{range.metric.replaceAll('_', ' ')} · DAP {range.start_day}{range.end_day !== range.start_day ? `–${range.end_day}` : ''}</strong><span>{range.low}–{range.high} {range.unit} · {range.region}</span><small>{range.conditions}</small></article>)}</section>}

        {selectedProfile?.sources?.length > 0 ? <section className="guide-sources"><h3>Sources recorded in the app</h3>{selectedProfile.sources.map((source, index) => <a href={source.url} target="_blank" rel="noreferrer" key={`${source.url}-${index}`}><span><strong>{source.title}</strong><small>{source.organization || 'Source'}{source.year ? ` · ${source.year}` : ''}{source.supports ? ` · ${source.supports}` : ''}</small></span><ExternalLink size={15} /></a>)}</section> : <div className="guide-no-source"><AlertTriangle size={16} /><span>No source links are stored for this variety profile. Treat the agronomy fields as app dataset information and verify them locally before making planting decisions.</span></div>}
      </main>}
    </div>}
  </div></AppLayout>;
}
