import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Archive, BookOpen, CalendarDays, ChartLine, ClipboardList, FileUp, Home, LoaderCircle, RefreshCw, Sprout } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { cropIntelligenceApi } from './api';
import CycleChooser from './components/CycleChooser';
import CropOverview from './components/CropOverview';
import StageMonitoring from './components/StageMonitoring';
import CalendarModule from './components/CalendarModule';
import ObservationsModule from './components/ObservationsModule';
import ComparisonModule from './components/ComparisonModule';
import AlertsModule from './components/AlertsModule';
import TasksModule from './components/TasksModule';
import ImportReportsModule from './components/ImportReportsModule';
import ReferenceModule from './components/ReferenceModule';
import RecommendationsModule from './components/RecommendationsModule';

const NAV = [
  { key: 'overview', label: 'Crop overview', icon: Home },
  { key: 'stages', label: 'Stage monitoring', icon: Sprout },
  { key: 'calendar', label: 'Growth calendar', icon: CalendarDays },
  { key: 'observations', label: 'Crop observations', icon: Activity },
  { key: 'comparison', label: 'Growth comparison', icon: ChartLine },
  { key: 'alerts', label: 'Abnormality alerts', icon: AlertTriangle },
  { key: 'recommendations', label: 'Mitigation guidance', icon: ClipboardList },
  { key: 'tasks', label: 'Farming tasks', icon: ClipboardList },
  { key: 'imports', label: 'Upload and reports', icon: FileUp },
  { key: 'references', label: 'Variety references', icon: BookOpen },
];

export default function CropIntelligencePage() {
  const { user } = useAuth();
  const [fields, setFields] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [cycle, setCycle] = useState(null);
  const [section, setSection] = useState('overview');
  const [initialStageKey, setInitialStageKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cycleLoading, setCycleLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [problem, setProblem] = useState('');

  const inform = useCallback((text) => setMessage(text), []);

  const loadResources = useCallback(async (keepSelected = true) => {
    setLoading(true);
    setProblem('');
    try {
      const [fieldResult, cycleResult, varietyResult, stageResult] = await Promise.all([
        cropIntelligenceApi.fields(), cropIntelligenceApi.cycles(), cropIntelligenceApi.varieties(), cropIntelligenceApi.stages(),
      ]);
      setFields(fieldResult.data.fields || []);
      const savedCycles = cycleResult.data.cycles || [];
      setCycles(savedCycles);
      setVarieties(varietyResult.data.varieties || []);
      setStages(stageResult.data.stages || []);
      const available = savedCycles.some(item => String(item.cycle.id) === String(selectedId));
      const nextId = keepSelected && available ? String(selectedId) : (savedCycles[0] ? String(savedCycles[0].cycle.id) : '');
      setSelectedId(nextId);
      const next = savedCycles.find(item => String(item.cycle.id) === nextId) || null;
      setCycle(next);
    } catch (error) {
      setProblem(error.message || 'Crop monitoring could not be loaded.');
    } finally { setLoading(false); }
  }, [selectedId]);

  const refreshCycle = useCallback(async () => {
    if (!selectedId) return;
    setCycleLoading(true);
    try {
      const result = await cropIntelligenceApi.cycle(selectedId);
      setCycle(result.data);
      setCycles(current => current.map(item => String(item.cycle.id) === String(selectedId) ? result.data : item));
    } catch (error) { setMessage(error.message); }
    finally { setCycleLoading(false); }
  }, [selectedId]);

  useEffect(() => { loadResources(false); }, []);

  const onCreated = async (created) => {
    setSelectedId(String(created.cycle.id));
    setCycle(created);
    setCycles(current => [created, ...current]);
    setSection('overview');
    setMessage('Crop monitoring cycle created.');
  };

  const onUpdated = (updated) => {
    setCycle(updated);
    setCycles(current => current.map(item => String(item.cycle.id) === String(updated.cycle.id) ? updated : item));
  };

  const onArchived = async (_archivedId) => {
    await loadResources(false);
  };

  const onRestored = (restored) => {
    setCycle(restored);
    setSelectedId(String(restored.cycle.id));
    setCycles(current => current.map(item => String(item.cycle.id) === String(restored.cycle.id) ? restored : item));
  };

  const changeCycle = (value) => {
    setSelectedId(value);
    const match = cycles.find(item => String(item.cycle.id) === String(value));
    setCycle(match || null);
  };

  const go = (nextSection, stageKey = null) => {
    setSection(nextSection);
    if (stageKey) setInitialStageKey(stageKey);
    else if (nextSection === 'stages') setInitialStageKey(null);
  };

  const activeContent = useMemo(() => {
    if (!cycle) return null;
    const shared = { cycle, onRefresh: refreshCycle, onMessage: inform };
    switch (section) {
      case 'stages': return <StageMonitoring {...shared} stages={stages} initialStageKey={initialStageKey} />;
      case 'calendar': return <CalendarModule {...shared} />;
      case 'observations': return <ObservationsModule {...shared} />;
      case 'comparison': return <ComparisonModule {...shared} />;
      case 'alerts': return <AlertsModule {...shared} />;
      case 'recommendations': return <RecommendationsModule {...shared} />;
      case 'tasks': return <TasksModule {...shared} />;
      case 'imports': return <ImportReportsModule {...shared} />;
      case 'references': return <ReferenceModule {...shared} varieties={varieties} stages={stages} user={user} onRefresh={() => loadResources(true)} />;
      default: return <CropOverview cycle={cycle} onGo={go} />;
    }
  }, [cycle, section, stages, varieties, user, refreshCycle, inform, initialStageKey, loadResources]);

  return <AppLayout>
    <main className="page-container ci-page">
      <div className="ci-page-heading"><div><span className="ci-eyebrow">SugarYield AI · independent crop monitoring</span><h1>AI Crop Intelligence</h1><p>Track real crop growth, compare only with available references, and keep field history after day 180.</p></div><button className="ci-icon-refresh" onClick={() => loadResources(true)} title="Refresh crop data"><RefreshCw size={17} /></button></div>
      <CycleChooser cycles={cycles} fields={fields} varieties={varieties} selectedCycleId={selectedId} onSelect={changeCycle} onCreated={onCreated} onUpdated={onUpdated} onArchived={onArchived} onRestored={onRestored} onMessage={inform} />
      {message && <div className="ci-inline-message" role="status"><span>{message}</span><button onClick={() => setMessage('')} aria-label="Dismiss">×</button></div>}
      {loading ? <div className="ci-loading"><LoaderCircle size={18} className="ci-spin" />Loading crop cycles and references…</div> : problem ? <div className="ci-panel ci-error-panel"><AlertTriangle size={19} /><div><strong>Crop monitoring is unavailable</strong><p>{problem}</p></div><button className="ci-secondary" onClick={() => loadResources(true)}>Retry</button></div> : <>
        <div className="ci-workspace">
          {cycle?.cycle.status === 'archived' ? <section className="ci-panel ci-archived-cycle"><Archive size={24} /><div><h2>This monitoring cycle is archived</h2><p>Its observations, reports, alerts, and task history are preserved. Restore the cycle above to continue monitoring or editing it.</p></div></section> : <>
            <nav className="ci-module-nav" aria-label="Crop intelligence modules">{NAV.map(item => { const Icon = item.icon; return <button key={item.key} className={section === item.key ? 'active' : ''} onClick={() => go(item.key)}><Icon size={16} /><span>{item.label}</span></button>; })}</nav>
            <div className="ci-module-content">
              {cycle ? <div key={`${cycle.cycle.id}:${cycle.cycle.planting_date}`} className="ci-cycle-module-instance">{cycleLoading && <div className="ci-refreshing"><LoaderCircle size={14} className="ci-spin" />Refreshing saved records…</div>}{activeContent}</div> : <section className="ci-panel ci-no-cycle"><Sprout size={32} /><div><h2>Start monitoring a planted field</h2><p>Choose one of your existing fields and enter its planting date and selected variety. Crop observations and task history will be saved to this cycle.</p>{!fields.length && <small>Create a farm and field first from My Farm &amp; Fields.</small>}</div></section>}
            </div>
          </>}
        </div>
      </>}
    </main>
  </AppLayout>;
}
