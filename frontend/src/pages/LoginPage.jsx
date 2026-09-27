import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCheck, ShieldCheck, Landmark, Sparkles, ArrowRight, Mail, Lock, CheckCircle2 } from 'lucide-react';
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
      navigate(location.state?.from?.pathname || '/dashboard');
    } catch (e) {
      if (e.code === 'EMAIL_NOT_VERIFIED') {
        setError('root', {
          message: (
            <>
              {e.message}{' '}
              <Link to="/resend-verification" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'underline' }}>
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

  const isAdm = selectedRole === 'admin';
  const roleColor = isAdm ? '#8b5cf6' : '#10b981';

  return (
    <AuthLayout>
      <div className={`form-content ${isAdm ? 'admin-mode' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="eyebrow" style={{
            color: roleColor,
            background: isAdm ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            padding: '4px 10px',
            borderRadius: 8
          }}>
            {isAdm ? <ShieldCheck size={13} /> : <Sparkles size={13} />}
            <span>{isAdm ? 'Administrator Access' : 'Precision Agriculture Portal'}</span>
          </span>
          <span className="role-pill-indicator" style={{
            background: isAdm ? 'rgba(139, 92, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            color: roleColor,
            border: `1px solid ${isAdm ? 'rgba(139, 92, 246, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
          }}>
            {isAdm ? 'Admin Console' : 'User Portal'}
          </span>
        </div>

        <h2>Sign in to SugarYield</h2>
        <p className="intro">
          {isAdm
            ? 'Access the centralized system governance console, ML inference pipelines, user administration, and security analytics.'
            : 'Access your AI-powered yield forecasting dashboard. Monitor crop health, analyze soil and weather conditions, and forecast harvests.'}
        </p>

        {/* Quick Demo Credentials Strip */}
        <div style={{
          marginBottom: 20,
          padding: '12px 14px',
          background: isAdm ? 'rgba(139, 92, 246, 0.05)' : 'rgba(16, 185, 129, 0.05)',
          borderRadius: 12,
          border: `1.5px dashed ${isAdm ? 'rgba(139, 92, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: isAdm ? '#7c3aed' : '#059669',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}>
              <Sparkles size={12} /> Quick Demo Login (Password: password123)
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
                background: !isAdm ? '#ffffff' : 'transparent',
                borderColor: !isAdm ? '#10b981' : '#cbd5e1',
                color: !isAdm ? '#059669' : '#475569',
                fontWeight: !isAdm ? 700 : 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <UserCheck size={14} /> Fill Farmer Account
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => fillDemo('admin@sugarcane.ai', 'password123', 'admin')}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 8,
                background: isAdm ? '#ffffff' : 'transparent',
                borderColor: isAdm ? '#8b5cf6' : '#cbd5e1',
                color: isAdm ? '#7c3aed' : '#475569',
                fontWeight: isAdm ? 700 : 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <ShieldCheck size={14} /> Fill Admin Account
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ── ROLE SELECTION BUTTONS ── */}
          <div className="role-selector-wrap" style={{ marginBottom: 18 }}>
            <div className="role-selector-header" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="role-selector-title" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Select Portal Access
              </label>
              <span className="role-selector-hint" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {isAdm ? 'System Administrator' : 'Grower / Field Operator'}
              </span>
            </div>

            <div className="role-toggle-group" role="tablist" aria-label="Choose User or Admin login" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              background: 'var(--border-subtle)',
              padding: 4,
              borderRadius: 12
            }}>
              <button
                type="button"
                role="tab"
                aria-selected={!isAdm}
                className={`role-toggle-btn role-user-btn ${!isAdm ? 'active' : ''}`}
                onClick={() => handleRoleSwitch('user')}
                id="select-user-role-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: !isAdm ? '1.5px solid #10b981' : '1px solid transparent',
                  background: !isAdm ? 'var(--bg-panel)' : 'transparent',
                  color: !isAdm ? '#059669' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <UserCheck size={18} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Users Portal</div>
                  <div style={{ fontSize: 10.5, opacity: 0.8 }}>Farmers & Officers</div>
                </div>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={isAdm}
                className={`role-toggle-btn role-admin-btn ${isAdm ? 'active' : ''}`}
                onClick={() => handleRoleSwitch('admin')}
                id="select-admin-role-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: isAdm ? '1.5px solid #8b5cf6' : '1px solid transparent',
                  background: isAdm ? 'var(--bg-panel)' : 'transparent',
                  color: isAdm ? '#7c3aed' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <ShieldCheck size={18} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Administrator</div>
                  <div style={{ fontSize: 10.5, opacity: 0.8 }}>System Governance</div>
                </div>
              </button>
            </div>

            {/* Context Info Banner */}
            <div className={`role-banner-info ${isAdm ? 'role-banner-admin' : 'role-banner-user'}`} style={{ marginTop: 10 }}>
              {isAdm ? <ShieldCheck size={16} /> : <CheckCircle2 size={16} />}
              <span>
                {isAdm
                  ? 'Signing in with Admin role grants full platform governance, model benchmarks, and audit telemetry.'
                  : 'Signing in with Users role grants farm tracking, AI yield forecasting, and weather decision support.'}
              </span>
            </div>
          </div>

          {/* ── EMAIL INPUT ── */}
          <div className="field">
            <label htmlFor="email" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Email address</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {isAdm ? 'admin@sugarcane.ai' : 'farmer@sugarcane.ai'}
              </span>
            </label>
            <input
              id="email"
              type="email"
              placeholder={isAdm ? 'admin@sugarcane.ai' : 'your.email@example.com'}
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="field-error" role="alert">{errors.email.message}</p>}
          </div>

          {/* ── PASSWORD INPUT ── */}
          <PasswordInput
            label="Password"
            name="password"
            error={errors.password}
            register={register}
          />

          <div className="form-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 16px' }}>
            <span />
            <Link
              to="/forgot-password"
              style={{
                color: roleColor,
                fontWeight: 600,
                fontSize: 13,
                transition: 'opacity 0.2s'
              }}
            >
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
            className={isAdm ? 'btn-admin' : 'submit-btn'}
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: 15,
              background: isAdm
                ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: isAdm
                ? '0 4px 14px rgba(139, 92, 246, 0.35)'
                : '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            {isAdm ? 'Sign in as Administrator' : 'Sign in to Dashboard'}
          </SubmitButton>
        </form>

        <p className="alternate" style={{ marginTop: 24, textAlign: 'center', fontSize: 13.5, color: 'var(--text-muted)' }}>
          New to SugarYield?{' '}
          <Link to="/signup" style={{ color: roleColor, fontWeight: 700 }}>
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
