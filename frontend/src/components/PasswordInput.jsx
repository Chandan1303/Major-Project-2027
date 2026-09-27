import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
      <div className="password-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          {...register(name)}
          style={{ paddingRight: 42 }}
        />
        <button
          type="button"
          className="reveal"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: 10,
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="field-error" role="alert">{error.message}</p>}
    </div>
  );
}
