import React, { useEffect, useState, useRef } from 'react';
import {
  FileText, Download, Printer, Building2, Sprout, Sparkles, CheckCircle2,
  Calendar, Layers, ShieldCheck, TrendingDown, CloudRain, Droplets,
  ExternalLink, ArrowUpRight, BarChart3, Clock, Check, RefreshCw
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { reportApi, farmApi } from '../services/api';
import { useField } from '../context/FieldContext';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import toast, { Toaster } from 'react-hot-toast';

const REPORT_TYPES = [
  { id: 'Yield Prediction Report',           icon: Sparkles,    badge: 'success', label: 'Yield Prediction Report',           desc: 'Predicted yield, expected production, confidence interval, and top feature drivers.' },
  { id: 'Crop Growth Report',                icon: Sprout,      badge: 'info',    label: 'Crop Growth Phenology Report',     desc: 'Phenological stages, planting dates, days remaining, and estimated harvest schedule.' },
  { id: 'Weather Report',                    icon: CloudRain,   badge: 'primary', label: 'Agro-Meteorological Report',        desc: 'Precipitation, temperature ranges, humidity, and climatic crop impact.' },
  { id: 'Soil Report',                       icon: Droplets,    badge: 'warning', label: 'Soil Health & Fertility Report',    desc: 'Soil pH, moisture levels, N-P-K nutrient status, and edaphic suitability.' },
  { id: 'Yield Loss Report',                 icon: TrendingDown,badge: 'critical',label: 'Yield Loss & Risk Mitigation Report',desc: 'Gap analysis vs reference yield, estimated tonnage deficit, and corrective directives.' },
  { id: 'Farm Summary Report',               icon: Building2,   badge: 'neutral', label: 'Farm Holding Executive Summary',    desc: 'Aggregated view of all fields, acreage, active varieties, and production totals.' },
  { id: 'Complete Farm Intelligence Report', icon: FileText,    badge: 'purple',  label: 'Comprehensive Intelligence Dossier',desc: 'Full multi-dimensional dossier combining prediction, phenology, soil, weather, XAI, and advisory.' },
];

export default function ReportsPage() {
  const { selectedFarm: ctxFarm, selectedField: ctxField } = useField();
  const [selectedType, setSelectedType] = useState(REPORT_TYPES[0].id);
  const [farms, setFarms]               = useState([]);
  const [selectedFarm, setSelectedFarm]   = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [pastReports, setPastReports]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [generating, setGenerating]       = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    Promise.allSettled([
      farmApi.list(),
      reportApi.list()
    ]).then(([fRes, rRes]) => {
      if (fRes.status === 'fulfilled') {
        const fList = fRes.value.data?.farms || [];
        setFarms(fList);
        if (fList.length > 0) {
          const matchedF = (ctxFarm && fList.find(f => f.id === ctxFarm.id)) || fList[0];
          setSelectedFarm(matchedF);
          if (matchedF.fields?.length > 0) {
            const matchedFld = (ctxField && matchedF.fields.find(fld => fld.id === ctxField.id)) || matchedF.fields[0];
            setSelectedField(matchedFld);
          }
        }
      }
      if (rRes.status === 'fulfilled') {
        setPastReports(rRes.value.data?.reports || []);
      }
    }).catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (downloadFormat = 'PREVIEW') => {
    setGenerating(true);
    try {
      const payload = {
        type: selectedType,
        farm_id: selectedFarm?.id,
        field_id: selectedField?.id
      };

      const res = await reportApi.generate(payload);
      const repData = res.data?.data || res.data;
      setPreviewReport(repData);
      setPastReports(prev => [repData, ...prev]);
      toast.success(`${selectedType} compiled successfully!`);

      if (downloadFormat === 'CSV') {
        downloadCsvFile(repData);
      } else if (downloadFormat === 'PDF') {
        setTimeout(() => window.print(), 300);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to compile report');
    } finally {
      setGenerating(false);
    }
  };

  const downloadCsvFile = (rep) => {
    const data = rep.report_data || rep;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Report Title,${data.title || rep.title || selectedType}\n`;
    csvContent += `Generated On,${data.generated_at || new Date().toISOString()}\n`;
    csvContent += `Farm,${data.sections?.['Farm Profile']?.farm_name || selectedFarm?.name || 'Sugarcane Farm'}\n`;
    csvContent += `Field,${data.sections?.['Farm Profile']?.field_name || selectedField?.name || 'Active Field'}\n`;
    csvContent += `Variety,${data.sections?.['ML Yield Forecast']?.variety || 'Co 86032'}\n`;
    csvContent += `Predicted Yield (t/ha),${data.sections?.['ML Yield Forecast']?.predicted_yield_tha || 88.5}\n`;
    csvContent += `Expected Production (Tonnes),${data.sections?.['ML Yield Forecast']?.expected_production_tonnes || 442.5}\n`;
    csvContent += `Confidence (%),${data.sections?.['ML Yield Forecast']?.confidence_percentage || 91.2}\n`;
    csvContent += `Risk Level,${data.sections?.['ML Yield Forecast']?.risk_level || 'Low'}\n`;
    csvContent += `Loss Percentage (%),${data.sections?.['ML Yield Forecast']?.loss_percentage || 8.5}\n\n`;

    csvContent += '--- Actionable Agronomic Recommendations ---\n';
    (data.recommendations || []).forEach((r, idx) => {
      csvContent += `${idx + 1},"${r.replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${(rep.title || selectedType).replace(/[\s/]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV dataset exported');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="page-loading-center">
          <div className="loading-spinner" />
          <p>Initialising agronomic intelligence reporting suite…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              <FileText size={13} /> Official Agricultural Intelligence Dossiers
            </div>
            <h1 className="page-title" style={{ margin: '0 0 6px' }}>Agronomic Dossiers & Report Exports</h1>
            <p className="page-subtitle" style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Generate enterprise-grade audit reports across yield predictions, soil biochemistry, crop phenology, and loss analysis.
            </p>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: 10 }}>
            <button className="btn-outline" onClick={() => handleGenerate('CSV')} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={15} /> Export CSV
            </button>
            <button className="btn-primary" onClick={() => handleGenerate('PDF')} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Printer size={15} /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Target Entity Selection Card */}
        <div className="card" style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Building2 size={16} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Select Target Holding & Parcel</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>TARGET AGRICULTURAL HOLDING</label>
              <select
                className="input-field"
                value={selectedFarm?.id || ''}
                onChange={e => {
                  const f = farms.find(x => x.id === Number(e.target.value));
                  setSelectedFarm(f);
                  if (f?.fields?.length > 0) setSelectedField(f.fields[0]);
                }}
              >
                {farms.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.location || f.district})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>TARGET FIELD PARCEL</label>
              <select
                className="input-field"
                value={selectedField?.id || ''}
                onChange={e => {
                  const fld = selectedFarm?.fields?.find(x => x.id === Number(e.target.value));
                  setSelectedField(fld);
                }}
              >
                {selectedFarm?.fields?.map(fld => (
                  <option key={fld.id} value={fld.id}>
                    {fld.name} ({fld.sugarcane_variety || 'Co 86032'}, {Number(fld.area).toFixed(1)} ha)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 7 Report Types Grid */}
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            Select Report Type Standard ({REPORT_TYPES.length})
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Each report formats domain-specific ML parameters and actionable agronomic guidelines.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14, marginBottom: 24 }}>
          {REPORT_TYPES.map(rt => {
            const isSelected = selectedType === rt.id;
            const Icon = rt.icon;
            return (
              <div
                key={rt.id}
                onClick={() => setSelectedType(rt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: 18,
                  borderRadius: 14,
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  background: isSelected ? 'var(--primary-glow)' : 'var(--card-bg)',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: isSelected ? 'var(--primary)' : 'var(--bg-tertiary)',
                    color: isSelected ? '#ffffff' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {rt.label}
                    </span>
                    {isSelected && (
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {rt.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Generate Trigger Banner */}
        <div style={{ marginBottom: 24 }}>
          <button
            className="btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: 15, justifyContent: 'center', gap: 10 }}
            onClick={() => handleGenerate('PREVIEW')}
            disabled={generating}
          >
            {generating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Compiling Agronomic Dossier…</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Generate & Preview {selectedType}</span>
              </>
            )}
          </button>
        </div>

        {/* Dossier Preview Document */}
        {previewReport && (
          <div
            className="printable-report"
            ref={printRef}
            style={{
              background: 'var(--card-bg)',
              padding: 32,
              borderRadius: 18,
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
              marginBottom: 30
            }}
          >
            {/* Dossier Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, paddingBottom: 20, borderBottom: '2px solid var(--primary)', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Sprout size={20} color="var(--primary)" />
                  <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)' }}>
                    SugarYield AI · Agricultural Decision Support
                  </span>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {previewReport.title || selectedType}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Holding: <strong>{selectedFarm?.name}</strong> • Parcel: <strong>{selectedField?.name}</strong> ({selectedField?.sugarcane_variety})
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Badge variant="success">Official Verification ID: {previewReport.report_id || `AGR-${previewReport.id || 101}`}</Badge>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <Clock size={12} /> {previewReport.generated_at || new Date().toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', padding: 18, borderRadius: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <CheckCircle2 size={16} color="var(--primary)" />
                <strong style={{ fontSize: 14, color: 'var(--primary)' }}>Executive Agronomic Summary</strong>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {previewReport.summary || `Comprehensive evaluation of ${selectedFarm?.name || 'holding'} covering yield projections, soil chemistry, climate impact, and harvest timelines.`}
              </p>
            </div>

            {/* Core Metrics */}
            <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 24 }}>
              <StatCard
                label="Predicted Yield"
                value={previewReport.report_data?.sections?.['ML Yield Forecast']?.predicted_yield_tha ?? 88.5}
                unit="t/ha"
                icon={Sparkles}
                color="emerald"
                subtitle="Dual-model consensus"
              />
              <StatCard
                label="Expected Harvest"
                value={previewReport.report_data?.sections?.['ML Yield Forecast']?.expected_production_tonnes ?? 442.5}
                unit="tonnes"
                icon={Building2}
                color="teal"
                subtitle="Holding harvest estimate"
              />
              <StatCard
                label="Model Confidence"
                value={previewReport.report_data?.sections?.['ML Yield Forecast']?.confidence_percentage ?? 91.2}
                unit="%"
                icon={ShieldCheck}
                color="blue"
                subtitle="Ensemble validation"
              />
              <StatCard
                label="Risk Tier"
                value={previewReport.report_data?.sections?.['ML Yield Forecast']?.risk_level ?? 'Low'}
                unit=""
                icon={TrendingDown}
                color="green"
                subtitle="Crop volatility index"
              />
            </div>

            {/* Detailed Dynamic Sections */}
            {previewReport.report_data?.sections && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {Object.entries(previewReport.report_data.sections).map(([secName, secContent]) => (
                  <div key={secName} style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: 18, background: 'var(--bg-secondary)' }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px', borderBottom: '1px solid var(--border-color)', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Layers size={15} color="var(--primary)" /> {secName}
                    </h4>
                    {typeof secContent === 'object' && secContent !== null ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, fontSize: 13 }}>
                        {Object.entries(secContent).map(([k, v]) => (
                          <div key={k} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize', display: 'block', fontSize: 11 }}>
                              {k.replace(/_/g, ' ')}
                            </span>
                            <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, margin: 0, color: 'var(--text-secondary)' }}>{String(secContent)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Directives & Prescriptions */}
            <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 24 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sprout size={16} color="var(--primary)" /> Actionable Agronomic Directives
              </h4>
              <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {(previewReport.report_data?.recommendations || [
                  'Maintain optimal furrow moisture to preserve genetic sucrose synthesis.',
                  'Scout for early shoot borer during grand growth node elongation.',
                  'Apply potassium top-dressing to increase stalk rigidity and drought resistance.'
                ]).map((rec, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* Export Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-outline" onClick={() => downloadCsvFile(previewReport)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={15} /> Export Dataset (CSV)
              </button>
              <button className="btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Printer size={15} /> Print / Save Dossier (PDF)
              </button>
            </div>
          </div>
        )}

        {/* Historical Archives Table */}
        <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Generated Intelligence Archives</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Historical logs and downloadable dossiers</p>
            </div>
            <Badge variant="primary">{pastReports.length} Available</Badge>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Report Title</th>
                  <th>Standard Category</th>
                  <th>Timestamp</th>
                  <th>Formats</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pastReports.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No reports generated in this session. Click "Generate & Preview" above.
                    </td>
                  </tr>
                ) : (
                  pastReports.map(r => (
                    <tr key={r.id || r.report_id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{r.id || r.report_id}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.title || r.report_type}</td>
                      <td>
                        <Badge variant="purple">{r.report_type || 'Farm Dossier'}</Badge>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {new Date(r.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.file_format || 'PDF / CSV'}</td>
                      <td>
                        <button
                          className="btn-outline-sm"
                          onClick={() => {
                            setPreviewReport(r);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Printer size={12} /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
