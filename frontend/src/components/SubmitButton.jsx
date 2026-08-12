import React from 'react';

export default function SubmitButton({ children, loading }) {
  return <button className="submit" disabled={loading} type="submit">{loading && <i className="spinner" aria-hidden="true"/>}{loading ? 'Please wait' : children}</button>;
}
