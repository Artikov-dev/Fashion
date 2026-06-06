import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

const persist = (payload) => {
  localStorage.setItem('user', JSON.stringify(payload.user));
  localStorage.setItem('access_token', payload.access_token);
  localStorage.setItem('refresh_token', payload.refresh_token);
};

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data);
    return res.data?.data ?? res.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Registration failed');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', data);
    return res.data?.data ?? res.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Login failed');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout', {}); } catch {}
});

export const refreshToken = createAsyncThunk('auth/refresh', async (_, { rejectWithValue }) => {
  try {
    const rt = localStorage.getItem('refresh_token');
    const res = await api.post('/auth/refresh', {}, { headers: { Authorization: `Bearer ${rt}` } });
    return res.data?.data ?? res.data;
  } catch (e) {
    return rejectWithValue('Refresh failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    accessToken: localStorage.getItem('access_token') || null,
    loading: false,
    error: null,
    successMsg: null,
  },
  reducers: {
    clearMessages: (s) => { s.error = null; s.successMsg = null; },
  },
  extraReducers: (b) => {
    b
      .addCase(registerUser.pending,  (s) => { s.loading = true;  s.error = null; })
      .addCase(registerUser.fulfilled,(s, a) => {
        s.loading = false; s.user = a.payload.user; s.accessToken = a.payload.access_token;
        s.successMsg = 'Account created! Welcome.';
        persist(a.payload);
      })
      .addCase(registerUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(loginUser.pending,  (s) => { s.loading = true;  s.error = null; })
      .addCase(loginUser.fulfilled,(s, a) => {
        s.loading = false; s.user = a.payload.user; s.accessToken = a.payload.access_token;
        s.successMsg = `Welcome back, ${a.payload.user?.name || a.payload.user?.email}`;
        persist(a.payload);
      })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null; s.accessToken = null;
        localStorage.clear();
      })

      .addCase(refreshToken.fulfilled, (s, a) => {
        const t = a.payload?.access_token;
        if (t) { s.accessToken = t; localStorage.setItem('access_token', t); }
      });
  },
});

export const { clearMessages } = authSlice.actions;
export default authSlice.reducer;
