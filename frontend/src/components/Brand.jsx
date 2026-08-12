import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Brand() {
  return (
    <Link className="brand" to="/login" aria-label="SugarYield AI home">
      <img src={logo} alt="SugarYield AI Logo" className="brand-logo" />
      SugarYield AI
    </Link>
  );
}
