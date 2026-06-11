import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

export const fetchLeads = createAsyncThunk('leads/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get('/leads', { params });
    return res.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load leads');
  }
});

export const fetchLead = createAsyncThunk('leads/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/leads/${id}`);
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load lead');
  }
});

export const createLead = createAsyncThunk('leads/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/leads', data);
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to create lead');
  }
});

export const updateLead = createAsyncThunk('leads/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/leads/${id}`, data);
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to update lead');
  }
});

export const deleteLead = createAsyncThunk('leads/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/leads/${id}`);
    return id;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to delete lead');
  }
});

export const updateLeadStage = createAsyncThunk('leads/updateStage', async ({ id, pipeline_stage_id }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/leads/${id}/stage`, { pipeline_stage_id });
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to move lead');
  }
});

export const updateLeadStatus = createAsyncThunk('leads/updateStatus', async ({ id, status, lost_reason }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/leads/${id}/status`, { status, lost_reason });
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to update status');
  }
});

export const fetchStages = createAsyncThunk('leads/fetchStages', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/pipeline/stages');
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load stages');
  }
});

const leadsSlice = createSlice({
  name: 'leads',
  initialState: {
    items:   [],
    current: null,
    stages:  [],
    meta:    { page: 1, per_page: 20, total: 0, pages: 1 },
    loading: false,
    error:   null,
  },
  reducers: {
    clearCurrent: (s) => { s.current = null; },
    clearError:   (s) => { s.error = null; },
    moveLeadLocally: (s, a) => {
      const { leadId, stageId } = a.payload;
      const lead = s.items.find((l) => l.id === leadId);
      if (lead) lead.pipeline_stage_id = stageId;
    },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchLeads.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchLeads.fulfilled, (s, a) => {
        s.loading = false;
        s.items   = a.payload.data;
        s.meta    = a.payload.meta;
      })
      .addCase(fetchLeads.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchLead.pending,    (s) => { s.loading = true; })
      .addCase(fetchLead.fulfilled,  (s, a) => { s.loading = false; s.current = a.payload; })
      .addCase(fetchLead.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchStages.fulfilled, (s, a) => { s.stages = a.payload; })

      .addCase(createLead.fulfilled,      (s, a) => { s.items.unshift(a.payload); })
      .addCase(updateLead.fulfilled,      (s, a) => {
        const idx = s.items.findIndex((l) => l.id === a.payload.id);
        if (idx !== -1) s.items[idx] = a.payload;
      })
      .addCase(deleteLead.fulfilled,      (s, a) => { s.items = s.items.filter((l) => l.id !== a.payload); })
      .addCase(updateLeadStage.fulfilled, (s, a) => {
        const idx = s.items.findIndex((l) => l.id === a.payload.id);
        if (idx !== -1) s.items[idx] = a.payload;
      })
      .addCase(updateLeadStatus.fulfilled, (s, a) => {
        const idx = s.items.findIndex((l) => l.id === a.payload.id);
        if (idx !== -1) s.items[idx] = a.payload;
      });
  },
});

export const { clearCurrent, clearError, moveLeadLocally } = leadsSlice.actions;
export default leadsSlice.reducer;
