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
    role: z.enum(['farmer', 'officer', 'admin']).default('farmer'),
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
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema)
  });

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
      if (result.data.requiresVerification) {
        setUserEmail(values.email);
        setRegistrationSuccess(true);
      } else {
        // Fallback for if verification is disabled
        setUser(result.data.user);
        navigate('/dashboard');
      }
    } catch (e) {
      setError('root', { message: e.message });
    }
  };

  if (registrationSuccess) {
    return (
      <AuthLayout compact>
        <div className="form-content">
          <div className="verification-icon success">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#2d7a3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <h2>Check your email</h2>
          <p className="intro">
            We've sent a verification link to <strong>{userEmail}</strong>
          </p>
          <p className="intro">
            Click the link in the email to verify your account and start using SugarYield AI. 
            The verification link will expire in 24 hours.
          </p>
          <div style={{ marginTop: '32px', padding: '16px', background: '#e8f5ea', borderRadius: '8px', border: '1px solid #2d7a3e20' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#1f5a2d' }}>
              <strong>Didn't receive the email?</strong> Check your spam folder or{' '}
              <Link to="/resend-verification" style={{ color: '#2d7a3e', fontWeight: 600 }}>
                resend verification email
              </Link>
            </p>
          </div>
          <p className="alternate" style={{ marginTop: '32px' }}>
            <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="form-content">
        <p className="eyebrow">Join the Platform</p>
        <h2>Create your account</h2>
        <p className="intro">
          Join the AI-based sugarcane yield forecasting platform. Get accurate machine learning
          predictions, crop phenology tracking, and soil-climate intelligence.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
          <div className="field">
            <label htmlFor="role">User Role</label>
            <select id="role" {...register('role')} className="role-select">
              <option value="farmer">Farmer / Agricultural Producer</option>
              <option value="officer">Agricultural Officer / Extension Specialist</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>
          <PasswordInput
            label="Password"
            name="password"
            error={errors.password}
            register={register}
            autoComplete="new-password"
            placeholder="10+ characters, upper and lower case"
          />
          <div className="strength" aria-label={`Password strength: ${score} of 4`}>
            <div>
              {[1, 2, 3, 4].map(n => (
                <i key={n} className={score >= n ? 'active' : ''} />
              ))}
            </div>
            <span>{value ? ['Very weak', 'Weak', 'Good', 'Strong'][Math.max(score - 1, 0)] : 'Password strength'}</span>
          </div>
          <PasswordInput
            label="Confirm password"
            name="confirmPassword"
            error={errors.confirmPassword}
            register={register}
            autoComplete="new-password"
          />
          <label className="checkbox">
            <input type="checkbox" {...register('terms')} />
            <span>
              I agree to the <Link to="/terms-of-use">Terms of use</Link> and <Link to="/privacy-policy">Privacy policy</Link>.
            </span>
          </label>
          {errors.terms && <p className="field-error" role="alert">{errors.terms.message}</p>}
          {errors.root && <p className="form-error" role="alert">{errors.root.message}</p>}
          <SubmitButton loading={isSubmitting}>Create account</SubmitButton>
        </form>
        <p className="alternate">Already registered? <Link to="/login">Sign in</Link></p>
      </div>
    </AuthLayout>
  );
}
