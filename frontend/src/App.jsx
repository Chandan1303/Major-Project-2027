import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import DashboardPage from './pages/DashboardPage';
import PredictionPage from './pages/PredictionPage';
import TermsOfUsePage from './pages/TermsOfUsePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ProtectedRoute from './routes/ProtectedRoute';
import LandingPage from './pages/LandingPage';

// New pages
import HomePage from './pages/HomePage';
import NewDashboardPage from './pages/NewDashboardPage';
import CropHealthPage from './pages/CropHealthPage';
import WeatherPage from './pages/WeatherPage';
import SoilPage from './pages/SoilPage';
import VarietiesPage from './pages/VarietiesPage';
import YieldLossPage from './pages/YieldLossPage';
import InsightsPage from './pages/InsightsPage';
import FarmsPage from './pages/FarmsPage';
import ReportsPage from './pages/ReportsPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />
      <Route path="/terms-of-use" element={<TermsOfUsePage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      {/* Existing routes (kept for compatibility) */}
      <Route path="/dashboard-old" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

      {/* New main app routes */}
      <Route path="/home"        element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/dashboard"   element={<ProtectedRoute><NewDashboardPage /></ProtectedRoute>} />
      <Route path="/prediction"  element={<ProtectedRoute><PredictionPage /></ProtectedRoute>} />
      <Route path="/crop-health" element={<ProtectedRoute><CropHealthPage /></ProtectedRoute>} />
      <Route path="/weather"     element={<ProtectedRoute><WeatherPage /></ProtectedRoute>} />
      <Route path="/soil"        element={<ProtectedRoute><SoilPage /></ProtectedRoute>} />
      <Route path="/varieties"   element={<ProtectedRoute><VarietiesPage /></ProtectedRoute>} />
      <Route path="/yield-loss"  element={<ProtectedRoute><YieldLossPage /></ProtectedRoute>} />
      <Route path="/insights"    element={<ProtectedRoute><InsightsPage /></ProtectedRoute>} />
      <Route path="/farms"       element={<ProtectedRoute><FarmsPage /></ProtectedRoute>} />
      <Route path="/reports"     element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/about"       element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
