import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const normalize = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.items) return payload.items;
  if (payload?.data?.items) return payload.data.items;
  return [];
};

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/cart/');
    return normalize(res.data?.data ?? res.data);
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to load cart'); }
});

export const addToCart = createAsyncThunk('cart/add', async (product, { rejectWithValue }) => {
  try {
    const res = await api.post('/cart/add', {
      product_id: product?.id || product?.product_id,
      quantity: 1,
      size: product?.size || 'M',
      color: product?.color || 'Default',
    });
    return normalize(res.data?.data ?? res.data);
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to add to cart'); }
});

export const updateQuantity = createAsyncThunk('cart/update', async ({ id, quantity }, { rejectWithValue }) => {
  try {
    const res = await api.put('/cart/update', { item_id: id, quantity });
    return normalize(res.data?.data ?? res.data);
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to update'); }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (id, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/cart/remove/${id}`);
    return normalize(res.data?.data ?? res.data);
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to remove'); }
});

export const clearCartAPI = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    await api.delete('/cart/clear');
    return [];
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to clear cart'); }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (b) => {
    const handle = (actionCreator) => {
      b.addCase(actionCreator.pending,   (s) => { s.status = 'loading'; s.error = null; })
       .addCase(actionCreator.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload; })
       .addCase(actionCreator.rejected,  (s, a) => { s.status = 'failed'; s.error = a.payload; });
    };
    handle(fetchCart);
    handle(addToCart);
    handle(updateQuantity);
    handle(removeFromCart);
    handle(clearCartAPI);
  },
});

export default cartSlice.reducer;
