import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Mail, ShieldCheck, Sprout } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import SubmitButton from '../components/SubmitButton';
import { request } from '../services/api';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const onSubmit = async ({ email, password }) => {
    try {
      const result = await request('post', '/auth/login', { email, password, portal: 'user' });
      setUser(result.data.user);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (error) {
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        setError('root', { message: <>{error.message}{' '}<Link to="/resend-verification">Resend verification email</Link></> });
      } else {
        setError('root', { message: error.message || 'Unable to sign in. Check your details and try again.' });
      }
    }
  };

  return (
    <AuthLayout variant="modern">
      <section className="auth-rebuilt-card" aria-labelledby="login-heading">
        <nav className="auth-rebuilt-tabs" aria-label="Account access">
          <span className="auth-rebuilt-tab is-active" aria-current="page">Sign in</span>
          <Link className="auth-rebuilt-tab" to="/signup">Create account <ArrowRight size={14} /></Link>
        </nav>
        <div className="auth-rebuilt-eyebrow"><Sprout size={15} /> SECURE GROWER ACCESS</div>
        <h2 id="login-heading">Welcome back</h2>
        <p className="auth-rebuilt-intro">Sign in to continue to your smart farming dashboard.</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="auth-rebuilt-field">
            <label htmlFor="email">Email address</label>
            <div className="auth-rebuilt-input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input id="email" type="email" autoComplete="email" placeholder="name@myfarm.com" aria-invalid={!!errors.email} {...register('email')} />
            </div>
            {errors.email && <p className="auth-rebuilt-error" role="alert">{errors.email.message}</p>}
          </div>

          <PasswordInput label="Password" name="password" error={errors.password} register={register} placeholder="Enter your password" />

          <div className="auth-rebuilt-options">
            <label><input type="checkbox" defaultChecked {...register('rememberMe')} /><span>Remember me</span></label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          {errors.root && <div className="auth-rebuilt-alert" role="alert">{errors.root.message}</div>}
          <SubmitButton loading={isSubmitting} className="auth-rebuilt-submit" icon={ArrowRight}>Sign in to Dashboard</SubmitButton>
        </form>

        <div className="auth-rebuilt-divider"><span />OR<span /></div>
        <p className="auth-rebuilt-switch">New to SugarYield AI? <Link to="/signup">Create your account</Link></p>
        <div className="auth-rebuilt-privacy"><ShieldCheck size={15} /> Your account details are handled securely.</div>
      </section>
    </AuthLayout>
  );
}
