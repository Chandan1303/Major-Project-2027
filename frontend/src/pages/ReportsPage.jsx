import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';

const reportTypes = [
  { id: 'yield',  label: 'Yield Prediction Report',  icon: '🌾', desc: 'Full yield forecast with model details, confidence, and recommendations.' },
  { id: 'health', label: 'Crop Health Report',        icon: '💚', desc: 'NDVI analysis, vegetation health, growth stage, and stress zones.' },
  { id: 'weather',label: 'Weather Impact Report',     icon: '☁️', desc: 'Climate conditions, 7-day forecast, and weather impact on yield.' },
  { id: 'soil',   label: 'Soil Analysis Report',      icon: '🪨', desc: 'Complete NPK, pH, moisture, and suitability analysis.' },
  { id: 'loss',   label: 'Loss Analysis Report',      icon: '📉', desc: 'Predicted vs actual yield, loss factors, and risk assessment.' },
];

const pastReports = [
  { id: 1, type: 'Yield Prediction', field: 'North Block',  date: 'Sep 24, 2026', format: 'PDF', size: '1.2 MB' },
  { id: 2, type: 'Crop Health',      field: 'West Block',   date: 'Sep 22, 2026', format: 'PDF', size: '0.8 MB' },
  { id: 3, type: 'Soil Analysis',    field: 'South Plot',   date: 'Sep 19, 2026', format: 'CSV', size: '42 KB' },
  { id: 4, type: 'Weather Impact',   field: 'All Fields',   date: 'Sep 15, 2026', format: 'PDF', size: '1.5 MB' },
  { id: 5, type: 'Yield Prediction', field: 'East Field',   date: 'Sep 10, 2026', format: 'PDF', size: '1.1 MB' },
];

export default function ReportsPage() {
  const [selected, setSelected] = useState('yield');
  const [format, setFormat]     = useState('pdf');
  const [dateRange, setDateRange] = useState('last30');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated]   = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);

      // Build text report content
      const reportType = reportTypes.find(r => r.id === selected);
      const content = [
        '============================================',
        `  SUGARYIELD AI — ${reportType.label.toUpperCase()}`,
        '============================================',
        `Generated: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        `Date Range: ${dateRange === 'last30' ? 'Last 30 Days' : dateRange === 'last90' ? 'Last 90 Days' : 'This Season'}`,
        '',
        '--- INPUT PARAMETERS ---',
        'Farm: Krishna Sugarcane Farm',
        'Location: Kolhapur, Maharashtra',
        'Variety: Co 86032',
        'Season: Kharif 2025-26',
        '',
        '--- PREDICTION RESULTS ---',
        'Predicted Yield: 72.4 t/ha',
        'Confidence: 89.1%',
        'Model: XGBoost + Ensemble',
        'Risk Level: Low',
        '',
        '--- CROP HEALTH ---',
        'NDVI: 0.74 — Healthy',
        'Growth Stage: Grand Growth',
        'Stressed Area: 12%',
        '',
        '--- WEATHER CONDITIONS ---',
        'Avg Temperature: 29°C',
        'Rainfall: 96mm/month',
        'Humidity: 68%',
        '',
        '--- SOIL ANALYSIS ---',
        'Soil Type: Black Cotton',
        'pH: 6.8 (Optimal)',
        'N: 185 kg/ha | P: 68 kg/ha | K: 90 kg/ha',
        '',
        '--- RECOMMENDATIONS ---',
        '1. Maintain current irrigation schedule.',
        '2. Monitor West Block — approaching harvest.',
        '3. East Field NDVI is moderate — consider foliar application.',
        '4. Next prediction recommended in 30 days.',
        '',
        '============================================',
        'SUGARYIELD AI · Smart Agricultural Decision Support System',
        'NIE · Agricultural Decision Support System 2026',
        '============================================',
      ].join('\n');

      const blob = new Blob([content], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `SugarYield_${reportType.label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  };

  const handleDownloadPast = (r) => {
    const content = `SUGARYIELD AI — ${r.type.toUpperCase()} REPORT\n\nField: ${r.field}\nDate: ${r.date}\nFormat: ${r.format}\n\nThis is a sample past report from ${r.date}.\n\nSUGARYIELD AI · Smart Agricultural Decision Support`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SugarYield_${r.type.replace(/\s/g, '_')}_${r.field.replace(/\s/g, '_')}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">Data Export</p>
            <h1 className="page-title">Reports</h1>
            <p className="page-subtitle">Generate and download detailed reports for yield, health, weather, soil, and loss analysis.</p>
          </div>
        </div>

        <div className="dash-two-col">
          {/* Report Builder */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Generate Report</h3>
            </div>

            <div className="report-type-grid">
              {reportTypes.map(r => (
                <div
                  key={r.id}
                  className={`report-type-card ${selected === r.id ? 'rtc-selected' : ''}`}
                  onClick={() => { setSelected(r.id); setGenerated(false); }}
                >
                  <span className="rtc-icon">{r.icon}</span>
                  <div>
                    <span className="rtc-label">{r.label}</span>
                    <span className="rtc-desc">{r.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="report-options">
              <div className="form-group">
                <label>Format</label>
                <select value={format} onChange={e => { setFormat(e.target.value); setGenerated(false); }}>
                  <option value="pdf">PDF Report</option>
                  <option value="csv">CSV Data</option>
                  <option value="txt">Text File</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date Range</label>
                <select value={dateRange} onChange={e => { setDateRange(e.target.value); setGenerated(false); }}>
                  <option value="last30">Last 30 Days</option>
                  <option value="last90">Last 90 Days</option>
                  <option value="season">This Season</option>
                </select>
              </div>
            </div>

            <button
              className={`btn-primary report-generate-btn ${generating ? 'generating' : ''}`}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <><span className="spinner-white" />  Generating…</>
              ) : generated ? (
                '✓ Downloaded!'
              ) : (
                `⬇ Generate & Download ${format.toUpperCase()}`
              )}
            </button>
          </div>

          {/* Past Reports */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3>Past Reports</h3>
              <span className="badge badge-green">{pastReports.length} Reports</span>
            </div>
            <div className="past-reports-list">
              {pastReports.map(r => (
                <div className="past-report-row" key={r.id}>
                  <div className="prr-info">
                    <span className="prr-type">{reportTypes.find(t => t.label.includes(r.type.split(' ')[0]))?.icon || '📄'} {r.type}</span>
                    <span className="prr-meta">{r.field} · {r.date}</span>
                  </div>
                  <div className="prr-actions">
                    <span className="prr-size">{r.format} · {r.size}</span>
                    <button className="prr-download" onClick={() => handleDownloadPast(r)}>⬇</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
