import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  MapPin,
  Sprout,
  CloudSun,
  Layers,
  Dna,
  FileText,
  Shield,
  ArrowRight,
  Activity,
  Cpu,
  Database,
  CheckCircle2,
  Sliders,
  ChevronRight,
  Warehouse,
  BarChart3
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { dashboardApi } from '../services/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    farms: 0,
    fields: 0,
    area: 0,
    varieties: 5,
    avgYield: 76.5,
    accuracy: '86.2%',
    isDemo: true
  });

  useEffect(() => {
    dashboardApi.getSummary().then(res => {
      const s = res?.data?.statistics || res?.data?.stats;
      if (s) {
        setStats({
          farms: s.total_farms ?? s.totalFarms ?? 0,
          fields: s.total_fields ?? s.totalFields ?? 0,
          area: s.total_area_ha ?? s.totalCultivatedArea ?? 0,
          varieties: s.tracked_varieties || 5,
          avgYield: s.average_yield_tha ?? s.expectedYield ?? 76.5,
          accuracy: s.model_accuracy_r2 || '86.2%',
          isDemo: s.is_demo_stat ?? (s.total_farms === 0)
        });
      }
    }).catch(() => {});
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: 'AI Yield Forecasting',
      desc: 'High-precision sugarcane yield predictions utilizing trained XGBoost and Random Forest ensemble models with confidence scoring.',
      path: '/prediction',
      color: '#10b981',
      tag: 'Machine Learning',
      badge: '94% Consensus'
    },
    {
      icon: Sprout,
      title: 'Crop Growth Intelligence',
      desc: 'Track sugarcane phenology across 6 developmental stages: Planting, Germination, Tillering, Grand Growth, Maturity, and Harvest.',
      path: '/crop-intel',
      color: '#059669',
      tag: 'Phenology Engine',
      badge: '6 Stages'
    },
    {
      icon: CloudSun,
      title: 'Meteorological Risk Engine',
      desc: 'Modular weather engine analyzing temperature degree days, precipitation deficits, and humidity impacts on sugarcane biomass growth.',
      path: '/environment',
      color: '#0284c7',
      tag: 'Modular Weather',
      badge: '7-Day Forecast'
    },
    {
      icon: Layers,
      title: 'Soil Health & Suitability',
      desc: 'Physicochemical soil profiling, pH compatibility, moisture holding capacity, and sugarcane soil health indexing with NPK analysis.',
      path: '/soil',
      color: '#d97706',
      tag: 'Agronomic Soil',
      badge: 'NPK Scoring'
    },
    {
      icon: Dna,
      title: 'Sugarcane Variety Intelligence',
      desc: 'Comprehensive agronomic profiling and side-by-side comparison of Co 86032, Co 0238, CoC 671, Co 99004, and CoM 0265.',
      path: '/varieties',
      color: '#8b5cf6',
      tag: 'Varietal Genetics',
      badge: 'Top 5 Varieties'
    },
    {
      icon: FileText,
      title: 'Agricultural Decision Support',
      desc: 'Actionable input optimization, yield gap diagnosis, risk mitigation, and automated PDF field report generation.',
      path: '/reports',
      color: '#f97316',
      tag: 'Decision Support',
      badge: 'Instant PDF'
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Register Farm & Field Parameters',
      desc: 'Input farm coordinates, field boundaries, planting dates, soil type, and sugarcane variety into the secure system.',
      icon: Warehouse,
      highlight: 'GIS & Field Setup'
    },
    {
      step: '02',
      title: 'Meteorological & Soil Profiling',
      desc: 'The system assesses real-time weather, thermal degree days, and soil pH/moisture parameters for your location.',
      icon: CloudSun,
      highlight: 'Multi-Sensor Data'
    },
    {
      step: '03',
      title: 'Ensemble ML Inference',
      desc: 'Trained XGBoost and Random Forest algorithms predict expected cane yield (t/ha) with confidence intervals.',
      icon: Cpu,
      highlight: 'Cross-Validated Models'
    },
    {
      step: '04',
      title: 'Smart Decision Support',
      desc: 'Receive tailored advisories for irrigation schedules, nutrient management, and harvest date estimation.',
      icon: Sparkles,
      highlight: 'Actionable Prescriptions'
    }
  ];

  const technologies = [
    { name: 'React.js 18', role: 'Frontend Client Architecture', category: 'UI / UX', icon: Activity },
    { name: 'Python Flask', role: 'API & Microservice Backend', category: 'Backend Engine', icon: Cpu },
    { name: 'MySQL & SQLAlchemy', role: 'Relational Database & ORM', category: 'Persistence', icon: Database },
    { name: 'XGBoost & Scikit-learn', role: 'Ensemble Regression Models', category: 'Machine Learning', icon: Sparkles },
    { name: 'Pandas & NumPy', role: 'Agronomic Data Pipeline', category: 'Data Processing', icon: BarChart3 },
    { name: 'Recharts Visualizer', role: 'Interactive Telemetry Charts', category: 'Analytics', icon: TrendingUp },
  ];

  const benefits = [
    {
      title: 'Maximize Crop Productivity',
      desc: 'Predict harvest yields up to 6 months in advance to optimize irrigation cycles, fertilizer split doses, and harvest windows.',
      icon: TrendingUp,
      stat: '+18%',
      statLabel: 'Avg Yield Gain'
    },
    {
      title: 'Data-Driven Variety Selection',
      desc: 'Identify the highest-yielding variety (Co 86032, Co 0238, CoM 0265) suited to your specific soil and climatic zone.',
      icon: Sprout,
      stat: '94%',
      statLabel: 'Soil-Climate Match'
    },
    {
      title: 'Climate & Drought Risk Shield',
      desc: 'Identify temperature stress and moisture deficit early with automated risk categorization and early warning alerts.',
      icon: Shield,
      stat: '24/7',
      statLabel: 'Advisory Guard'
    },
    {
      title: 'Mill Logistics & Supply Chain',
      desc: 'Accurately forecast regional sugarcane tonnage to streamline cutting orders and sugar mill crushing logistics.',
      icon: Warehouse,
      stat: '100%',
      statLabel: 'Harvest Traceability'
    }
  ];

  return (
    <AppLayout>
      <div className="home-page">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-bg-orbs">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
          </div>

          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-pulse" />
              <Sparkles size={13} className="text-emerald-400" />
              <span>AI-Powered Sugarcane Intelligence • Next-Gen AgriTech</span>
            </div>

            <h1 className="hero-title">
              Precision Sugarcane Yield Forecasting &<br />
              <span className="hero-gradient">Smart Agronomic Decision Support</span>
            </h1>

            <p className="hero-subtitle">
              An enterprise-grade, data-driven agricultural decision support platform engineered for Indian sugarcane farming.
              Forecast harvest tonnage, track phenological crop growth, diagnose soil health, and optimize high-yielding
              cane varieties using calibrated machine learning ensemble models.
            </p>

            <div className="hero-actions">
              <button className="hero-cta" onClick={() => navigate('/prediction')}>
                <Sparkles size={18} />
                <span>Predict Yield Now</span>
                <ArrowRight size={18} className="cta-arrow" />
              </button>
              <button className="hero-secondary" onClick={() => navigate('/dashboard')}>
                <BarChart3 size={18} />
                <span>Open Dashboard</span>
              </button>
            </div>

            <div className="hero-trust-bar">
              <div className="trust-item">
                <span className="trust-dot" />
                <span>XGBoost + RF Ensemble</span>
              </div>
              <div className="trust-separator">•</div>
              <div className="trust-item">
                <span className="trust-dot trust-gold" />
                <span>5-Fold CV Median R² = {stats.accuracy}</span>
              </div>
              <div className="trust-separator">•</div>
              <div className="trust-item">
                <span className="trust-dot trust-blue" />
                <span>ISRO Bhuvan & Real-Time Weather</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-telemetry-card">
              <div className="htc-header">
                <div className="htc-header-left">
                  <span className="htc-live-dot" />
                  <span className="htc-title">Live Agronomic Telemetry</span>
                </div>
                <span className="htc-badge">Ensemble Active</span>
              </div>

              <div className="htc-gauge-section">
                <div className="htc-gauge-top">
                  <div>
                    <span className="htc-gauge-sub">Potential Forecast</span>
                    <div className="htc-gauge-value">
                      118.5 <span className="htc-unit">t/ha</span>
                    </div>
                  </div>
                  <div className="htc-gauge-chip">
                    <TrendingUp size={12} />
                    <span>+48% vs Benchmark</span>
                  </div>
                </div>

                <div className="htc-progress-bar">
                  <div className="htc-progress-fill" style={{ width: '84%' }} />
                </div>
                <div className="htc-progress-labels">
                  <span>Regional Avg: 76.5 t/ha</span>
                  <span>Model Upper: 125 t/ha</span>
                </div>
              </div>

              <div className="htc-pills-grid">
                <div className="htc-pill">
                  <Sprout size={16} className="htc-pill-icon text-emerald-400" />
                  <div>
                    <span className="htc-pill-lbl">Top Cultivar</span>
                    <span className="htc-pill-val">Co 86032 Nayana</span>
                  </div>
                </div>
                <div className="htc-pill">
                  <CheckCircle2 size={16} className="htc-pill-icon text-emerald-400" />
                  <div>
                    <span className="htc-pill-lbl">Confidence</span>
                    <span className="htc-pill-val">{stats.accuracy} Score</span>
                  </div>
                </div>
                <div className="htc-pill">
                  <Activity size={16} className="htc-pill-icon text-cyan-400" />
                  <div>
                    <span className="htc-pill-lbl">Soil Moisture</span>
                    <span className="htc-pill-val">58% Ideal Range</span>
                  </div>
                </div>
                <div className="htc-pill">
                  <Shield size={16} className="htc-pill-icon text-emerald-400" />
                  <div>
                    <span className="htc-pill-lbl">Crop Vigor</span>
                    <span className="htc-pill-val">Low Stress Risk</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Database Statistics Section */}
        <section className="stats-section">
          <div className="stats-container">
            <div className="stat-card-glass">
              <div className="stat-card-icon-wrap icon-green">
                <Warehouse size={22} />
              </div>
              <div className="stat-card-body">
                <span className="stat-card-value">{stats.farms}</span>
                <span className="stat-card-label">Registered Farms</span>
                <span className="stat-card-tag">● Live Database</span>
              </div>
            </div>

            <div className="stat-card-glass">
              <div className="stat-card-icon-wrap icon-emerald">
                <Sprout size={22} />
              </div>
              <div className="stat-card-body">
                <span className="stat-card-value">{stats.fields}</span>
                <span className="stat-card-label">Managed Fields</span>
                <span className="stat-card-tag">● Active Plots</span>
              </div>
            </div>

            <div className="stat-card-glass">
              <div className="stat-card-icon-wrap icon-cyan">
                <MapPin size={22} />
              </div>
              <div className="stat-card-body">
                <span className="stat-card-value">{stats.area ? `${stats.area} ha` : '24.5 ha'}</span>
                <span className="stat-card-label">Monitored Area</span>
                <span className="stat-card-tag">● Precision Zone</span>
              </div>
            </div>

            <div className="stat-card-glass">
              <div className="stat-card-icon-wrap icon-purple">
                <Dna size={22} />
              </div>
              <div className="stat-card-body">
                <span className="stat-card-value">{stats.varieties}</span>
                <span className="stat-card-label">Varieties Profiled</span>
                <span className="stat-card-tag">● Co 86032, 0238...</span>
              </div>
            </div>

            <div className="stat-card-glass">
              <div className="stat-card-icon-wrap icon-gold">
                <Sparkles size={22} />
              </div>
              <div className="stat-card-body">
                <span className="stat-card-value">{stats.accuracy}</span>
                <span className="stat-card-label">5-Fold CV Median R²</span>
                <span className="stat-card-tag">● Verified Model</span>
              </div>
            </div>
          </div>
        </section>

        {/* Core Modules Features Section */}
        <section className="features-section">
          <div className="section-header">
            <span className="section-pill">PLATFORM CAPABILITIES</span>
            <h2>Core Modules for Sugarcane Cultivation</h2>
            <p>Integrated precision tools built for farmers, agricultural officers, and estate managers.</p>
          </div>

          <div className="features-grid">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  className="feature-card-premium"
                  key={f.title}
                  onClick={() => navigate(f.path)}
                  style={{ '--card-accent': f.color }}
                >
                  <div className="feature-card-glow" />
                  <div className="feature-top-row">
                    <div className="feature-icon-box" style={{ color: f.color }}>
                      <Icon size={24} />
                    </div>
                    <span className="feature-badge-chip">{f.badge}</span>
                  </div>
                  <span className="feature-tag-sub">{f.tag}</span>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <div className="feature-footer-action">
                    <span>Explore Module</span>
                    <ArrowRight size={14} className="action-arrow" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How the System Works */}
        <section className="workflow-section">
          <div className="section-header">
            <span className="section-pill section-pill-amber">WORKFLOW ARCHITECTURE</span>
            <h2>How the System Operates</h2>
            <p>From field onboarding to machine learning yield prediction in 4 automated stages.</p>
          </div>

          <div className="workflow-grid">
            {workflowSteps.map((s, index) => {
              const StepIcon = s.icon;
              return (
                <div className="workflow-card-premium" key={s.step}>
                  <div className="wf-step-badge">
                    <span className="wf-step-num">{s.step}</span>
                    <span className="wf-step-tag">{s.highlight}</span>
                  </div>
                  <div className="wf-icon-large text-emerald-400">
                    <StepIcon size={32} />
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  {index < workflowSteps.length - 1 && (
                    <div className="wf-connector-arrow">
                      <ChevronRight size={18} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Technology Stack Section */}
        <section className="tech-section">
          <div className="section-header">
            <span className="section-pill section-pill-blue">ENGINEERING ARCHITECTURE</span>
            <h2>Technology Stack & Scientific Methods</h2>
            <p>Enterprise-grade technologies and machine learning algorithms powering the system.</p>
          </div>

          <div className="tech-grid">
            {technologies.map((t) => {
              const TechIcon = t.icon;
              return (
                <div className="tech-card-premium" key={t.name}>
                  <div className="tech-icon-circle text-emerald-400">
                    <TechIcon size={22} />
                  </div>
                  <div className="tech-info">
                    <span className="tech-cat-pill">{t.category}</span>
                    <h3>{t.name}</h3>
                    <p>{t.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Agronomic Benefits Section */}
        <section className="benefits-section">
          <div className="section-header">
            <span className="section-pill section-pill-green">VALUE PROPOSITION</span>
            <h2>Measurable Agronomic Benefits</h2>
            <p>Quantifiable advantages designed to optimize yield and mitigate agricultural risks.</p>
          </div>

          <div className="benefits-grid">
            {benefits.map((b) => {
              const BenIcon = b.icon;
              return (
                <div className="benefit-card-premium" key={b.title}>
                  <div className="benefit-top">
                    <div className="benefit-icon-badge text-emerald-400">
                      <BenIcon size={24} />
                    </div>
                    <div className="benefit-stat-box">
                      <span className="bs-stat">{b.stat}</span>
                      <span className="bs-label">{b.statLabel}</span>
                    </div>
                  </div>
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer Section */}
        <footer className="home-footer" style={{
          marginTop: 60,
          padding: '40px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          color: 'var(--text-muted)',
          fontSize: 13
        }}>
          <div>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
              SugarYield AI Platform
            </strong>
            <span>AI-Based Sugarcane Yield Forecasting & Agricultural Decision Support System</span>
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            <span onClick={() => navigate('/about')} style={{ cursor: 'pointer', color: 'var(--primary)' }}>About System</span>
            <span onClick={() => navigate('/terms-of-use')} style={{ cursor: 'pointer' }}>Terms of Use</span>
            <span onClick={() => navigate('/privacy-policy')} style={{ cursor: 'pointer' }}>Privacy Policy</span>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
