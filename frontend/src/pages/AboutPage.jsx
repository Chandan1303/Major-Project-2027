import React from 'react';
import {
  Sprout, Award, CheckCircle2, Cpu, Code2, Database, Server,
  GraduationCap, Users, Target, ShieldCheck, Sparkles, Layers,
  Compass, ExternalLink
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';

const team = [
  { name: 'Team Member 1', role: 'ML Engineer & Python Backend', color: '#10b981' },
  { name: 'Team Member 2', role: 'Frontend & UI/UX Architect',   color: '#3b82f6' },
  { name: 'Team Member 3', role: 'Agronomy & Decision Support',  color: '#8b5cf6' },
  { name: 'Team Member 4', role: 'Database & Systems Engineer',  color: '#f59e0b' },
];

const technologies = [
  { category: 'Machine Learning', icon: Cpu, items: ['Random Forest Regressor', 'XGBoost Regressor', 'Explainable AI (Shapley)', '5-Fold Cross-Validation', 'Scikit-learn'], color: '#10b981' },
  { category: 'Frontend Architecture', icon: Code2, items: ['React 18', 'Vite 6', 'React Router v6', 'Recharts', 'Vanilla Design System', 'Lucide Icons'], color: '#3b82f6' },
  { category: 'Backend Framework', icon: Server, items: ['Python Flask', 'SQLAlchemy ORM', 'PyMySQL', 'JWT Auth Protocol', 'RESTful API'], color: '#8b5cf6' },
  { category: 'Agronomic Sources', icon: Database, items: ['IMD Regional Weather', 'OpenWeather API', 'ICAR Edaphic Benchmarks', 'SBI Sugarcane Varieties'], color: '#f59e0b' },
];

const objectives = [
  { n: '01', title: 'Deterministic Yield Forecasting', desc: 'Dual-model consensus (Random Forest + XGBoost) trained strictly on grounded agronomic & meteorological telemetry.' },
  { n: '02', title: '6-Stage Phenological Tracking', desc: 'Field-level phenology from Sett Planting through Ripening and Harvest with active timeline milestones.' },
  { n: '03', title: 'Agro-Meteorological Risk Monitoring', desc: 'Real-time thermal degrees, precipitation deficits, and air moisture tracking across growth stages.' },
  { n: '04', title: 'Edaphic Soil Chemistry & NPK Auditing', desc: 'Continuous evaluation of soil pH, organic carbon, and moisture dynamics tailored to sugarcane cultivars.' },
  { n: '05', title: 'Multi-Varietal Yield Gap Diagnostics', desc: 'Quantify real losses against genetic potential benchmarks (Co 86032, Co 0238, CoC 671, Co 99004, CoM 0265).' },
  { n: '06', title: 'Explainable AI & Transparent Inference', desc: 'Local feature attributions explaining positive boosters and negative limiting factors for every prediction.' },
];

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="page-container">
        
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              <Sprout size={13} /> Project Documentation & Institutional Charter
            </div>
            <h1 className="page-title" style={{ margin: '0 0 6px' }}>SugarYield AI Platform</h1>
            <p className="page-subtitle" style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Next-generation AI yield forecasting and precision agronomic decision support system for sugarcane agriculture.
            </p>
          </div>
          <Badge variant="success">Final Academic Major Project 2026–27</Badge>
        </div>

        {/* Hero Architecture Card */}
        <div
          className="card"
          style={{
            padding: 28,
            borderRadius: 18,
            border: '1px solid var(--border-color)',
            background: 'var(--card-bg)',
            marginBottom: 24,
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'var(--primary-glow)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Sprout size={28} />
            </div>

            <div style={{ flex: 1, minWidth: 300 }}>
              <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                Agricultural Mission & Architecture Overview
              </h2>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong>SugarYield AI</strong> is an end-to-end precision agricultural platform engineered to assist Indian sugarcane growers, agronomists, and extension officers in making data-driven decisions. By integrating field-level edaphic chemistry, live meteorological telemetry, 6-stage phenology tracking, and multi-year historical harvest records, it delivers verified yield forecasts powered by trained Random Forest and XGBoost regression ensembles.
              </p>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                The core machine learning engine was trained on <strong>7,861 validated field samples</strong> across India's premier sugarcane cultivating regions (Maharashtra, Karnataka, Uttar Pradesh, Tamil Nadu, Andhra Pradesh), achieving a verified <strong>5-Fold Cross-Validation R² of 0.8005 (80.1%)</strong> using pure agronomic parameters without remote sensing or satellite imagery dependencies.
              </p>
            </div>
          </div>
        </div>

        {/* Core Architectural Benchmarks */}
        <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 24 }}>
          <StatCard
            label="Training Dataset Volume"
            value="7,861"
            unit="records"
            icon={Database}
            color="emerald"
            subtitle="Multi-state verified samples"
          />
          <StatCard
            label="Cross-Validation R² Score"
            value="80.1%"
            unit=""
            icon={Award}
            color="blue"
            trend="5-Fold Generalization"
            subtitle="Mean test concordance"
          />
          <StatCard
            label="Mean Absolute Error"
            value="8.8"
            unit="t/ha"
            icon={Target}
            color="purple"
            subtitle="Residual spread across test set"
          />
          <StatCard
            label="Commercial Varieties"
            value="5"
            unit="cultivars"
            icon={Sprout}
            color="teal"
            subtitle="Co 86032, Co 0238, CoC 671…"
          />
        </div>

        {/* Project Objectives Grid */}
        <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>System Objectives & Scope</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Core functional milestones designed and implemented</span>
            </div>
            <Badge variant="primary">6 Pillars</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {objectives.map(o => (
              <div
                key={o.n}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: 16,
                  borderRadius: 12,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, padding: '4px 8px', borderRadius: 8, background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                  {o.n}
                </span>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{o.title}</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{o.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Architecture Grid */}
        <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Engineering & Technological Stack</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Integrated full-stack architecture</span>
            </div>
            <Badge variant="success">Modern Stack</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {technologies.map(t => {
              const Icon = t.icon;
              return (
                <div
                  key={t.category}
                  style={{
                    padding: 18,
                    borderRadius: 12,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderTop: `3px solid ${t.color}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Icon size={16} color={t.color} />
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t.category}</h4>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {t.items.map(item => (
                      <span
                        key={item}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team & Institutional Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          
          {/* Team Members */}
          <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} color="var(--primary)" /> Project Engineering Team
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {team.map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, background: 'var(--bg-secondary)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${m.color}22`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block' }}>{m.name}</strong>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Governance */}
          <div className="card" style={{ padding: 22, borderRadius: 16, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <GraduationCap size={16} color="var(--primary)" /> Academic & Faculty Supervision
            </h3>
            <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', display: 'block', marginBottom: 4 }}>
                PROJECT FACULTY GUIDE
              </span>
              <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Faculty Project Guide</h4>
              <p style={{ margin: '0 0 2px', fontSize: 12, color: 'var(--text-secondary)' }}>Department of Computer Science & Engineering</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>National Institute of Engineering (NIE), Mysuru</p>
            </div>

            <div style={{ padding: 12, borderRadius: 10, background: 'var(--primary-glow)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>DEGREE & ACADEMIC YEAR</span>
                <strong style={{ fontSize: 13, color: 'var(--primary)' }}>B.E. Computer Science & Engineering (2026–2027)</strong>
              </div>
              <Badge variant="success">Final Capstone</Badge>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
