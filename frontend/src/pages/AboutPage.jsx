import React from 'react';
import AppLayout from '../components/AppLayout';

const team = [
  { name: 'Team Member 1', role: 'ML Engineer & Python Backend', avatar: 'T1', color: '#2d7a3e' },
  { name: 'Team Member 2', role: 'Frontend & UI/UX',             avatar: 'T2', color: '#1a73e8' },
  { name: 'Team Member 3', role: 'Agronomy & Decision Support',  avatar: 'T3', color: '#7b1fa2' },
  { name: 'Team Member 4', role: 'Database & Systems Engineer',  avatar: 'T4', color: '#f59e0b' },
];

const technologies = [
  { category: 'Machine Learning', items: ['Random Forest', 'XGBoost', 'Explainable AI', 'Cross-Validation (5-Fold)', 'Scikit-learn'], color: '#2d7a3e' },
  { category: 'Frontend',         items: ['React 18', 'Vite 6', 'React Router', 'Recharts', 'Vanilla CSS'], color: '#1a73e8' },
  { category: 'Backend',          items: ['Python Flask', 'SQLAlchemy ORM', 'MySQL Database', 'PyMySQL', 'JWT Auth'], color: '#7b1fa2' },
  { category: 'Data Sources',     items: ['IMD Weather Service', 'OpenWeather API', 'ICAR Soil Database', 'SBI Cane Variety Records'], color: '#f59e0b' },
  { category: 'Python Stack',     items: ['Pandas', 'NumPy', 'Scikit-learn', 'XGBoost', 'Bcrypt', 'PyJWT'], color: '#ef4444' },
];

const objectives = [
  { n: '01', title: 'Predict sugarcane yield',          desc: 'Using trained Random Forest and XGBoost models on pure agronomic factors (zero satellite dependencies).' },
  { n: '02', title: 'Crop phenology tracking',          desc: '6-stage sugarcane growth tracker (Planting through Harvest) with days remaining and harvest estimation.' },
  { n: '03', title: 'Analyze weather impact',           desc: 'Integrate real-time and 7-day forecast weather to evaluate thermal and precipitation crop impacts.' },
  { n: '04', title: 'Soil intelligence',                desc: 'Field-level pH, moisture, and soil type assessment for sugarcane suitability.' },
  { n: '05', title: 'Variety comparison & advice',      desc: 'Compare Co 86032, Co 0238, CoC 671, Co 99004, and CoM 0265 with AI recommendations.' },
  { n: '06', title: 'Explainable AI (XAI)',             desc: 'Evidence-based feature contributions and agronomic factors explaining every prediction.' },
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
                and agricultural extension officers make data-driven decisions. It combines ground soil testing,
                real-time weather data, crop phenology, and historical field yield baselines to predict sugarcane
                yield with high accuracy using trained Random Forest and XGBoost regression models.
              </p>
              <p>
                The system was trained on <strong>7,861 validated data samples</strong> from major sugarcane-growing
                regions (Maharashtra, Karnataka, Uttar Pradesh, Tamil Nadu, Andhra Pradesh), achieving a
                <strong> 5-fold Cross-Validation R² of 0.8005 (80.1%)</strong> using pure agronomic variables without
                remote sensing or satellite imagery.
              </p>
              <div className="about-stats">
                {[
                  { v: '7,861',   l: 'Training Samples' },
                  { v: '80.1%',   l: 'CV R² Accuracy' },
                  { v: '8.8 t/ha',l: 'Mean Absolute Error' },
                  { v: '5',       l: 'Sugarcane Varieties' },
                ].map(s => (
                  <div key={s.l} className="about-stat">
                    <span className="as-val">{s.v}</span>
                    <span className="as-lbl">{s.l}</span>
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
