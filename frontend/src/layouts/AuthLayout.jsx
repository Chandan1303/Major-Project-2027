import React from 'react';
import { Link } from 'react-router-dom';
import Brand from '../components/Brand';

export default function AuthLayout({ children, compact = false }) {
  return (
    <main className={`auth-shell ${compact ? 'compact' : ''}`}>
      <aside className="editorial-panel">
        <Brand />
        <div className="panel-copy">
          <p className="eyebrow">Smart Agricultural Intelligence</p>
          <h1>AI-Powered <br /><em>Sugarcane Yield</em> Forecasting</h1>
          <p>
            Predict sugarcane yield before harvest using Machine Learning, satellite NDVI data, 
            climate analysis, and soil characteristics. Make smarter farming decisions with 
            AI-driven insights and crop health monitoring.
          </p>
        </div>
        <div className="panel-footer">NIE · Agricultural Decision Support System 2024</div>
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
