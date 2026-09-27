import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '../layouts/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import SubmitButton from '../components/SubmitButton';
import { request } from '../services/api';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.')
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState('user'); // 'user' or 'admin'

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting }, setError, clearErrors } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const handleRoleSwitch = (role) => {
    setSelectedRole(role);
    clearErrors();
  };

  const fillDemo = (email, pw = 'password123', role = 'user') => {
    setSelectedRole(role);
    clearErrors();
    setValue('email', email, { shouldValidate: true });
    setValue('password', pw, { shouldValidate: true });
  };

  const onSubmit = async (values) => {
    try {
      const result = await request('post', '/auth/login', values);
      const user = result.data.user;

      // Role check: If user selected 'Admin' tab but account is not an admin
      if (selectedRole === 'admin' && user?.role !== 'admin') {
        setError('root', {
          message: 'Access Denied: This account has standard User privileges. Please select "Users" tab to log in, or use an Administrator account.'
        });
        return;
      }

      setUser(user);
      // Both routes point to /dashboard which renders the tailored dashboard per role
      navigate(location.state?.from?.pathname || '/dashboard');
    } catch (e) {
      if (e.code === 'EMAIL_NOT_VERIFIED') {
        setError('root', {
          message: (
            <>
              {e.message}{' '}
              <Link to="/resend-verification" style={{ color: '#2d7a3e', fontWeight: 600, textDecoration: 'underline' }}>
                Resend verification email
              </Link>
            </>
          )
        });
      } else {
        setError('root', { message: e.message || 'Invalid email or password.' });
      }
    }
  };

  return (
    <AuthLayout>
      <div className={`form-content ${selectedRole === 'admin' ? 'admin-mode' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="eyebrow" style={{ color: selectedRole === 'admin' ? '#7c3aed' : '#2d7a3e', background: selectedRole === 'admin' ? '#f3e8ff' : '#e8f5ea' }}>
            {selectedRole === 'admin' ? '🛡️ Administrator Access' : '🌱 Precision Agriculture Platform'}
          </span>
          <span className="role-pill-indicator" style={{
            background: selectedRole === 'admin' ? '#f3e8ff' : '#e8f5e9',
            color: selectedRole === 'admin' ? '#7c3aed' : '#2d7a3e'
          }}>
            {selectedRole === 'admin' ? 'Admin Portal' : 'User Portal'}
          </span>
        </div>

        <h2>Sign in to SugarYield</h2>
        <p className="intro">
          {selectedRole === 'admin'
            ? 'Access the centralized system governance console, ML inference pipelines, user administration, and security analytics.'
            : 'Access your AI-powered yield forecasting dashboard. Monitor crop health, analyze soil and weather conditions, and predict harvests.'}
        </p>

        {/* Quick Demo Credentials Strip */}
        <div style={{
          marginBottom: 18,
          padding: '12px 14px',
          background: selectedRole === 'admin' ? '#faf5ff' : '#f8fafc',
          borderRadius: 12,
          border: `1.5px dashed ${selectedRole === 'admin' ? '#d8b4fe' : '#cbd5e1'}`,
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: selectedRole === 'admin' ? '#7e22ce' : '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              ⚡ Quick Fill Demo Login (Password: password123)
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => fillDemo('farmer@sugarcane.ai', 'password123', 'user')}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 8,
                background: selectedRole === 'user' ? '#ffffff' : '#f1f5f9',
                borderColor: selectedRole === 'user' ? '#2d7a3e' : '#cbd5e1',
                color: selectedRole === 'user' ? '#166534' : '#475569',
                fontWeight: selectedRole === 'user' ? 700 : 500
              }}
            >
              👤 Fill User Account
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => fillDemo('admin@sugarcane.ai', 'password123', 'admin')}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 8,
                background: selectedRole === 'admin' ? '#ffffff' : '#f1f5f9',
                borderColor: selectedRole === 'admin' ? '#7c3aed' : '#cbd5e1',
                color: selectedRole === 'admin' ? '#6b21a8' : '#475569',
                fontWeight: selectedRole === 'admin' ? 700 : 500
              }}
            >
              🛡️ Fill Admin Account
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ── ROLE SELECTION BUTTONS ABOVE EMAIL ADDRESS ── */}
          <div className="role-selector-wrap">
            <div className="role-selector-header">
              <label className="role-selector-title">
                <span>Select Account Role</span>
              </label>
              <span className="role-selector-hint">
                {selectedRole === 'user' ? 'Agricultural User' : 'System Administrator'}
              </span>
            </div>

            <div className="role-toggle-group" role="tablist" aria-label="Choose User or Admin login">
              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'user'}
                className={`role-toggle-btn role-user-btn ${selectedRole === 'user' ? 'active' : ''}`}
                onClick={() => handleRoleSwitch('user')}
                id="select-user-role-btn"
              >
                <span className="role-btn-icon">👤</span>
                <div className="role-btn-text">
                  <span className="role-btn-title">Users</span>
                  <span className="role-btn-sub">Standard Access</span>
                </div>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'admin'}
                className={`role-toggle-btn role-admin-btn ${selectedRole === 'admin' ? 'active' : ''}`}
                onClick={() => handleRoleSwitch('admin')}
                id="select-admin-role-btn"
              >
                <span className="role-btn-icon">🛡️</span>
                <div className="role-btn-text">
                  <span className="role-btn-title">Admin</span>
                  <span className="role-btn-sub">Governance Portal</span>
                </div>
              </button>
            </div>

            {/* Dynamic Banner Context */}
            <div className={`role-banner-info ${selectedRole === 'admin' ? 'role-banner-admin' : 'role-banner-user'}`}>
              <span style={{ fontSize: 16 }}>{selectedRole === 'admin' ? '⚙️' : '🌾'}</span>
              <span>
                {selectedRole === 'admin'
                  ? 'Signing in with Admin role grants full platform controls, ML retraining, and telemetry.'
                  : 'Signing in with Users role grants farm management, yield predictions, and weather insights.'}
              </span>
            </div>
          </div>

          {/* ── EMAIL ADDRESS INPUT ── */}
          <div className="field">
            <label htmlFor="email">
              Email address
              <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>
                {selectedRole === 'admin' ? 'Admin credentials' : 'User credentials'}
              </span>
            </label>
            <input
              id="email"
              type="email"
              placeholder={selectedRole === 'admin' ? 'admin@sugarcane.ai' : 'your.email@example.com'}
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="field-error" role="alert">{errors.email.message}</p>}
          </div>

          {/* ── PASSWORD INPUT ── */}
          <PasswordInput label="Password" name="password" error={errors.password} register={register} />

          <div className="form-row">
            <span></span>
            <Link to="/forgot-password" style={{ color: selectedRole === 'admin' ? '#7c3aed' : '#2d7a3e', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>

          {errors.root && (
            <div className="form-error" role="alert" style={{
              background: '#fef2f2',
              borderColor: '#fca5a5',
              color: '#991b1b',
              padding: '12px 14px',
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 16
            }}>
              {errors.root.message}
            </div>
          )}

          <SubmitButton
            loading={isSubmitting}
            className={selectedRole === 'admin' ? 'btn-admin' : 'submit-btn'}
          >
            {selectedRole === 'admin' ? 'Sign in as Administrator 🛡️' : 'Sign in to Dashboard 🌾'}
          </SubmitButton>
        </form>

        <p className="alternate" style={{ marginTop: 24, textAlign: 'center', fontSize: 14 }}>
          New to SugarYield?{' '}
          <Link to="/signup" style={{ color: selectedRole === 'admin' ? '#7c3aed' : '#2d7a3e', fontWeight: 600 }}>
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
