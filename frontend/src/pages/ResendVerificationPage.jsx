import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '../layouts/AuthLayout';
import SubmitButton from '../components/SubmitButton';
import { request } from '../services/api';

const schema = z.object({
  email: z.string().email('Enter a valid email address.')
});

export default function ResendVerificationPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values) => {
    try {
      const result = await request('post', '/auth/resend-verification', values);
      setSent(true);
    } catch (e) {
      setError('root', { message: e.message });
    }
  };

  if (sent) {
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
            If an unverified account exists for that email address, we've sent a new verification link. 
            Please check your inbox and spam folder.
          </p>
          <p className="intro">
            The verification link will expire in 24 hours.
          </p>
          <p className="alternate">
            <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout compact>
      <div className="form-content">
        <p className="eyebrow">Email Verification</p>
        <h2>Resend verification email</h2>
        <p className="intro">
          Enter your email address and we'll send you a new verification link.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
          {errors.root && <p className="form-error" role="alert">{errors.root.message}</p>}
          <SubmitButton loading={isSubmitting}>Send verification email</SubmitButton>
        </form>
        <p className="alternate">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
