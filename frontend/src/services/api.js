import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://10.237.194.90:5000/api', withCredentials: true, headers: { 'Content-Type': 'application/json' } });
export async function request(method, path, data) { 
  try { 
    return (await api({ method, url: path, data })).data; 
  } catch (error) { 
    const err = new Error(error.response?.data?.message || 'Unable to connect. Please try again.');
    err.code = error.response?.data?.code;
    err.data = error.response?.data?.data;
    throw err;
  } 
}
