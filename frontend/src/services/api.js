import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach access token if it exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// A 401 on any call other than login means the token is missing, invalid or expired
// (tokens last 1 hour) - clear the stale session and send the user back to log in.
api.interceptors.response.use((response) => response, (error) => {
  const isLoginRequest = error.config?.url?.includes('/auth/login');
  if (error.response?.status === 401 && !isLoginRequest) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/auth') {
      window.location.assign('/auth');
    }
  }
  return Promise.reject(error);
});

export default api;
