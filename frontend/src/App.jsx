import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';

// Auth pages
import LoginPage               from './pages/LoginPage';
import SignupPage              from './pages/SignupPage';
import ForgotPasswordPage      from './pages/ForgotPasswordPage';
import ResetPasswordPage       from './pages/ResetPasswordPage';
import VerifyEmailPage         from './pages/VerifyEmailPage';
import ResendVerificationPage  from './pages/ResendVerificationPage';
import TermsOfUsePage          from './pages/TermsOfUsePage';
import PrivacyPolicyPage       from './pages/PrivacyPolicyPage';

// App pages
import HomePage        from './pages/HomePage';
import NewDashboardPage from './pages/NewDashboardPage';
import FarmsPage       from './pages/FarmsPage';
import FarmMapPage     from './pages/FarmMapPage';
import PredictionPage  from './pages/PredictionPage';
import SimulatorPage   from './pages/SimulatorPage';
import CropIntelPage   from './pages/CropIntelPage';
import InsightsPage    from './pages/InsightsPage';
import EnvironmentPage  from './pages/EnvironmentPage';
import WeatherPage      from './pages/WeatherPage';
import SoilPage         from './pages/SoilPage';
import VarietiesPage    from './pages/VarietiesPage';
import YieldLossPage   from './pages/YieldLossPage';
import AnalyticsPage   from './pages/AnalyticsPage';
import ReportsPage     from './pages/ReportsPage';
import ChatPage        from './pages/ChatPage';
import AlertsPage      from './pages/AlertsPage';
import ProfilePage     from './pages/ProfilePage';
import AboutPage       from './pages/AboutPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import OfficerDashboardPage from './pages/OfficerDashboardPage';

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <Routes>
      {/* Public auth */}
      <Route path="/"                    element={<LoginPage />} />
      <Route path="/login"               element={<LoginPage />} />
      <Route path="/signup"              element={<SignupPage />} />
      <Route path="/forgot-password"     element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />
      <Route path="/terms-of-use"        element={<TermsOfUsePage />} />
      <Route path="/privacy-policy"      element={<PrivacyPolicyPage />} />

      {/* Protected app */}
      <Route path="/home"        element={<Protected><HomePage /></Protected>} />
      <Route path="/dashboard"   element={<Protected><NewDashboardPage /></Protected>} />
      <Route path="/farms"       element={<Protected><FarmsPage /></Protected>} />
      <Route path="/farm-map"    element={<Protected><FarmMapPage /></Protected>} />
      <Route path="/prediction"  element={<Protected><PredictionPage /></Protected>} />
      <Route path="/simulator"   element={<Protected><SimulatorPage /></Protected>} />
      <Route path="/crop-intel"  element={<Protected><CropIntelPage /></Protected>} />
      <Route path="/insights"    element={<Protected><InsightsPage /></Protected>} />
      <Route path="/environment" element={<Protected><EnvironmentPage /></Protected>} />
      <Route path="/weather"     element={<Protected><WeatherPage /></Protected>} />
      <Route path="/soil"        element={<Protected><SoilPage /></Protected>} />
      <Route path="/varieties"   element={<Protected><VarietiesPage /></Protected>} />
      <Route path="/yield-loss"  element={<Protected><YieldLossPage /></Protected>} />
      <Route path="/analytics"   element={<Protected><AnalyticsPage /></Protected>} />
      <Route path="/reports"     element={<Protected><ReportsPage /></Protected>} />
      <Route path="/chat"        element={<Protected><ChatPage /></Protected>} />
      <Route path="/alerts"      element={<Protected><AlertsPage /></Protected>} />
      <Route path="/profile"     element={<Protected><ProfilePage /></Protected>} />
      <Route path="/about"       element={<Protected><AboutPage /></Protected>} />
      <Route path="/admin"       element={<Protected><AdminDashboardPage /></Protected>} />
      <Route path="/officer"     element={<Protected><OfficerDashboardPage /></Protected>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
