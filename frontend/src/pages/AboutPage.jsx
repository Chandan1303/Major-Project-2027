import React from 'react';
import AppLayout from '../components/AppLayout';

const team = [
  { name: 'Team Member 1', role: 'ML Engineer & Backend',    avatar: 'T1', color: '#2d7a3e' },
  { name: 'Team Member 2', role: 'Frontend & UI/UX',         avatar: 'T2', color: '#1a73e8' },
  { name: 'Team Member 3', role: 'Data Scientist',           avatar: 'T3', color: '#7b1fa2' },
  { name: 'Team Member 4', role: 'Geospatial & NDVI',        avatar: 'T4', color: '#f59e0b' },
];

const technologies = [
  { category: 'Machine Learning', items: ['XGBoost', 'Random Forest', 'Gradient Boosting', 'Ridge Regression', 'Linear Regression'], color: '#2d7a3e' },
  { category: 'Frontend',         items: ['React 18', 'Vite 6', 'React Router', 'CSS Animations'], color: '#1a73e8' },
  { category: 'Backend',          items: ['Node.js', 'Express', 'PostgreSQL', 'JWT Auth'], color: '#7b1fa2' },
  { category: 'Data Sources',     items: ['ISRO Bhuvan API', 'Sentinel-2 NDVI', 'IMD Weather', 'ICAR Soil Data'], color: '#f59e0b' },
  { category: 'Python Stack',     items: ['Pandas', 'NumPy', 'Scikit-learn', 'Matplotlib', 'XGBoost lib'], color: '#ef4444' },
];

const objectives = [
  { n: '01', title: 'Predict sugarcane yield', desc: 'Using ML models trained on 12,000+ samples from across Indian sugarcane-growing states.' },
  { n: '02', title: 'Monitor crop health',     desc: 'Real-time NDVI from Sentinel-2 and ISRO Bhuvan to track vegetation health and stress.' },
  { n: '03', title: 'Analyze weather impact',  desc: 'Integrate historical and live weather data to quantify climate impact on yield.' },
  { n: '04', title: 'Soil intelligence',        desc: 'Soil type, pH, and NPK analysis for better variety selection and fertilization.' },
  { n: '05', title: 'Variety comparison',       desc: 'Help farmers choose the best-suited sugarcane variety for their specific conditions.' },
  { n: '06', title: 'Explainable AI',           desc: 'SHAP-based feature importance so farmers understand what drives each prediction.' },
];

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="eyebrow">About This Project</p>
            <h1 className="page-title">SugarYield AI</h1>
            <p className="page-subtitle">Smart Agricultural Decision Support System for Sugarcane Cultivation</p>
          </div>
        </div>

        {/* Project Description */}
        <div className="dash-panel about-hero-panel">
          <div className="about-hero-content">
            <div className="about-icon-big">🌾</div>
            <div>
              <h2>Project Overview</h2>
              <p>
                SugarYield AI is an end-to-end AI-powered platform designed to help Indian sugarcane farmers
                make data-driven decisions. It combines satellite remote sensing (NDVI from Sentinel-2 and
                ISRO Bhuvan), real-time weather data, and comprehensive soil analysis to predict sugarcane
                yield with high accuracy using an ensemble of Machine Learning models.
              </p>
              <p>
                The system was trained on over <strong>12,000 data samples</strong> across 28 Indian states,
                achieving an <strong>R² score of 86.2%</strong> using MEDIAN aggregation of five models:
                XGBoost, Random Forest, Gradient Boosting, Linear Regression, and Ridge Regression.
              </p>
              <div className="about-stats">
                {[
                  { v: '12,000+', l: 'Training Samples' },
                  { v: '86.2%',   l: 'R² Accuracy' },
                  { v: '28',      l: 'States Covered' },
                  { v: '5',       l: 'ML Models' },
                ].map(s => (
                  <div className="about-stat" key={s.l}>
                    <span className="about-stat-v">{s.v}</span>
                    <span className="about-stat-l">{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Objectives */}
        <div className="dash-panel">
          <div className="dash-panel-header"><h3>Project Objectives</h3></div>
          <div className="objectives-grid">
            {objectives.map(o => (
              <div className="objective-card" key={o.n}>
                <span className="obj-number">{o.n}</span>
                <div>
                  <strong>{o.title}</strong>
                  <p>{o.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technologies */}
        <div className="dash-panel">
          <div className="dash-panel-header"><h3>Technologies Used</h3></div>
          <div className="tech-grid">
            {technologies.map(t => (
              <div className="tech-category" key={t.category} style={{ '--tc-color': t.color }}>
                <h4>{t.category}</h4>
                <div className="tech-tags">
                  {t.items.map(i => (
                    <span key={i} className="tech-tag" style={{ background: `${t.color}15`, color: t.color }}>{i}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="dash-panel">
          <div className="dash-panel-header"><h3>Team Members</h3></div>
          <div className="team-grid">
            {team.map(m => (
              <div className="team-card" key={m.name}>
                <div className="team-avatar" style={{ background: `${m.color}22`, color: m.color }}>{m.avatar}</div>
                <div className="team-info">
                  <span className="team-name">{m.name}</span>
                  <span className="team-role">{m.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guide */}
        <div className="dash-panel guide-panel">
          <div className="guide-content">
            <div className="guide-avatar">🎓</div>
            <div>
              <span className="eyebrow">Project Guide</span>
              <h3>Faculty Guide Name</h3>
              <p>Department of Computer Science & Engineering</p>
              <p>National Institute of Engineering (NIE), Mysuru</p>
            </div>
          </div>
          <div className="about-footer">
            <span className="eyebrow">Academic Year 2026–27</span>
            <p>Major Project — B.E. Computer Science & Engineering</p>
            <p>National Institute of Engineering (NIE), Mysuru</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
