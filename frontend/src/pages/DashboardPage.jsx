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
      <header>
        <Brand />
        <button onClick={signout}>Sign out</button>
      </header>
      <section>
        <p className="eyebrow">AI Yield Forecasting Platform</p>
        <h1>Welcome, {user?.name?.split(' ')[0]}.</h1>
        <p>
          Your AI-powered sugarcane yield forecasting dashboard is ready. Analyze crop health using 
          Sentinel-2 NDVI data, predict yields with XGBoost and Random Forest models, compare 
          sugarcane varieties (Co 86032, CoC 671, CoM 0265), and make smarter agricultural decisions 
          with real-time weather and soil analysis.
        </p>
        <div className="dash-rule" />
        <small>SUGARYIELD AI · SMART AGRICULTURAL DECISION SUPPORT SYSTEM</small>
      </section>
    </main>
  );
}
