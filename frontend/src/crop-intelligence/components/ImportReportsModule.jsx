import { useEffect, useState } from 'react';
import { Download, FileCheck2, FileSpreadsheet, FileText, Upload } from 'lucide-react';
import { cropIntelligenceApi } from '../api';

const mapOptions = [
  ['observation_date', 'Observation date'], ['days_after_planting', 'Days after planting'], ['plant_height_cm', 'Plant height (cm)'], ['tiller_count', 'Tiller count'], ['measurement_area_m2', 'Measurement area (m²)'], ['establishment_pct', 'Establishment (%)'], ['leaf_condition', 'Leaf condition'], ['leaf_symptoms', 'Leaf symptoms'], ['soil_moisture_pct', 'Soil moisture (%)'], ['rainfall_mm', 'Rainfall (mm)'], ['irrigation_activity', 'Irrigation activity'], ['pest_symptoms', 'Pest symptoms'], ['disease_symptoms', 'Disease symptoms'], ['soil_or_drainage', 'Soil / drainage'], ['notes', 'Farmer notes'],
];

export default function ImportReportsModule({ cycle, onRefresh, onMessage }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [busy, setBusy] = useState(false);
  const [reports, setReports] = useState([]);

  const loadReports = async () => {
    try { const result = await cropIntelligenceApi.reports(cycle.cycle.id); setReports(result.data.reports || []); }
    catch (error) { onMessage?.(error.message); }
  };
  useEffect(() => { setPreview(null); setFile(null); loadReports(); }, [cycle.cycle.id]);

  const previewFile = async (event) => {
    event.preventDefault();
    if (!file) return onMessage?.('Choose a CSV or .xlsx file first.');
    setBusy(true);
    try {
      const result = await cropIntelligenceApi.previewImport(cycle.cycle.id, file, mapping);
      setPreview(result.data);
      setMapping(result.data.mapping || {});
      if (result.data.already_imported) onMessage?.('This exact file was already imported.');
    } catch (error) { onMessage?.(error.message); setPreview(null); }
    finally { setBusy(false); }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const result = await cropIntelligenceApi.confirmImport(cycle.cycle.id, file, mapping);
      onMessage?.(`${result.data.imported_rows} rows imported; ${result.data.rejected_rows} rejected.`);
      setFile(null); setPreview(null); await onRefresh(); await loadReports();
    } catch (error) { onMessage?.(error.message); }
    finally { setBusy(false); }
  };

  const generate = async (checkpoint) => {
    setBusy(true);
    try {
      const result = await cropIntelligenceApi.createReport(cycle.cycle.id, checkpoint);
      onMessage?.(`Day ${checkpoint} report saved.`);
      await loadReports();
      return result.data.report;
    } catch (error) { onMessage?.(error.message); }
    finally { setBusy(false); }
  };

  const downloadReport = (report) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `crop-cycle-${cycle.cycle.id}-day-${report.checkpoint_day}-report.json`; link.click(); URL.revokeObjectURL(url);
  };
  const age = cycle.actual_dap;
  const checkpoints = [30, 60, 90, 120, 150, 180];

  return <div className="ci-module-stack">
    <div className="ci-two-col">
      <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Validated CSV / Excel import</span><h2>Upload crop data</h2></div><FileSpreadsheet size={20} /></div><p>CSV and .xlsx files are previewed before saving. Dates, units, DAP, duplicate dates, and measurement values are validated. Imported records stay labelled as imported.</p><a className="ci-download-link" href={cropIntelligenceApi.templateUrl()}><Download size={15} />Download CSV template</a>
        <form className="ci-upload-form" onSubmit={previewFile}><label className="ci-dropzone"><Upload size={21} /><strong>{file?.name || 'Choose a crop observation file'}</strong><small>CSV or Excel · up to 5 MB · 5,000 rows</small><input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event => { setFile(event.target.files?.[0] || null); setPreview(null); }} /></label><button className="ci-primary" type="submit" disabled={busy || !file}>{busy ? 'Checking…' : 'Preview and validate'}</button></form>
        {preview && <div className="ci-import-preview"><div className="ci-section-heading"><div><span className="ci-eyebrow">Preview only · not saved yet</span><h3>{preview.filename}</h3></div><span className="ci-source-pill">SHA-256 {preview.file_sha256?.slice(0, 12)}…</span></div><div className="ci-import-counts"><span><strong>{preview.valid_rows}</strong> valid</span><span><strong>{preview.rejected_rows}</strong> need review</span></div><div className="ci-mapping-grid">{mapOptions.map(([key, label]) => <label className="ci-field" key={key}><span>{label}{key === 'observation_date' ? ' *' : ''}</span><select value={mapping[key] || ''} onChange={event => setMapping(current => ({ ...current, [key]: event.target.value || undefined }))}><option value="">Not mapped</option>{preview.headers?.map(header => <option key={header} value={header}>{header || '(blank header)'}</option>)}</select></label>)}</div><div className="ci-table-wrap"><table className="ci-table"><thead><tr>{Object.keys(preview.preview?.[0] || {}).map(key => <th key={key}>{key}</th>)}</tr></thead><tbody>{preview.preview?.slice(0, 5).map((row, index) => <tr key={index}>{Object.keys(preview.preview?.[0] || {}).map(key => <td key={key}>{row[key] == null ? '' : String(row[key])}</td>)}</tr>)}</tbody></table></div>{preview.errors?.length > 0 && <details className="ci-import-errors"><summary>Review rejected rows ({preview.errors.length})</summary><ul>{preview.errors.map((error, index) => <li key={index}>{error}</li>)}</ul></details>}<button className="ci-primary" disabled={busy || !preview.valid_rows || preview.already_imported} onClick={confirm}><FileCheck2 size={15} />{busy ? 'Importing…' : `Import ${preview.valid_rows} valid rows`}</button><p className="ci-source-note">Confirm uploads only the currently selected file and mapping. Duplicate file hashes and duplicate observation dates are not inserted.</p></div>}
      </section>
      <section className="ci-panel"><div className="ci-section-heading"><div><span className="ci-eyebrow">Persisted from real observations</span><h2>Six-stage progress reports</h2></div><FileText size={19} /></div><p>Reports include crop age, reference limitations, measurements, comparisons, tasks, and warnings saved for this crop. Reaching day 180 does not mean the crop is mature.</p><div className="ci-checkpoint-grid">{checkpoints.map(day => { const saved = reports.find(row => row.checkpoint_day === day); const canGenerate = age >= day; return <div className={`ci-checkpoint ${saved ? 'saved' : ''}`} key={day}><span>Day {day}</span><strong>{saved ? 'Report saved' : canGenerate ? 'Ready to generate' : 'Not reached'}</strong>{saved && <small>{new Date(saved.generated_at).toLocaleDateString()}</small>}<button className="ci-secondary" disabled={!canGenerate || busy} onClick={async () => { const report = await generate(day); if (report) downloadReport(report); }}>{saved ? 'Refresh & export' : 'Generate'}</button>{saved && <button className="ci-link-button" onClick={() => downloadReport(saved.report)}>Download JSON</button>}</div>; })}</div><div className="ci-report-continued"><strong>After day 180</strong><p>{age <= 180 ? 'The crop calendar will continue beyond day 180.' : `This crop is at day ${age}. Continue monitoring and use locally verified maturity guidance; crop age alone does not mark harvest readiness.`}</p></div>
        {reports.length > 0 && <div className="ci-record-list">{reports.map(item => <article key={item.id}><div><strong>Day {item.checkpoint_day} · report history</strong><p>Saved {new Date(item.generated_at).toLocaleString()} · {item.report?.observations?.length || 0} observations included</p></div><button className="ci-link-button" onClick={() => downloadReport(item.report)}><Download size={14} />Export JSON</button></article>)}</div>}
      </section>
    </div>
  </div>;
}
