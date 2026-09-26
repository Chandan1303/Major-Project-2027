import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

const stats = [
  { value: '12,000+', label: 'Training Samples' },
  { value: '86.2%',   label: 'Model Accuracy (R²)' },
  { value: '5',       label: 'ML Models' },
  { value: '28',      label: 'Indian States' },
];

const features = [
  {
    icon: '🌾',
    title: 'Yield Prediction',
    desc: 'AI-powered forecasts using XGBoost, Random Forest, and ensemble methods trained on 12,000+ real samples.',
    path: '/prediction',
    color: '#2d7a3e',
  },
  {
    icon: '🛰️',
    title: 'Crop Health & NDVI',
    desc: 'Real-time satellite imagery from ISRO Bhuvan & Sentinel-2 to monitor vegetation health and detect stress.',
    path: '/crop-health',
    color: '#1a73e8',
  },
  {
    icon: '☁️',
    title: 'Weather Intelligence',
    desc: 'Live weather conditions, forecasts, and historical climate analysis with crop-impact assessments.',
    path: '/weather',
    color: '#0097a7',
  },
  {
    icon: '🪨',
    title: 'Soil Analysis',
    desc: 'Comprehensive soil type, pH, moisture, and nutrient analysis for optimal sugarcane cultivation.',
    path: '/soil',
    color: '#795548',
  },
  {
    icon: '🔬',
    title: 'Variety Comparison',
    desc: 'Compare Co 86032, CoC 671, Co 0238, CoM 0265, Co 99004 and more across soil, weather, and yield metrics.',
    path: '/varieties',
    color: '#7b1fa2',
  },
  {
    icon: '🤖',
    title: 'AI Insights',
    desc: 'Explainable AI — understand exactly why the model predicted a given yield with feature importance graphs.',
    path: '/insights',
    color: '#e65100',
  },
];

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const numeric = parseFloat(target.replace(/[^0-9.]/g, ''));
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const duration = 1600;
        const step = (timestamp) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount((eased * numeric).toFixed(numeric % 1 !== 0 ? 1 : 0));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  const prefix = target.includes('+') ? '+' : '';
  const pct = target.includes('%') ? '%' : '';
  return <span ref={ref}>{count}{pct}{prefix}</span>;
}

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="home-page">
        {/* Hero */}
        <section className="hero-section">
          <div className="hero-bg-orbs">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
          </div>
          <div className="hero-content">
            <span className="hero-badge">🌿 AI-Powered Agricultural Intelligence</span>
            <h1 className="hero-title">
              Smart Sugarcane<br />
              <span className="hero-gradient">Yield Forecasting</span>
            </h1>
            <p className="hero-subtitle">
              Predict sugarcane yield before harvest using Machine Learning, satellite NDVI imagery,
              real-time weather data, and soil analysis. Make smarter, data-driven farming decisions.
            </p>
            <div className="hero-actions">
              <button className="hero-cta" onClick={() => navigate('/prediction')}>
                🌾 Predict Yield Now
              </button>
              <button className="hero-secondary" onClick={() => navigate('/dashboard')}>
                View Dashboard →
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card-float">
              <div className="float-card fc-1">
                <span className="fc-icon">📈</span>
                <span className="fc-label">Predicted Yield</span>
                <span className="fc-value">72.4 t/ha</span>
              </div>
              <div className="float-card fc-2">
                <span className="fc-icon">🛰️</span>
                <span className="fc-label">NDVI Score</span>
                <span className="fc-value">0.78 — Healthy</span>
              </div>
              <div className="float-card fc-3">
                <span className="fc-icon">🎯</span>
                <span className="fc-label">Confidence</span>
                <span className="fc-value">91.3%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="stats-section">
          {stats.map((s) => (
            <div className="stat-pill" key={s.label}>
              <span className="stat-pill-value">
                <AnimatedCounter target={s.value} />
              </span>
              <span className="stat-pill-label">{s.label}</span>
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="features-section">
          <div className="section-header">
            <span className="eyebrow">Platform Features</span>
            <h2>Everything you need for precision agriculture</h2>
            <p>From raw satellite data to actionable farming insights — all in one platform.</p>
          </div>
          <div className="features-grid">
            {features.map((f) => (
              <div
                className="feature-card"
                key={f.title}
                onClick={() => navigate(f.path)}
                style={{ '--card-accent': f.color }}
              >
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <span className="feature-link">Explore →</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="cta-banner">
          <div className="cta-banner-content">
            <h2>Ready to predict your next harvest?</h2>
            <p>Enter your field conditions and get an AI-powered yield estimate in seconds.</p>
            <button className="hero-cta" onClick={() => navigate('/prediction')}>
              Start Prediction →
            </button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
