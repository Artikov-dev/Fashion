import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get('/tasks', { params });
    return res.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load tasks');
  }
});

export const fetchMyTasks = createAsyncThunk('tasks/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/tasks/my');
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load my tasks');
  }
});

export const fetchOverdueTasks = createAsyncThunk('tasks/fetchOverdue', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/tasks/overdue');
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load overdue tasks');
  }
});

export const createTask = createAsyncThunk('tasks/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/tasks', data);
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to create task');
  }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/tasks/${id}`, data);
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to update task');
  }
});

export const updateTaskStatus = createAsyncThunk('tasks/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/tasks/${id}/status`, { status });
    return res.data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to update task status');
  }
});

export const deleteTask = createAsyncThunk('tasks/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/tasks/${id}`);
    return id;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to delete task');
  }
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    items:   [],
    myTasks: [],
    overdue: [],
    meta:    { page: 1, per_page: 20, total: 0, pages: 1 },
    loading: false,
    error:   null,
  },
  reducers: {
    clearError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchTasks.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchTasks.fulfilled, (s, a) => {
        s.loading = false;
        s.items   = a.payload.data;
        s.meta    = a.payload.meta;
      })
      .addCase(fetchTasks.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchMyTasks.fulfilled,     (s, a) => { s.myTasks = a.payload; })
      .addCase(fetchOverdueTasks.fulfilled, (s, a) => { s.overdue = a.payload; })

      .addCase(createTask.fulfilled, (s, a) => { s.items.unshift(a.payload); })

      .addCase(updateTask.fulfilled, (s, a) => {
        const idx = s.items.findIndex((t) => t.id === a.payload.id);
        if (idx !== -1) s.items[idx] = a.payload;
        const mi = s.myTasks.findIndex((t) => t.id === a.payload.id);
        if (mi !== -1) s.myTasks[mi] = a.payload;
      })

      .addCase(updateTaskStatus.fulfilled, (s, a) => {
        const idx = s.items.findIndex((t) => t.id === a.payload.id);
        if (idx !== -1) s.items[idx] = a.payload;
        const mi = s.myTasks.findIndex((t) => t.id === a.payload.id);
        if (mi !== -1) s.myTasks[mi] = a.payload;
        s.overdue = s.overdue.filter((t) => t.id !== a.payload.id || t.status === a.payload.status);
      })

      .addCase(deleteTask.fulfilled, (s, a) => {
        s.items   = s.items.filter((t) => t.id !== a.payload);
        s.myTasks = s.myTasks.filter((t) => t.id !== a.payload);
        s.overdue = s.overdue.filter((t) => t.id !== a.payload);
      });
  },
});

export const { clearError } = tasksSlice.actions;
export default tasksSlice.reducer;
