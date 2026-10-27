import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  CloudSun,
  Sprout,
  ShieldCheck,
  Sparkles,
  Layers,
  Radio,
  Cpu
} from 'lucide-react';
import AuthThemeSwitcher from '../components/AuthThemeSwitcher';
import Brand from '../components/Brand';

export default function AuthLayout({ children, compact = false, variant = 'legacy' }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('sugaryield_auth_theme') || 'emerald';
    } catch {
      return 'emerald';
    }
  });

  const handleSelectTheme = (newTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('sugaryield_auth_theme', newTheme);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-auth-theme', theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  if (variant === 'modern') {
    return (
      <main className="auth-rebuilt-shell">
        <aside className="auth-rebuilt-hero">
          <div className="auth-rebuilt-ambient auth-rebuilt-ambient-one" aria-hidden="true" />
          <div className="auth-rebuilt-ambient auth-rebuilt-ambient-two" aria-hidden="true" />
          <div className="auth-rebuilt-hero-top">
            <Brand />
            <span className="auth-rebuilt-caption">INTELLIGENCE FOR EVERY GROWING SEASON</span>
          </div>
          <div className="auth-rebuilt-hero-copy">
            <div className="auth-rebuilt-pill"><span /><Sprout size={14} />SUGARCANE INTELLIGENCE <i /> FARM-FOCUSED</div>
            <div className="auth-rebuilt-overline">A smarter way to understand your field</div>
            <h1>Better insight.<br /><em>Stronger harvests.</em></h1>
            <p>One connected place to explore yield forecasts, review field conditions, and plan your next farming decisions.</p>
            <div className="auth-rebuilt-feature-heading"><span>TOOLS FOR YOUR FARM</span><span className="auth-rebuilt-feature-rule" /></div>
            <div className="auth-rebuilt-features">
              <div className="auth-rebuilt-feature"><span className="auth-rebuilt-feature-icon"><TrendingUp size={19} strokeWidth={2.2} /></span><div><strong>Yield forecasting</strong><small>Explore estimates from your farm inputs.</small></div><span className="auth-rebuilt-feature-index">01</span></div>
              <div className="auth-rebuilt-feature"><span className="auth-rebuilt-feature-icon"><CloudSun size={19} strokeWidth={2.1} /></span><div><strong>Weather and soil insights</strong><small>Review the field information available to you.</small></div><span className="auth-rebuilt-feature-index">02</span></div>
              <div className="auth-rebuilt-feature"><span className="auth-rebuilt-feature-icon"><Sprout size={19} strokeWidth={2.1} /></span><div><strong>Practical farm decisions</strong><small>Keep records and planning in one place.</small></div><span className="auth-rebuilt-feature-index">03</span></div>
            </div>
          </div>
          <footer className="auth-rebuilt-hero-footer"><span><Sprout size={14} />SugarYield AI <i /> Sugarcane decision support</span><span><ShieldCheck size={13} />FARMER-CENTRED DESIGN</span></footer>
        </aside>
        <section className="auth-rebuilt-main">
          <div className="auth-rebuilt-mobile-brand"><Brand /><span>INTELLIGENCE FOR EVERY GROWING SEASON</span></div>
          <div className="auth-rebuilt-card-wrap">{children}</div>
        </section>
      </main>
    );
  }

  return (
    <div className={`auth-shell ${compact ? 'compact' : ''}`} data-auth-theme={theme}>
      {/* Visual Theme Selector Toolbar */}
      <AuthThemeSwitcher currentTheme={theme} onSelectTheme={handleSelectTheme} />

      {/* Atmospheric Aurora Glow & Background Layers */}
      <div className="auth-aurora-glow" aria-hidden="true" />
      <div className="auth-bg-overlay" aria-hidden="true" />

      {/* Ambient Bio-Particles */}
      <div className="auth-particles-wrap" aria-hidden="true">
        <span className="auth-particle p1" />
        <span className="auth-particle p2" />
        <span className="auth-particle p3" />
        <span className="auth-particle p4" />
        <span className="auth-particle p5" />
      </div>

      <div className="auth-layout-container">
        {/* LEFT SECTION – EDITORIAL & AGRONOMIC HERO */}
        <aside className="editorial-panel">
          {/* Brand Header */}
          <div className="auth-brand-wrap">
            <Link to="/" className="auth-brand-link" aria-label="SugarYield AI Home">
              <div className="auth-logo-badge">
                <div className="auth-logo-pulse-ring" />
                <Sprout size={22} className="auth-logo-sprout-icon" />
              </div>
              <div className="auth-brand-text">
                <span className="auth-brand-title">
                  SugarYield <span className="brand-accent">AI</span>
                </span>
                <span className="auth-brand-sub">INTELLIGENCE FOR EVERY GROWING SEASON</span>
              </div>
            </Link>
          </div>

          {/* Panel Main Storytelling Copy */}
          <div className="panel-copy">
            {/* Live Telemetry Status Pill */}
            <div className="editorial-pill">
              <span className="pill-pulse-dot" />
              <Radio size={12} className="pill-icon" />
              <span>AI AGRICULTURE • BUILT FOR GROWERS</span>
            </div>

            {/* Dynamic Hero Headline */}
            <h1 className="hero-heading">
              Grow Smarter.<br />
              <span className="hero-gradient-text">Harvest Better.</span>
            </h1>

            {/* Hero Subtitle */}
            <p className="hero-subtext">
              Harness enterprise-grade artificial intelligence and Sentinel-2 satellite telemetry
              to forecast sugarcane yields, detect crop stress early, and optimize field tonnage.
            </p>

            {/* 3 Telemetry Feature Cards */}
            <div className="editorial-features-grid">
              <div className="ef-item">
                <div className="ef-icon-wrap">
                  <TrendingUp size={20} className="ef-icon" />
                </div>
                <div className="ef-content">
                  <div className="ef-title-row">
                    <strong>AI-Powered Yield Prediction</strong>
                    <span className="ef-badge">94.8% Accuracy</span>
                  </div>
                  <span>High-precision ML forecasting to optimize field tonnage and harvest scheduling</span>
                </div>
              </div>

              <div className="ef-item">
                <div className="ef-icon-wrap">
                  <CloudSun size={20} className="ef-icon" />
                </div>
                <div className="ef-content">
                  <div className="ef-title-row">
                    <strong>Smart Weather & Soil Insights</strong>
                    <span className="ef-badge">Real-Time Telemetry</span>
                  </div>
                  <span>Microclimate tracking, precipitation forecasting & soil health intelligence</span>
                </div>
              </div>

              <div className="ef-item">
                <div className="ef-icon-wrap">
                  <Cpu size={20} className="ef-icon" />
                </div>
                <div className="ef-content">
                  <div className="ef-title-row">
                    <strong>Data-Driven Agronomic Decisions</strong>
                    <span className="ef-badge">100% Crop-Specific</span>
                  </div>
                  <span>Cycle recommendations calibrated for Co-86032, Co-0238 & regional cultivars</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Footer */}
          <div className="panel-footer">
            <span className="panel-footer-text">
              <span className="panel-footer-sprout">🌱</span> Thoughtful technology. Stronger harvests.
            </span>
            <div className="auth-footer-mark">
              <ShieldCheck size={14} />
              <span>FARMER FIRST INSIGHTS • ISO-27001 SECURED</span>
            </div>
          </div>
        </aside>

        {/* RIGHT SECTION – FLOATING AUTHENTICATION CARD */}
        <section className="form-panel">
          <div className="mobile-brand">
            <Link to="/" className="auth-brand-link">
              <div className="auth-logo-badge">
                <Sprout size={20} color="#ffffff" />
              </div>
              <div className="auth-brand-text">
                <span className="auth-brand-title">SugarYield AI</span>
                <span className="auth-brand-sub">INTELLIGENCE FOR EVERY GROWING SEASON</span>
              </div>
            </Link>
          </div>
          <div className="auth-card-wrapper">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
