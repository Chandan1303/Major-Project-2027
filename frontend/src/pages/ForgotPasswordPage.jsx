import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '../layouts/AuthLayout';
import SubmitButton from '../components/SubmitButton';
import { request } from '../services/api';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(z.object({ email: z.string().email('Enter a valid email address.') }))
  });

  const onSubmit = async values => {
    try {
      await request('post', '/auth/forgot-password', values);
      setSent(true);
    } catch (e) {
      setError('root', { message: e.message });
    }
  };

  return (
    <AuthLayout>
      <div className="form-content">
        <p className="eyebrow">Account Recovery</p>
        <h2>{sent ? 'Check your email' : 'Reset your password'}</h2>
        <p className="intro">
          {sent
            ? 'If an account matches that address, a secure reset link has been sent to your email.'
            : "Enter your registered email address and we'll send you a secure password reset link."}
        </p>
        {!sent && (
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
            <SubmitButton loading={isSubmitting}>Send reset link</SubmitButton>
          </form>
        )}
        <p className="alternate">
          <Link to="/login">← Back to sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
