import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

export const fetchContacts = createAsyncThunk('contacts/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get('/contacts', { params });
    return res.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load contacts');
  }
});

export const fetchContact = createAsyncThunk('contacts/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/contacts/${id}`);
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load contact');
  }
});

export const createContact = createAsyncThunk('contacts/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/contacts', data);
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to create contact');
  }
});

export const updateContact = createAsyncThunk('contacts/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/contacts/${id}`, data);
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to update contact');
  }
});

export const deleteContact = createAsyncThunk('contacts/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/contacts/${id}`);
    return id;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to delete contact');
  }
});

const contactsSlice = createSlice({
  name: 'contacts',
  initialState: {
    items:    [],
    current:  null,
    meta:     { page: 1, per_page: 20, total: 0, pages: 1 },
    loading:  false,
    error:    null,
  },
  reducers: {
    clearCurrent: (s) => { s.current = null; },
    clearError:   (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchContacts.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchContacts.fulfilled, (s, a) => {
        s.loading = false;
        s.items   = a.payload.data;
        s.meta    = a.payload.meta;
      })
      .addCase(fetchContacts.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchContact.pending,    (s) => { s.loading = true; s.error = null; })
      .addCase(fetchContact.fulfilled,  (s, a) => { s.loading = false; s.current = a.payload; })
      .addCase(fetchContact.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(createContact.fulfilled, (s, a) => {
        s.items.unshift(a.payload);
        s.meta.total += 1;
      })

      .addCase(updateContact.fulfilled, (s, a) => {
        const idx = s.items.findIndex((c) => c.id === a.payload.id);
        if (idx !== -1) s.items[idx] = a.payload;
        if (s.current?.id === a.payload.id) s.current = { ...s.current, ...a.payload };
      })

      .addCase(deleteContact.fulfilled, (s, a) => {
        s.items    = s.items.filter((c) => c.id !== a.payload);
        s.meta.total -= 1;
      });
  },
});

export const { clearCurrent, clearError } = contactsSlice.actions;
export default contactsSlice.reducer;
