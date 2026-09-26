import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { reportApi } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const REPORT_TYPES = [
  { id:'farm_summary',   icon:'🏡', label:'Farm Summary Report',      desc:'All farms, fields, area and recent predictions in one report.' },
  { id:'prediction',     icon:'🌾', label:'Yield Prediction Report',   desc:'Detailed prediction with soil, weather and AI confidence analysis.' },
  { id:'crop_growth',    icon:'🌿', label:'Crop Growth Report',        desc:'Growth stage timeline, planting dates and harvest estimates.' },
  { id:'soil',           icon:'🪨', label:'Soil Analysis Report',      desc:'pH, moisture, health score and suitability for each field.' },
  { id:'weather',        icon:'☁️', label:'Weather Impact Report',     desc:'Temperature, rainfall, humidity and their impact on yield.' },
  { id:'loss_analysis',  icon:'📉', label:'Yield Loss Analysis Report', desc:'Predicted vs reference yield, loss percentage and risk level.' },
];

export default function ReportsPage() {
  const [selected, setSelected]   = useState('farm_summary');
  const [pastReports, setPastReports] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [format, setFormat]       = useState('txt');

  useEffect(() => {
    reportApi.list()
      .then(r => setPastReports(r.data?.reports || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await reportApi.generate({ type: selected });
      const content = r.data?.text_content || 'Report generated.';
      const filename = r.data?.filename || `report_${Date.now()}.txt`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch (e) { toast.error(e.message); }
    finally { setGenerating(false); }
  };

  const downloadPast = (r) => {
    const lines = [
      'SUGARYIELD AI — REPORT',
      '='.repeat(50),
      `Type       : ${r.type}`,
      `Field/Farm : ${r.field}`,
      `Date       : ${new Date(r.date).toLocaleDateString('en-IN', { dateStyle:'full' })}`,
      '',
      ...(r.data ? Object.entries(r.data).map(([k,v]) => `${k.replace(/_/g,' ').toUpperCase()} : ${v}`) : []),
      '', '='.repeat(50),
      'SugarYield AI · Smart Agricultural Decision Support',
    ];
    const blob = new Blob([lines.join('\n')], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `SugarYield_${r.type}_${r.id}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Data Export</p>
            <h1 className="page-title">Reports</h1>
            <p className="page-subtitle">Generate and download comprehensive farm, yield, soil and weather reports.</p>
          </div>
        </div>

        <div className="dash-two-col">
          {/* Generator */}
          <div className="dash-panel">
            <div className="dash-panel-header"><h3>Generate Report</h3></div>
            <div className="report-type-grid">
              {REPORT_TYPES.map(rt => (
                <div key={rt.id} className={`report-type-card ${selected===rt.id?'rtc-selected':''}`} onClick={() => setSelected(rt.id)}>
                  <span className="rtc-icon">{rt.icon}</span>
                  <div><span className="rtc-label">{rt.label}</span><span className="rtc-desc">{rt.desc}</span></div>
                </div>
              ))}
            </div>

            <div className="report-options">
              <div className="form-group">
                <label>Format</label>
                <select value={format} onChange={e => setFormat(e.target.value)}>
                  <option value="txt">Text File (.txt)</option>
                  <option value="csv">CSV Data (.csv)</option>
                </select>
              </div>
            </div>

            <button className={`btn-primary report-generate-btn ${generating?'generating':''}`} onClick={generate} disabled={generating}>
              {generating ? <><span className="spinner-white" /> Generating…</> : `⬇ Download ${format.toUpperCase()} Report`}
            </button>
          </div>

          {/* Past reports */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Past Reports</h3>
              <span className="badge badge-green">{pastReports.length} Available</span>
            </div>
            {loading ? (
              <div className="empty-state-sm"><div className="loading-spinner-sm" /></div>
            ) : pastReports.length === 0 ? (
              <div className="empty-state-sm"><p>No past reports. Generate your first report above.</p></div>
            ) : (
              <div className="past-reports-list">
                {pastReports.map(r => (
                  <div key={r.id} className="past-report-row">
                    <div className="prr-info">
                      <span className="prr-type">
                        {REPORT_TYPES.find(t=>t.label.toLowerCase().includes(r.type?.split('_')[0]))?.icon || '📄'} {r.title}
                      </span>
                      <span className="prr-meta">{r.field} · {new Date(r.date).toLocaleDateString('en-IN')}</span>
                    </div>
                    <button className="prr-download" onClick={() => downloadPast(r)}>⬇</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Report contents preview */}
        <div className="dash-panel">
          <div className="dash-panel-header"><h3>Report Contents</h3></div>
          <div className="report-contents-preview">
            {(() => {
              const rt = REPORT_TYPES.find(r => r.id === selected);
              const contents = {
                farm_summary:  ['Farm details (name, location, area, state)','All fields with soil and variety data','Recent prediction history','Total area and field count summary'],
                prediction:    ['Input parameters (variety, area, soil, weather)','Predicted yield and expected production','Confidence % and expected range','Risk level and loss percentage','AI explanation summary'],
                crop_growth:   ['Planting dates for all fields','Current growth stage per field','Days since planting and days to harvest','Estimated harvest dates','Stage-wise activity recommendations'],
                soil:          ['Soil type and pH for each field','Soil moisture levels','Soil health score and breakdown','Sugarcane suitability rating','Nutrient guidance (if available)'],
                weather:       ['Current temperature and rainfall','Humidity and wind conditions','7-day forecast summary','Weather impact on sugarcane yield','Seasonal history overview'],
                loss_analysis: ['Predicted yield vs reference yield (85 t/ha)','Calculated yield loss in t/ha','Loss percentage','Risk classification','Top contributing factors'],
              };
              return (
                <>
                  <h4>{rt?.icon} {rt?.label}</h4>
                  <ul className="report-contents-list">
                    {(contents[selected] || []).map(item => <li key={item}>{item}</li>)}
                  </ul>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
