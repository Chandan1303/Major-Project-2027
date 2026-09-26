import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { request } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying, success, already-verified, error
  const [message, setMessage] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const verifyAttempted = useRef(false);

  const performVerification = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No verification token was provided.');
      return;
    }

    setStatus('verifying');
    setMessage('');

    try {
      const result = await request('get', `/auth/verify-email/${token}`);

      if (result.data?.alreadyVerified) {
        setStatus('already-verified');
        setMessage(result.message || 'Your email is already verified. You can access your account.');
      } else {
        setStatus('success');
        setMessage(result.message || 'Email verified successfully! You can now access your account.');
      }

      if (result.data?.user) {
        setUser(result.data.user);
      }
    } catch (error) {
      const errMsg = error.message || '';
      if (
        errMsg.toLowerCase().includes('already been used') ||
        errMsg.toLowerCase().includes('already verified')
      ) {
        setStatus('already-verified');
        setMessage('Your email is already verified. You can log in to your account.');
      } else {
        setStatus('error');
        setMessage(errMsg || 'Verification failed. Please try again.');
      }
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (verifyAttempted.current) return;
    verifyAttempted.current = true;
    performVerification();
  }, [token]);

  const handleRetry = () => {
    setIsRetrying(true);
    performVerification();
  };

  return (
    <AuthLayout compact>
      <div className="form-content">
        {status === 'verifying' && (
          <>
            <div className="verification-spinner">
              <div className="spinner"></div>
            </div>
            <h2>Verifying your email...</h2>
            <p className="intro">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="verification-icon success">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#2d7a3e"/>
                <path d="M8 12l2 2 4-4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Email verified successfully!</h2>
            <p className="intro" style={{ color: '#2d7a3e', fontWeight: 500 }}>
              {message}
            </p>
            <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/dashboard" className="link-button" style={{ textDecoration: 'none' }}>
                <button type="button" className="submit" style={{ width: '100%' }}>
                  Go to Dashboard
                </button>
              </Link>
              <Link to="/login" className="link-button" style={{ textDecoration: 'none' }}>
                <button type="button" className="btn-secondary" style={{ width: '100%', padding: '12px' }}>
                  Go to Login
                </button>
              </Link>
            </div>
          </>
        )}

        {status === 'already-verified' && (
          <>
            <div className="verification-icon success">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#2d7a3e"/>
                <path d="M8 12l2 2 4-4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Email Already Verified</h2>
            <p className="intro" style={{ color: '#2d7a3e', fontWeight: 500 }}>
              {message}
            </p>
            <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/dashboard" className="link-button" style={{ textDecoration: 'none' }}>
                <button type="button" className="submit" style={{ width: '100%' }}>
                  Go to Dashboard
                </button>
              </Link>
              <Link to="/login" className="link-button" style={{ textDecoration: 'none' }}>
                <button type="button" className="btn-secondary" style={{ width: '100%', padding: '12px' }}>
                  Go to Login
                </button>
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verification-icon error">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#c53030"/>
                <path d="M8 8l8 8M16 8l-8 8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h2>Verification failed</h2>
            <p className="intro" style={{ color: '#c53030' }}>
              {message}
            </p>
            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                className="submit"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : 'Retry Verification'}
              </button>
              <Link to="/resend-verification" className="link-button" style={{ textDecoration: 'none' }}>
                <button type="button" className="btn-secondary" style={{ width: '100%', padding: '12px' }}>
                  Resend Verification Email
                </button>
              </Link>
              <p className="alternate" style={{ margin: '8px 0 0' }}>
                <Link to="/login">Back to Login</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
