import React from 'react';
import { Link } from 'react-router-dom';
import Brand from '../components/Brand';

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function LeafIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 4c-8 0-14 3-14 10a6 6 0 0 0 6 6c7 0 10-6 8-16Z" /><path d="M4 21c3-6 7-9 12-12" /></svg>;
}

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Brand />
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#platform">Platform</a>
          <a href="#approach">Approach</a>
        </nav>
        <div className="landing-actions">
          <Link className="landing-signin" to="/login">Sign in</Link>
          <Link className="button button-dark button-small" to="/signup">Create account <ArrowIcon /></Link>
        </div>
      </header>

      <section className="landing-hero" id="platform">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="kicker-line" /> AGRICULTURE, WITH MORE SIGNAL</div>
          <h1>See the season<br />before the <em>harvest.</em></h1>
          <p className="hero-description">A clearer view of sugarcane yield potential, bringing crop conditions, weather, soil, and machine learning into one considered workspace.</p>
          <div className="hero-actions">
            <Link className="button button-dark" to="/signup">Get started <ArrowIcon /></Link>
            <Link className="text-link" to="/login">Sign in to your workspace</Link>
          </div>
          <div className="hero-proof"><span className="proof-mark"><LeafIcon /></span><span>Built for more informed growing decisions</span></div>
        </div>

        <div className="hero-visual" aria-label="Sugarcane field and yield forecasting workspace preview">
          <img className="field-photo" src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1500&q=85" alt="Cultivated green fields under a soft morning sky" />
          <div className="visual-shade" />
          <div className="visual-caption"><span className="caption-dot" /> FIELD INTELLIGENCE <span className="caption-rule" /> INDIA</div>
          <div className="preview-panel">
            <div className="preview-topline"><span>FIELD OVERVIEW</span><span className="preview-period">SEASONAL VIEW</span></div>
            <div className="preview-title">A more complete picture<br />of crop potential.</div>
            <div className="preview-map" aria-hidden="true">
              <div className="map-grid" />
              <div className="map-field field-one" />
              <div className="map-field field-two" />
              <div className="map-field field-three" />
              <div className="map-marker"><LeafIcon /></div>
            </div>
            <div className="preview-footer"><span>Crop · Weather · Soil</span><span className="preview-arrow"><ArrowIcon /></span></div>
          </div>
          <div className="image-index"><span>01</span><i /> SUGARCANE YIELD INTELLIGENCE</div>
        </div>
        <div className="hero-index" aria-hidden="true">01 — 03</div>
      </section>

      <section className="landing-intro" id="approach">
        <p className="section-label">A decision workspace for every season</p>
        <div className="intro-grid">
          <h2>From scattered variables<br />to a <em>clearer decision.</em></h2>
          <p>Bring the factors that shape a sugarcane crop into one place. Explore a forecast, understand the conditions behind it, and carry a concise report into your next conversation.</p>
        </div>
      </section>

      <section className="feature-strip" aria-label="Platform capabilities">
        <article className="feature-item">
          <span className="feature-index">01</span>
          <div className="feature-icon"><LeafIcon /></div>
          <h3>Crop context</h3>
          <p>Choose a growing state, variety, season, and cultivated area.</p>
        </article>
        <article className="feature-item">
          <span className="feature-index">02</span>
          <div className="feature-icon feature-weather"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17.5a4.5 4.5 0 0 1 .6-8.96A6 6 0 0 1 19 10.5a3.5 3.5 0 0 1-.5 7H7Z" /><path d="m9 20-1 2m6-2-1 2m6-2-1 2" /></svg></div>
          <h3>Growing conditions</h3>
          <p>Include rainfall, temperature, soil nutrients, and irrigation.</p>
        </article>
        <article className="feature-item">
          <span className="feature-index">03</span>
          <div className="feature-icon feature-report"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2V5.75a2 2 0 0 1 2-2Z" /><path d="M14 4v4h4M8.5 13h7m-7 3.5h7" /></svg></div>
          <h3>Readable outcomes</h3>
          <p>Review the forecast analysis and download a shareable report.</p>
        </article>
      </section>

      <footer className="landing-footer">
        <Brand />
        <span>Smart agricultural decision support</span>
        <div><Link to="/terms-of-use">Terms</Link><Link to="/privacy-policy">Privacy</Link><span>© SugarYield AI</span></div>
      </footer>
    </main>
  );
}