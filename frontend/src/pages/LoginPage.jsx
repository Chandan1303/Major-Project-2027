import React from 'react';
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
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async values => {
    try {
      const result = await request('post', '/auth/login', values);
      setUser(result.data.user);
      navigate(location.state?.from?.pathname || '/dashboard');
    } catch (e) {
      setError('root', { message: e.message });
    }
  };

  return (
    <AuthLayout>
      <div className="form-content">
        <p className="eyebrow">Access Your Dashboard</p>
        <h2>Sign in</h2>
        <p className="intro">
          Access your AI-powered yield forecasting dashboard. Monitor crop health, 
          analyze NDVI data, and get accurate harvest predictions.
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
          <PasswordInput label="Password" name="password" error={errors.password} register={register} />
          <div className="form-row">
            <span></span>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          {errors.root && <p className="form-error" role="alert">{errors.root.message}</p>}
          <SubmitButton loading={isSubmitting}>Sign in to Dashboard</SubmitButton>
        </form>
        <p className="alternate">New user? <Link to="/signup">Create an account</Link></p>
      </div>
    </AuthLayout>
  );
}
