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
import CropHealthPage   from './pages/CropHealthPage';
import CropIntelligencePage from './crop-intelligence/CropIntelligencePage';
import VarietyGrowingGuidePage from './pages/VarietyGrowingGuidePage';
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
import { useAuth } from './context/AuthContext';

function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function UserRoute({ children }) {
  return <Protected>{children}</Protected>;
}

function DashboardRouter() {
  return <NewDashboardPage />;
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

      {/* Main Dashboard */}
      <Route path="/dashboard"   element={<Protected><DashboardRouter /></Protected>} />
      <Route path="/admin"       element={<Navigate to="/dashboard" replace />} />
      <Route path="/officer"     element={<Navigate to="/dashboard" replace />} />

      {/* User & Agro Intelligence Pages */}
      <Route path="/home"        element={<UserRoute><HomePage /></UserRoute>} />
      <Route path="/farms"       element={<UserRoute><FarmsPage /></UserRoute>} />
      <Route path="/farm-map"    element={<UserRoute><FarmMapPage /></UserRoute>} />
      <Route path="/prediction"  element={<UserRoute><PredictionPage /></UserRoute>} />
      <Route path="/simulator"   element={<UserRoute><SimulatorPage /></UserRoute>} />
      <Route path="/environment" element={<Navigate to="/weather" replace />} />
      <Route path="/crop-health" element={<UserRoute><CropHealthPage /></UserRoute>} />
      <Route path="/crop-intelligence" element={<UserRoute><CropIntelligencePage /></UserRoute>} />
      <Route path="/growing-guide" element={<UserRoute><VarietyGrowingGuidePage /></UserRoute>} />
      <Route path="/weather"     element={<UserRoute><WeatherPage /></UserRoute>} />
      <Route path="/soil"        element={<UserRoute><SoilPage /></UserRoute>} />
      <Route path="/varieties"   element={<UserRoute><VarietiesPage /></UserRoute>} />
      <Route path="/yield-loss"  element={<UserRoute><YieldLossPage /></UserRoute>} />
      <Route path="/analytics"   element={<UserRoute><AnalyticsPage /></UserRoute>} />
      <Route path="/reports"     element={<UserRoute><ReportsPage /></UserRoute>} />
      <Route path="/chat"        element={<UserRoute><ChatPage /></UserRoute>} />
      <Route path="/alerts"      element={<UserRoute><AlertsPage /></UserRoute>} />

      {/* Shared Account Pages */}
      <Route path="/profile"     element={<Protected><ProfilePage /></Protected>} />
      <Route path="/about"       element={<Protected><AboutPage /></Protected>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
