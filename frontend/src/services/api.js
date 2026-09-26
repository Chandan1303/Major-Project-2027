import axios from 'axios';

function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    // If accessing from a mobile device or other local network IP:
    // Never send requests to localhost on a remote device
    if (!isLocalhost) {
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl;
      }
      // Use relative /api, which Vite proxies to backend
      return '/api';
    }
  }

  // If envUrl is explicitly set (e.g. /api or production URL)
  if (envUrl) {
    return envUrl;
  }

  // In browser, default to /api for seamless Vite proxying
  if (typeof window !== 'undefined') {
    return '/api';
  }

  return 'http://localhost:5000/api';
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function request(method, path, data) {
  try {
    return (await api({ method, url: path, data })).data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      (error.code === 'ERR_NETWORK'
        ? 'Unable to connect to the server. Please ensure your device is connected to the same network.'
        : error.message || 'Unable to connect. Please try again.');
    const err = new Error(message);
    err.code = error.response?.data?.code;
    err.data = error.response?.data?.data;
    err.status = error.response?.status;
    throw err;
  }
}
