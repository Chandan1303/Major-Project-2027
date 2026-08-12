import React from 'react';
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
      setUser(result.data.user);
      navigate('/dashboard');
    } catch (e) {
      setError('root', { message: e.message });
    }
  };

  return (
    <AuthLayout>
      <div className="form-content">
        <p className="eyebrow">Join the Platform</p>
        <h2>Create your account</h2>
        <p className="intro">
          Start using AI-based sugarcane yield forecasting. Get accurate predictions 
          using XGBoost, Random Forest, and real-time satellite NDVI data.
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
