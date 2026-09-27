import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '../layouts/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import SubmitButton from '../components/SubmitButton';
import { request } from '../services/api';
import { useAuth } from '../context/AuthContext';

const strong = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/\d/, 'Include a number.');

const schema = z
  .object({
    name: z.string().min(2, 'Enter your full name.'),
    email: z.string().email('Enter a valid email address.'),
    role: z.enum(['user', 'admin']).default('user'),
    password: strong,
    confirmPassword: z.string(),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'Please accept the terms to continue.' })
    })
  })
  .refine(v => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.'
  });

export default function SignupPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'user',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false
    }
  });

  const selectedRole = watch('role', 'user');
  const value = watch('password', '');
  const score = [
    value.length >= 10,
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value)
  ].filter(Boolean).length;

  const onSubmit = async ({ confirmPassword, terms, ...values }) => {
    try {
      const result = await request('post', '/auth/register', values);
      if (result.data?.requiresVerification) {
        setUserEmail(values.email);
        setRegistrationSuccess(true);
      } else {
        setUser(result.data.user);
        navigate('/dashboard');
      }
    } catch (e) {
      setError('root', { message: e.message || 'Registration failed. Please try again.' });
    }
  };

  if (registrationSuccess) {
    return (
      <AuthLayout compact>
        <div className="form-content" style={{ animation: 'fadeInUp 0.4s ease' }}>
          <div className="verification-icon success" style={{ textAlign: 'center', marginBottom: 16 }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#e8f5e9" stroke="#2d7a3e" strokeWidth="2"/>
              <path d="M7 12l3.5 3.5L17 8.5" stroke="#2d7a3e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ textAlign: 'center' }}>Check your email</h2>
          <p className="intro" style={{ textAlign: 'center' }}>
            We've sent a verification link to <strong>{userEmail}</strong>
          </p>
          <p className="intro" style={{ textAlign: 'center' }}>
            Click the link in the email to verify your account and start using SugarYield AI.
          </p>
          <div style={{ marginTop: '24px', padding: '16px', background: '#e8f5ea', borderRadius: '10px', border: '1px solid #2d7a3e30' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#1f5a2d' }}>
              <strong>Didn't receive the email?</strong> Check your spam folder or{' '}
              <Link to="/resend-verification" style={{ color: '#2d7a3e', fontWeight: 700, textDecoration: 'underline' }}>
                resend verification email
              </Link>
            </p>
          </div>
          <p className="alternate" style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link to="/login" style={{ color: '#2d7a3e', fontWeight: 600 }}>Back to Login</Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className={`form-content ${selectedRole === 'admin' ? 'admin-mode' : ''}`} style={{ animation: 'fadeInUp 0.35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="eyebrow" style={{ color: selectedRole === 'admin' ? '#7c3aed' : '#2d7a3e', background: selectedRole === 'admin' ? '#f3e8ff' : '#e8f5ea' }}>
            {selectedRole === 'admin' ? '🛡️ Admin Registration' : '🌱 Join SugarYield'}
          </span>
          <span className="role-pill-indicator" style={{
            background: selectedRole === 'admin' ? '#f3e8ff' : '#e8f5e9',
            color: selectedRole === 'admin' ? '#7c3aed' : '#2d7a3e'
          }}>
            {selectedRole === 'admin' ? 'Administrator' : 'Standard User'}
          </span>
        </div>

        <h2>Create your account</h2>
        <p className="intro">
          Join the AI-based sugarcane yield forecasting platform. Get accurate machine learning
          predictions, crop phenology tracking, and soil-climate intelligence.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ── TWO ROLE SELECTION BUTTONS: USERS AND ADMIN ── */}
          <div className="role-selector-wrap">
            <div className="role-selector-header">
              <label className="role-selector-title">
                <span>Account Role</span>
              </label>
              <span className="role-selector-hint">
                {selectedRole === 'user' ? 'Agricultural User' : 'System Administrator'}
              </span>
            </div>

            <div className="role-toggle-group" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={selectedRole === 'user'}
                className={`role-toggle-btn role-user-btn ${selectedRole === 'user' ? 'active' : ''}`}
                onClick={() => setValue('role', 'user', { shouldValidate: true })}
                id="signup-role-user"
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
                onClick={() => setValue('role', 'admin', { shouldValidate: true })}
                id="signup-role-admin"
              >
                <span className="role-btn-icon">🛡️</span>
                <div className="role-btn-text">
                  <span className="role-btn-title">Admin</span>
                  <span className="role-btn-sub">Governance Portal</span>
                </div>
              </button>
            </div>
            <input type="hidden" {...register('role')} />
          </div>

          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              placeholder="Your full name"
              autoComplete="name"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && <p className="field-error" role="alert">{errors.name.message}</p>}
          </div>

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="field-error" role="alert">{errors.email.message}</p>}
          </div>

          <PasswordInput
            label="Password"
            name="password"
            error={errors.password}
            register={register}
            autoComplete="new-password"
            placeholder="10+ chars, upper & lower case, number"
          />

          <div className="strength" aria-label={`Password strength: ${score} of 4`} style={{ margin: '8px 0 16px' }}>
            <div>
              {[1, 2, 3, 4].map(n => (
                <i key={n} className={score >= n ? 'active' : ''} />
              ))}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500 }}>
              {value ? ['Very weak', 'Weak', 'Good', 'Strong'][Math.max(score - 1, 0)] : 'Password strength'}
            </span>
          </div>

          <PasswordInput
            label="Confirm password"
            name="confirmPassword"
            error={errors.confirmPassword}
            register={register}
            autoComplete="new-password"
            placeholder="Re-type your password"
          />

          <label className="checkbox" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 20px', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" {...register('terms')} style={{ width: 16, height: 16 }} />
            <span>
              I agree to the <Link to="/terms-of-use" style={{ color: selectedRole === 'admin' ? '#7c3aed' : '#2d7a3e', fontWeight: 600 }}>Terms of use</Link> and <Link to="/privacy-policy" style={{ color: selectedRole === 'admin' ? '#7c3aed' : '#2d7a3e', fontWeight: 600 }}>Privacy policy</Link>.
            </span>
          </label>
          {errors.terms && <p className="field-error" role="alert">{errors.terms.message}</p>}
          {errors.root && <div className="form-error" role="alert">{errors.root.message}</div>}

          <SubmitButton
            loading={isSubmitting}
            className={selectedRole === 'admin' ? 'btn-admin' : 'submit-btn'}
          >
            {selectedRole === 'admin' ? 'Create Administrator Account 🛡️' : 'Create User Account 🌱'}
          </SubmitButton>
        </form>

        <p className="alternate" style={{ marginTop: 24, textAlign: 'center', fontSize: 14 }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: selectedRole === 'admin' ? '#7c3aed' : '#2d7a3e', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
