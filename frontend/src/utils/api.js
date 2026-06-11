import axios from 'axios';

// Agar VITE_API_URL belgilanmagan bo'lsa, vite proxy orqali /api ishlatiladi
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, Promise.reject);

// Token refresh queue
let isRefreshing = false;
let failedQueue = [];

const flush = (err, token = null) => {
  failedQueue.forEach(p => err ? p.reject(err) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(token => { orig.headers.Authorization = `Bearer ${token}`; return api(orig); })
          .catch(Promise.reject);
      }
      orig._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/auth';
        return Promise.reject(error);
      }
      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` },
          baseURL: '',
        });
        const newToken = res.data?.data?.access_token ?? res.data?.access_token;
        if (newToken) {
          localStorage.setItem('access_token', newToken);
          orig.headers.Authorization = `Bearer ${newToken}`;
        }
        flush(null, newToken);
        isRefreshing = false;
        return api(orig);
      } catch (e) {
        flush(e);
        isRefreshing = false;
        localStorage.clear();
        // Use replace so back button doesn't loop
        if (window.location.pathname !== '/auth') {
          window.location.replace('/auth');
        }
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
