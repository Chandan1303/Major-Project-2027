import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '../layouts/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import SubmitButton from '../components/SubmitButton';
import { request } from '../services/api';

const schema = z.object({
  password: z.string()
    .min(10, 'Use at least 10 characters.')
    .regex(/[a-z]/, 'Include a lowercase letter.')
    .regex(/[A-Z]/, 'Include an uppercase letter.')
    .regex(/\d/, 'Include a number.'),
  confirm: z.string()
}).refine(v => v.password === v.confirm, {
  path: ['confirm'],
  message: 'Passwords do not match.'
});

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async ({ password }) => {
    try {
      await request('post', '/auth/reset-password', { token, password });
      setDone(true);
    } catch (e) {
      setError('root', { message: e.message });
    }
  };

  return (
    <AuthLayout>
      <div className="form-content">
        <p className="eyebrow">Account recovery</p>
        <h2>{done ? 'Password updated' : 'Choose a new password'}</h2>
        <p className="intro">
          {done
            ? 'Your password has been successfully updated. You can now sign in securely.'
            : 'Use a unique password with at least 10 characters, upper and lower case, and a number.'}
        </p>
        {done ? (
          <Link className="submit link-button" to="/login">Sign in</Link>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <PasswordInput
              label="New password"
              name="password"
              error={errors.password}
              register={register}
              autoComplete="new-password"
            />
            <PasswordInput
              label="Confirm new password"
              name="confirm"
              error={errors.confirm}
              register={register}
              autoComplete="new-password"
            />
            {errors.root && <p className="form-error" role="alert">{errors.root.message}</p>}
            <SubmitButton loading={isSubmitting}>Reset password</SubmitButton>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
