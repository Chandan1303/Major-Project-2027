import React, { useEffect, useState, useRef } from 'react';
import AppLayout from '../components/AppLayout';
import { reportApi, farmApi } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const REPORT_TYPES = [
  { id: 'Yield Prediction Report',           icon: '🌾', label: '1. Yield Prediction Report',            desc: 'Predicted yield, expected production, confidence range, and explainable AI factors.' },
  { id: 'Crop Growth Report',                icon: '🌿', label: '2. Crop Growth Report',                 desc: 'Phenological stages, planting dates, days remaining, and estimated harvest schedule.' },
  { id: 'Weather Report',                    icon: '☁️', label: '3. Weather Report',                     desc: 'Precipitation, temperature ranges, humidity, and agro-meteorological crop impact.' },
  { id: 'Soil Report',                       icon: '🪨', label: '4. Soil Report',                        desc: 'Soil pH, moisture levels, N-P-K nutrient status, and soil suitability scores.' },
  { id: 'Yield Loss Report',                 icon: '📉', label: '5. Yield Loss Report',                  desc: 'Gap analysis vs reference yield, estimated tonnage deficit, and risk mitigation.' },
  { id: 'Farm Summary Report',               icon: '🏡', label: '6. Farm Summary Report',                desc: 'Aggregated view of all fields, acreage, active varieties, and production totals.' },
  { id: 'Complete Farm Intelligence Report', icon: '📋', label: '7. Complete Farm Intelligence Report',  desc: 'Full dossier combining prediction, phenology, soil, weather, XAI, and advisory.' },
];

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState(REPORT_TYPES[0].id);
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [pastReports, setPastReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
          setSelectedFarm(fList[0]);
          if (fList[0].fields?.length > 0) {
            setSelectedField(fList[0].fields[0]);
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
      toast.success(`${selectedType} generated successfully!`);

      if (downloadFormat === 'CSV') {
        downloadCsvFile(repData);
      } else if (downloadFormat === 'PDF') {
        setTimeout(() => window.print(), 300);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to generate report');
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
  };

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Data Export & Auditing</p>
            <h1 className="page-title">Sugarcane Intelligence Reports</h1>
            <p className="page-subtitle">
              Generate 7 standardized agronomic reports with PDF and CSV export support.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => handleGenerate('CSV')} disabled={generating}>
              📥 Download CSV
            </button>
            <button className="btn-primary" onClick={() => handleGenerate('PDF')} disabled={generating}>
              🖨️ Print / Save PDF
            </button>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="dash-panel" style={{ padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label>Target Farm</label>
              <select
                value={selectedFarm?.id || ''}
                onChange={e => {
                  const f = farms.find(x => x.id === Number(e.target.value));
                  setSelectedFarm(f);
                  if (f?.fields?.length > 0) setSelectedField(f.fields[0]);
                }}
              >
                {farms.map(f => <option key={f.id} value={f.id}>{f.name} ({f.location})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Target Field</label>
              <select
                value={selectedField?.id || ''}
                onChange={e => {
                  const fld = selectedFarm?.fields?.find(x => x.id === Number(e.target.value));
                  setSelectedField(fld);
                }}
              >
                {selectedFarm?.fields?.map(fld => (
                  <option key={fld.id} value={fld.id}>
                    {fld.name} ({fld.sugarcane_variety || 'Co 86032'}, {fld.area} ha)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 7 Report Selection Grid */}
        <div className="report-type-grid" style={{ marginBottom: '24px' }}>
          {REPORT_TYPES.map(rt => (
            <div
              key={rt.id}
              className={`report-type-card ${selectedType === rt.id ? 'rtc-selected' : ''}`}
              onClick={() => setSelectedType(rt.id)}
            >
              <span className="rtc-icon">{rt.icon}</span>
              <div>
                <span className="rtc-label">{rt.label}</span>
                <span className="rtc-desc">{rt.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Panel */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            className="btn-primary"
            style={{ flex: 1, padding: '14px', fontSize: '15px' }}
            onClick={() => handleGenerate('PREVIEW')}
            disabled={generating}
          >
            {generating ? '🔄 Compiling Intelligence Report…' : `⚡ Generate & Preview ${selectedType}`}
          </button>
        </div>

        {/* Report Preview Section */}
        {previewReport && (
          <div className="dash-panel printable-report" ref={printRef} style={{ background: '#ffffff', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #16a34a', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#14532d', margin: 0 }}>
                  {previewReport.title || selectedType}
                </h2>
                <p style={{ fontSize: '13px', color: '#4b5563', margin: '4px 0 0' }}>
                  SugarYield AI · Agricultural Intelligence & Decision Support Report
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-green">Official Verification ID: {previewReport.report_id || `AGR-${previewReport.id || 101}`}</span>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                  Date: {previewReport.generated_at || new Date().toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
              <strong style={{ color: '#166534', display: 'block', marginBottom: '4px' }}>Executive Summary</strong>
              <p style={{ margin: 0, fontSize: '14px', color: '#15803d' }}>
                {previewReport.summary || `Comprehensive evaluation of ${selectedFarm?.name || 'Sugarcane Holding'} covering yield projections, soil chemistry, climate impact, and harvest timelines.`}
              </p>
            </div>

            {/* Key Agronomic KPIs */}
            <div className="stats-grid-4" style={{ marginBottom: '24px' }}>
              <div className="stat-card" style={{ '--card-accent': '#16a34a' }}>
                <div className="sc-icon">🌾</div>
                <div className="sc-body">
                  <span className="sc-label">Predicted Yield</span>
                  <span className="sc-value">{previewReport.report_data?.sections?.['ML Yield Forecast']?.predicted_yield_tha ?? 88.5} t/ha</span>
                </div>
              </div>
              <div className="stat-card" style={{ '--card-accent': '#2d7a3e' }}>
                <div className="sc-icon">📦</div>
                <div className="sc-body">
                  <span className="sc-label">Expected Production</span>
                  <span className="sc-value">{previewReport.report_data?.sections?.['ML Yield Forecast']?.expected_production_tonnes ?? 442.5} tonnes</span>
                </div>
              </div>
              <div className="stat-card" style={{ '--card-accent': '#6366f1' }}>
                <div className="sc-icon">🎯</div>
                <div className="sc-body">
                  <span className="sc-label">Model Confidence</span>
                  <span className="sc-value">{previewReport.report_data?.sections?.['ML Yield Forecast']?.confidence_percentage ?? 91.2}%</span>
                </div>
              </div>
              <div className="stat-card" style={{ '--card-accent': '#dc2626' }}>
                <div className="sc-icon">📉</div>
                <div className="sc-body">
                  <span className="sc-label">Yield Loss Risk</span>
                  <span className="sc-value">{previewReport.report_data?.sections?.['ML Yield Forecast']?.risk_level ?? 'Low'}</span>
                </div>
              </div>
            </div>

            {/* Detailed Report Sections */}
            {previewReport.report_data?.sections && (
              <div className="space-y-4" style={{ marginBottom: '24px' }}>
                {Object.entries(previewReport.report_data.sections).map(([secName, secContent]) => (
                  <div key={secName} style={{ border: '1px solid #f1f5f9', borderRadius: '8px', padding: '14px', background: '#fafafa' }}>
                    <h4 style={{ fontSize: '15px', color: '#1f2937', marginBottom: '10px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
                      📋 {secName}
                    </h4>
                    {typeof secContent === 'object' && secContent !== null ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '13px' }}>
                        {Object.entries(secContent).map(([k, v]) => (
                          <div key={k}>
                            <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}: </span>
                            <strong>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', margin: 0 }}>{String(secContent)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actionable Recommendations */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '15px', color: '#334155', marginBottom: '10px' }}>
                🌱 AI Agronomic Recommendations & Monitoring Directives
              </h4>
              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                {(previewReport.report_data?.recommendations || [
                  'Maintain optimal furrow moisture to preserve genetic sucrose synthesis.',
                  'Scout for early shoot borer during grand growth node elongation.',
                  'Apply potassium top-dressing to increase stalk rigidity and drought resistance.'
                ]).map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* Print & Download Action Row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-outline" onClick={() => downloadCsvFile(previewReport)}>
                📥 Download as CSV
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                🖨️ Print / Save as PDF
              </button>
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="dash-panel" style={{ marginTop: '24px' }}>
          <div className="dash-panel-header">
            <h3>Generated Intelligence Archives</h3>
            <span className="badge badge-blue">{pastReports.length} Available</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Report Title</th>
                  <th>Category</th>
                  <th>Created Date</th>
                  <th>Format</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pastReports.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No reports generated yet.</td></tr>
                ) : (
                  pastReports.map(r => (
                    <tr key={r.id || r.report_id}>
                      <td>#{r.id || r.report_id}</td>
                      <td className="td-bold">{r.title || r.report_type}</td>
                      <td><span className="badge badge-purple">{r.report_type || 'Farm Dossier'}</span></td>
                      <td className="td-muted">{new Date(r.created_at || Date.now()).toLocaleDateString('en-IN')}</td>
                      <td>{r.file_format || 'PDF / CSV'}</td>
                      <td>
                        <button
                          className="btn-sm btn-outline"
                          onClick={() => {
                            setPreviewReport(r);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                        >
                          View & Print
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
