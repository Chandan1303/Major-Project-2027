import React, { useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';

export default function PasswordInput({
  label,
  error,
  register,
  name,
  placeholder = 'Enter your password',
  autoComplete = 'current-password'
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      {label && <label htmlFor={name}>{label}</label>}
      <div className="password-wrap auth-input-wrap">
        <LockKeyhole size={16} className="auth-input-icon" aria-hidden="true" />
        <input
          id={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          {...register(name)}
          className="auth-input"
        />
        <button
          type="button"
          className="reveal auth-reveal"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="field-error" role="alert">{error.message}</p>}
    </div>
  );
}
