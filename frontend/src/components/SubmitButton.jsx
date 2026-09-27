import React from 'react';
import { Loader2 } from 'lucide-react';

export default function SubmitButton({ children, loading, className = '', icon: Icon, ...props }) {
  return (
    <button
      className={`submit btn-primary ${className}`}
      disabled={loading}
      type="submit"
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>Processing…</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={18} />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
