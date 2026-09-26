import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

export default function Brand() {
  const { user } = useAuth();
  return (
    <Link className="brand" to={user ? '/dashboard' : '/login'} aria-label="SugarYield AI home">
      <img src={logo} alt="SugarYield AI Logo" className="brand-logo" />
      SugarYield AI
    </Link>
  );
}
