import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Save } from 'lucide-react';
import { cropIntelligenceApi } from '../api';

const profileSections = [
  ['official_identifier', 'Official identifier'], ['regions', 'Regions and limitations'], ['planting_systems', 'Planting systems'], ['seasons', 'Planting seasons'], ['maturity', 'Maturity guidance'], ['morphology', 'Growth morphology'], ['water_nutrients', 'Water and nutrient information'], ['pest_disease', 'Pest and disease information'],
];

export default function ReferenceModule({ cycle, varieties, stages, user, onRefresh, onMessage }) {
  const [selectedCode, setSelectedCode] = useState(cycle.cycle.variety_code);
  const [selectedStage, setSelectedStage] = useState(stages[0]?.key || '');
  const [mode, setMode] = useState('variety');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const profile = useMemo(() => varieties.find(item => item.code === selectedCode), [varieties, selectedCode]);
  const activeStage = stages.find(item => item.key === selectedStage);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const content = mode === 'variety' ? profile : mode === 'stage' ? activeStage : null;
    if (mode === 'mitigation') cropIntelligenceApi.mitigations().then(result => setDraft(JSON.stringify(result.data.strategies || {}, null, 2))).catch(error => onMessage?.(error.message));
    else setDraft(JSON.stringify(content || {}, null, 2));
  }, [mode, profile, activeStage]);

  const save = async () => {
    try {
      const parsed = JSON.parse(draft);
      setBusy(true);
      if (mode === 'variety') await cropIntelligenceApi.saveVariety(selectedCode, parsed);
      else if (mode === 'stage') await cropIntelligenceApi.saveStage(selectedStage, parsed);
      else {
        await Promise.all(Object.entries(parsed).map(([key, value]) => cropIntelligenceApi.saveMitigation(key, value)));
      }
      onMessage?.('Reference configuration saved.');
      await onRefresh();
    } catch (error) { onMessage?.(error.message.includes('JSON') ? `Check the JSON format: ${error.message}` : error.message); }
    finally { setBusy(false); }
  };

  return <div className="ci-module-stack">
    <div className="ci-two-col ci-reference-layout">
      <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Variety-specific data with explicit source limits</span><h2>My sugarcane variety</h2></div><BookOpen size={20} /></div><label className="ci-field"><span>Selected variety</span><select value={selectedCode} onChange={event => setSelectedCode(event.target.value)}>{varieties.map(item => <option key={item.code} value={item.code}>{item.code}</option>)}</select></label>
        {profile && <div className="ci-profile-facts">{profileSections.map(([key, label]) => <article key={key}><strong>{label}</strong><p>{profile[key] || 'Variety-specific reference data unavailable.'}</p></article>)}</div>}
        <div className="ci-data-notice"><strong>How reference comparisons work</strong><p>Numeric comparisons are enabled only when an administrator configures a variety, crop-age, region, method, and source-matched range. No generic height or tiller targets are substituted.</p></div>
        {profile?.sources?.length > 0 && <div className="ci-source-list"><strong>Recorded sources</strong>{profile.sources.map((source, index) => <article key={`${source.title}-${index}`}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a><p>{source.organization} · {source.year} · {source.region}</p><small>{source.supports}</small></article>)}</div>}
      </section>
      <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Configurable rule sources</span><h2>Growth planning and guidance</h2></div></div><div className="ci-data-notice"><strong>General stage planning</strong><p>Each stage includes observations and follow-up activities. They are planning prompts, not verified variety-specific biological thresholds or fixed fertilizer/irrigation prescriptions.</p><a href="https://icar.gov.in/en/icar-kharif-agro-advisories-farmers-2025-1" target="_blank" rel="noreferrer">ICAR Kharif Agro-Advisories 2025 ↗</a></div><div className="ci-data-notice"><strong>Mitigation rules</strong><p>Symptom reports create investigation prompts with possible causes. The system does not diagnose disease from a single symptom or photo and does not prescribe pesticides.</p></div></section>
    </div>
    {isAdmin && <section className="ci-panel ci-admin-reference"><div className="ci-section-heading"><div><span className="ci-eyebrow">Administrator only</span><h2>Edit reference configuration</h2></div></div><div className="ci-measure-grid"><label className="ci-field"><span>Configuration type</span><select value={mode} onChange={event => setMode(event.target.value)}><option value="variety">Variety profile</option><option value="stage">Growth stage</option><option value="mitigation">Mitigation knowledge base</option></select></label>{mode === 'variety' && <label className="ci-field"><span>Variety</span><select value={selectedCode} onChange={event => setSelectedCode(event.target.value)}>{varieties.map(item => <option key={item.code}>{item.code}</option>)}</select></label>}{mode === 'stage' && <label className="ci-field"><span>Growth stage</span><select value={selectedStage} onChange={event => setSelectedStage(event.target.value)}>{stages.map(item => <option key={item.key} value={item.key}>{item.name}</option>)}</select></label>}</div><label className="ci-field"><span>JSON reference data</span><textarea className="ci-json-editor" spellCheck="false" rows="18" value={draft} onChange={event => setDraft(event.target.value)} /></label><button className="ci-primary" disabled={busy} onClick={save}><Save size={15} />{busy ? 'Saving…' : 'Save configuration'}</button></section>}
  </div>;
}
