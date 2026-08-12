import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function ProtectedRoute({ children }) { const { user, loading } = useAuth(); const location = useLocation(); if (loading) return <div className="page-loading">Loading your workspace…</div>; return user ? children : <Navigate to="/login" state={{ from: location }} replace/>; }
