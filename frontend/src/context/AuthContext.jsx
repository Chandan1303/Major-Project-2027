import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { request } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const result = await request('get', '/auth/me');
      setUser(result.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const publicPaths = [
      '/', '/login', '/signup', '/forgot-password', '/resend-verification',
      '/terms-of-use', '/privacy-policy',
    ];
    const isPublicPath = publicPaths.includes(location.pathname)
      || location.pathname.startsWith('/reset-password/')
      || location.pathname.startsWith('/verify-email/');
    if (isPublicPath) {
      setLoading(false);
      return;
    }
    refresh();
  }, [location.pathname]);

  const value = {
    user,
    loading,
    refresh,
    setUser,
    logout: async () => {
      await request('post', '/auth/logout');
      setUser(null);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
