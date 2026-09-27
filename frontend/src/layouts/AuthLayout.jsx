import React from 'react';
import { Sparkles, ShieldCheck, Activity, Sprout } from 'lucide-react';
import Brand from '../components/Brand';

export default function AuthLayout({ children, compact = false }) {
  return (
    <main className={`auth-shell ${compact ? 'compact' : ''}`}>
      <aside className="editorial-panel">
        <div className="editorial-panel-bg-glow" />
        <Brand />

        <div className="panel-copy">
          <div className="editorial-pill">
            <span className="editorial-pill-dot" />
            <Sparkles size={13} className="text-emerald-300" />
            <span>Smart Agricultural Decision Support</span>
          </div>

          <h1>
            AI-Powered <br />
            <em>Sugarcane Yield</em> <br />
            Forecasting
          </h1>

          <p>
            Forecast harvest tonnage before cutting using Machine Learning ensemble algorithms,
            micro-climate telemetry, soil health profiling, and varietal genetics. Engineered for Indian sugarcane farmers and extension officers.
          </p>

          <div className="editorial-features-grid">
            <div className="ef-item">
              <ShieldCheck size={16} className="ef-icon text-emerald-400" />
              <div>
                <strong>Dual Ensemble Model</strong>
                <span>XGBoost + Random Forest (R² = 86.2%)</span>
              </div>
            </div>
            <div className="ef-item">
              <Sprout size={16} className="ef-icon text-emerald-400" />
              <div>
                <strong>Pure Agronomic Engine</strong>
                <span>Zero NDVI / satellite dependencies</span>
              </div>
            </div>
            <div className="ef-item">
              <Activity size={16} className="ef-icon text-emerald-400" />
              <div>
                <strong>Early Risk Shield</strong>
                <span>Real-time weather deficit detection</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-footer">
          <span>NIE · Agricultural Decision Support System 2027</span>
          <span className="panel-footer-pill">Production Ready</span>
        </div>
      </aside>

      <section className="form-panel">
        <div className="mobile-brand">
          <Brand />
        </div>
        {children}
      </section>
    </main>
  );
}
