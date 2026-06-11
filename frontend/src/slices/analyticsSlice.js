import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

export const fetchDashboard      = createAsyncThunk('analytics/dashboard',      async (_, { rejectWithValue }) => {
  try { return (await api.get('/analytics/dashboard')).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchLeadsByStage   = createAsyncThunk('analytics/leadsByStage',   async (_, { rejectWithValue }) => {
  try { return (await api.get('/analytics/leads/by-stage')).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchFunnel         = createAsyncThunk('analytics/funnel',         async (_, { rejectWithValue }) => {
  try { return (await api.get('/analytics/leads/funnel')).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchRevenueTrend   = createAsyncThunk('analytics/revenueTrend',   async (_, { rejectWithValue }) => {
  try { return (await api.get('/analytics/revenue/trend')).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchRevenueForecast = createAsyncThunk('analytics/revenueForecast', async (_, { rejectWithValue }) => {
  try { return (await api.get('/analytics/revenue/forecast')).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchTeamPerformance = createAsyncThunk('analytics/teamPerformance', async (_, { rejectWithValue }) => {
  try { return (await api.get('/analytics/team/performance')).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchContactsGrowth = createAsyncThunk('analytics/contactsGrowth', async (_, { rejectWithValue }) => {
  try { return (await api.get('/analytics/contacts/growth')).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchActivityFeed   = createAsyncThunk('analytics/activityFeed',   async (_, { rejectWithValue }) => {
  try { return (await api.get('/analytics/activities/feed')).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    dashboard:      null,
    leadsByStage:   [],
    funnel:         [],
    revenueTrend:   [],
    revenueForecast: [],
    teamPerformance: [],
    contactsGrowth: [],
    activityFeed:   [],
    loading:        false,
    error:          null,
  },
  reducers: {
    clearError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    const handle = (thunk, key) => {
      b.addCase(thunk.pending,   (s) => { s.loading = true; })
       .addCase(thunk.fulfilled, (s, a) => { s.loading = false; s[key] = a.payload; })
       .addCase(thunk.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });
    };
    handle(fetchDashboard,       'dashboard');
    handle(fetchLeadsByStage,    'leadsByStage');
    handle(fetchFunnel,          'funnel');
    handle(fetchRevenueTrend,    'revenueTrend');
    handle(fetchRevenueForecast, 'revenueForecast');
    handle(fetchTeamPerformance, 'teamPerformance');
    handle(fetchContactsGrowth,  'contactsGrowth');
    handle(fetchActivityFeed,    'activityFeed');
  },
});

export const { clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
