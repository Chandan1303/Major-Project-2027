import React from 'react';
import { useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <Brand />
        <nav className="dashboard-nav">
          <button onClick={() => navigate('/dashboard')} className="nav-link active">Dashboard</button>
          <button onClick={() => navigate('/prediction')} className="nav-link">Predict Yield</button>
          <button onClick={signout} className="signout-btn">Sign out</button>
        </nav>
      </header>
      
      <section className="dashboard-content">
        <div className="dashboard-welcome">
          <p className="eyebrow">AI Yield Forecasting Platform</p>
          <h1>Welcome back, {user?.name?.split(' ')[0]}.</h1>
          <p className="subtitle">
            Your AI-powered sugarcane yield forecasting dashboard is ready. Analyze crop health using 
            Sentinel-2 NDVI data, predict yields with XGBoost and Random Forest models, and make smarter 
            agricultural decisions with real-time analysis.
          </p>
        </div>
        
        <div className="dashboard-cards">
          <div className="dash-card" onClick={() => navigate('/prediction')}>
            <div className="dash-card-icon">🌾</div>
            <h3>Yield Prediction</h3>
            <p>Get accurate yield forecasts using advanced ML models trained on 12,000+ samples</p>
            <button className="dash-card-btn">Start Prediction →</button>
          </div>
          
          <div className="dash-card">
            <div className="dash-card-icon">📊</div>
            <h3>Model Performance</h3>
            <p>5 models with cross-validation • MEDIAN aggregation • 86% accuracy</p>
            <div className="dash-stats">
              <div className="stat">
                <span className="stat-value">86.2%</span>
                <span className="stat-label">R² Score</span>
              </div>
              <div className="stat">
                <span className="stat-value">12.1</span>
                <span className="stat-label">RMSE (t/ha)</span>
              </div>
            </div>
          </div>
          
          <div className="dash-card">
            <div className="dash-card-icon">🛰️</div>
            <h3>Data Sources</h3>
            <p>Real-time satellite imagery and agricultural data integration</p>
            <ul className="dash-list">
              <li>ISRO Bhuvan API</li>
              <li>Weather Data</li>
              <li>Soil Analysis</li>
              <li>NDVI Monitoring</li>
            </ul>
          </div>
        </div>

        <div className="dash-footer">
          <small>SUGARYIELD AI · SMART AGRICULTURAL DECISION SUPPORT SYSTEM</small>
        </div>
      </section>
    </main>
  );
}
