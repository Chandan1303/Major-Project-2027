import React from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../layouts/WorkspaceLayout';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <WorkspaceLayout active="dashboard">
      <main className="dashboard-main">
        <section className="dashboard-content">
          <div className="dashboard-heading-row">
            <div>
              <p className="eyebrow">YOUR AGRICULTURAL WORKSPACE</p>
              <h1>Overview</h1>
              <p className="dashboard-lead">Explore yield forecasting tools and model context for your next growing decision.</p>
            </div>
            <button type="button" className="button button-dark dashboard-cta" onClick={() => navigate('/prediction')}>
              <span className="button-plus">+</span> New forecast
            </button>
          </div>

          <section className="dashboard-feature-grid" aria-label="Workspace overview">
            <article className="dashboard-primary-panel">
              <div className="primary-panel-top"><span className="panel-kicker">SUGARCANE YIELD FORECASTING</span><span className="panel-index">01 / 03</span></div>
              <div className="primary-panel-copy">
                <span className="primary-leaf" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M20 4c-8 0-14 3-14 10a6 6 0 0 0 6 6c7 0 10-6 8-16Z" /><path d="M4 21c3-6 7-9 12-12" /></svg></span>
                <h2>Plan with a wider<br />view of the field.</h2>
                <p>Bring crop, climate, soil, and management inputs together to explore a yield estimate with supporting analysis.</p>
                <button type="button" className="button button-lime" onClick={() => navigate('/prediction')}>Start a forecast <span aria-hidden="true">↗</span></button>
              </div>
              <div className="panel-land-lines" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            </article>

            <article className="dashboard-side-panel model-panel">
              <div className="content-panel-heading"><span className="panel-overline">MODEL SNAPSHOT</span><span className="live-mark"><i /> Project metrics</span></div>
              <h2>Evaluation metrics</h2>
              <p className="panel-description">Existing model performance figures reported by this project.</p>
              <div className="metric-pair">
                <div><span className="metric-label">R² score</span><strong>86.2%</strong><span className="metric-note">Reported score</span></div>
                <div><span className="metric-label">RMSE</span><strong>12.1 <small>t/ha</small></strong><span className="metric-note">Reported error</span></div>
              </div>
              <div className="model-footnote">5 models <span /> Cross-validation <span /> Median aggregation</div>
            </article>

            <article className="dashboard-side-panel sources-panel">
              <div className="content-panel-heading"><span className="panel-overline">INPUT LANDSCAPE</span><span className="source-count">04 sources</span></div>
              <h2>Conditions in context</h2>
              <p className="panel-description">The platform brings multiple agricultural signals into view.</p>
              <ul className="source-list">
                <li><span className="source-symbol source-satellite">S</span><span>Satellite imagery</span><span className="source-label">NDVI</span></li>
                <li><span className="source-symbol source-weather">W</span><span>Weather data</span><span className="source-label">CLIMATE</span></li>
                <li><span className="source-symbol source-soil">N</span><span>Soil analysis</span><span className="source-label">NPK</span></li>
                <li><span className="source-symbol source-field">B</span><span>Regional inputs</span><span className="source-label">BHUVAN</span></li>
              </ul>
            </article>
          </section>

          <section className="recent-section" aria-labelledby="recent-title">
            <div className="section-heading-line"><div><span className="panel-overline">YOUR WORK</span><h2 id="recent-title">Recent forecasts</h2></div><span className="muted-count">No saved records</span></div>
            <div className="recent-empty">
              <div className="empty-emblem" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 19V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V19" /><path d="M3 19h18M9 10v5m6-8v8" /></svg></div>
              <div><h3>Your first forecast starts here</h3><p>Forecasts are available in-session and are not saved to this dashboard.</p></div>
              <button type="button" className="button button-light" onClick={() => navigate('/prediction')}>Open forecast tool <span aria-hidden="true">→</span></button>
            </div>
          </section>
          <footer className="workspace-footer">SUGARYIELD AI <span>·</span> AGRICULTURAL DECISION SUPPORT</footer>
        </section>
      </main>
    </WorkspaceLayout>
  );
}
