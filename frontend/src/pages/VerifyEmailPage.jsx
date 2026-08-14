import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { request } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function verifyEmail() {
      try {
        const result = await request('get', `/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(result.message);
        if (result.data.user) {
          setUser(result.data.user);
          // Redirect to dashboard after 2 seconds
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Verification failed. Please try again.');
      }
    }

    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link.');
    }
  }, [token, navigate, setUser]);

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
            <p className="intro">
              Redirecting you to your dashboard...
            </p>
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
            <div style={{ marginTop: '32px' }}>
              <Link to="/resend-verification" className="link-button">
                <button type="button" className="submit">
                  Resend Verification Email
                </button>
              </Link>
              <p className="alternate">
                <Link to="/login">Back to Login</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
