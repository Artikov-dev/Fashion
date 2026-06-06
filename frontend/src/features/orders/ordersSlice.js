import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchUserOrders = createAsyncThunk('orders/userOrders', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/orders/history');
    return unwrap(res);
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch orders'); }
});

export const fetchAllOrders = createAsyncThunk('orders/allOrders', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/orders');
    return unwrap(res);
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch orders'); }
});

export const updateOrderStatus = createAsyncThunk('orders/updateStatus', async ({ orderId, status }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/admin/orders/${orderId}/status`, { status });
    return unwrap(res);
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to update'); }
});

export const placeOrder = createAsyncThunk('orders/place', async (orderData, { rejectWithValue }) => {
  try {
    const res = await api.post('/cart/checkout', orderData);
    return unwrap(res);
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Order failed'); }
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState: { userOrders: [], allOrders: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(fetchUserOrders.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchUserOrders.fulfilled, (s, a) => {
        s.loading = false;
        s.userOrders = Array.isArray(a.payload) ? a.payload
          : Array.isArray(a.payload?.orders) ? a.payload.orders : [];
      })
      .addCase(fetchUserOrders.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchAllOrders.pending,   (s) => { s.loading = true; })
      .addCase(fetchAllOrders.fulfilled, (s, a) => {
        s.loading = false;
        s.allOrders = Array.isArray(a.payload) ? a.payload
          : Array.isArray(a.payload?.orders) ? a.payload.orders : [];
      })
      .addCase(fetchAllOrders.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(updateOrderStatus.fulfilled, (s, a) => {
        const updated = a.payload?.order ?? a.payload;
        if (updated?.id) {
          const idx = s.allOrders.findIndex(o => o.id === updated.id);
          if (idx !== -1) s.allOrders[idx] = { ...s.allOrders[idx], ...updated };
        }
      });
  },
});

export default ordersSlice.reducer;
