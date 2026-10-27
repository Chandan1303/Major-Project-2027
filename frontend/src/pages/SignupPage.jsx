import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check, CheckCircle2, Mail, Sprout, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../layouts/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import SubmitButton from '../components/SubmitButton';
import { request } from '../services/api';

const strongPassword = z.string()
  .min(10, 'Use at least 10 characters.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/\d/, 'Include a number.');

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: strongPassword,
  confirmPassword: z.string(),
  terms: z.literal(true, { errorMap: () => ({ message: 'Please accept the Terms and Privacy Policy to continue.' }) }),
}).refine(values => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
});

export default function SignupPage() {
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', terms: false },
  });

  const password = watch('password', '');
  const criteria = [
    { label: '10+ characters', valid: password.length >= 10 },
    { label: 'Lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'Uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Number (0–9)', valid: /\d/.test(password) },
  ];
  const strength = criteria.filter(item => item.valid).length;

  const onSubmit = async ({ confirmPassword, terms, ...values }) => {
    try {
      const result = await request('post', '/auth/register', values);
      if (!result.data?.requiresVerification) {
        throw new Error('The server did not confirm account verification requirements.');
      }
      setUserEmail(values.email);
      setRegistrationSuccess(true);
      toast.success('Account created. Check your email to verify it.');
    } catch (error) {
      setError('root', { message: error.message || 'Registration failed. Please try again.' });
    }
  };

  return (
    <AuthLayout variant="modern">
      <section className={`auth-rebuilt-card auth-rebuilt-signup ${registrationSuccess ? 'auth-rebuilt-success' : ''}`} aria-labelledby="signup-heading">
        {registrationSuccess ? (
          <div className="auth-rebuilt-success-content">
            <div className="auth-rebuilt-success-icon"><CheckCircle2 size={34} /></div>
            <div className="auth-rebuilt-eyebrow"><Sprout size={15} /> ONE LAST STEP</div>
            <h2 id="signup-heading">Check your inbox</h2>
            <p className="auth-rebuilt-intro">We sent a verification link to <strong>{userEmail}</strong>. Verify your email to activate your account.</p>
            <div className="auth-rebuilt-notice">If the email doesn’t arrive soon, check your spam folder or <Link to="/resend-verification">request another verification link</Link>.</div>
            <p className="auth-rebuilt-switch"><Link to="/login">Return to sign in</Link></p>
          </div>
        ) : (
          <>
            <nav className="auth-rebuilt-tabs" aria-label="Account access">
              <Link className="auth-rebuilt-tab" to="/login">Sign in</Link>
              <span className="auth-rebuilt-tab is-active" aria-current="page">Create account</span>
            </nav>
            <div className="auth-rebuilt-eyebrow"><Sprout size={15} /> JOIN SUGARYIELD AI</div>
            <h2 id="signup-heading">Create your account</h2>
            <p className="auth-rebuilt-intro">Start your journey toward smarter, more productive farming.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="auth-rebuilt-field">
                <label htmlFor="name">Full name</label>
                <div className="auth-rebuilt-input-wrap">
                  <UserRound size={17} aria-hidden="true" />
                  <input id="name" type="text" autoComplete="name" placeholder="Your full name" aria-invalid={!!errors.name} {...register('name')} />
                </div>
                {errors.name && <p className="auth-rebuilt-error" role="alert">{errors.name.message}</p>}
              </div>

              <div className="auth-rebuilt-field">
                <label htmlFor="email">Email address</label>
                <div className="auth-rebuilt-input-wrap">
                  <Mail size={17} aria-hidden="true" />
                  <input id="email" type="email" autoComplete="email" placeholder="name@myfarm.com" aria-invalid={!!errors.email} {...register('email')} />
                </div>
                {errors.email && <p className="auth-rebuilt-error" role="alert">{errors.email.message}</p>}
              </div>

              <PasswordInput label="Create password" name="password" error={errors.password} register={register} autoComplete="new-password" placeholder="At least 10 characters" />

              <div className="auth-rebuilt-strength" aria-label={`Password strength: ${strength} of 4`}>
                <div className="auth-rebuilt-strength-bars">{criteria.map((item, index) => <span key={item.label} className={item.valid ? `strength-${strength}` : ''} />)}</div>
                <div className="auth-rebuilt-strength-heading"><b>Password requirements</b><span>{strength === 4 ? 'All set' : `${strength} of 4 met`}</span></div>
                <div className="auth-rebuilt-requirements">{criteria.map(item => <span key={item.label} className={item.valid ? 'is-valid' : ''}><Check size={11} />{item.label}</span>)}</div>
              </div>

              <PasswordInput label="Confirm password" name="confirmPassword" error={errors.confirmPassword} register={register} autoComplete="new-password" placeholder="Enter your password again" />

              <label className="auth-rebuilt-terms">
                <input type="checkbox" {...register('terms')} />
                <span>I agree to the <Link to="/terms-of-use">Terms of Service</Link> and <Link to="/privacy-policy">Privacy Policy</Link>.</span>
              </label>
              {errors.terms && <p className="auth-rebuilt-error auth-rebuilt-terms-error" role="alert">{errors.terms.message}</p>}
              {errors.root && <div className="auth-rebuilt-alert" role="alert">{errors.root.message}</div>}

              <SubmitButton loading={isSubmitting} className="auth-rebuilt-submit" icon={ArrowRight}>Create free grower account</SubmitButton>
            </form>
            <div className="auth-rebuilt-divider"><span />OR<span /></div>
            <p className="auth-rebuilt-switch">Already have an account? <Link to="/login">Sign in</Link></p>
          </>
        )}
      </section>
    </AuthLayout>
  );
}
