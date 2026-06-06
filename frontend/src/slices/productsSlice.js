import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.category_id) query.set('category_id', params.category_id);
    if (params.search) query.set('search', params.search);
    if (params.min_price) query.set('min_price', params.min_price);
    if (params.max_price) query.set('max_price', params.max_price);
    const res = await api.get(`/products?${query.toString()}`);
    return unwrap(res);
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to load products');
  }
});

export const fetchProductById = createAsyncThunk('products/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/products/${id}`);
    return unwrap(res);
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Product not found');
  }
});

export const fetchCategories = createAsyncThunk('products/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/categories');
    return unwrap(res);
  } catch (e) {
    return rejectWithValue('Failed to load categories');
  }
});

export const createProduct = createAsyncThunk('products/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/products', data);
    return unwrap(res);
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to create product');
  }
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/products/${id}`, data);
    return unwrap(res);
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to update product');
  }
});

export const deleteProduct = createAsyncThunk('products/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/products/${id}`);
    return id;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to delete product');
  }
});

const applySort = (items, sortBy) => {
  const arr = [...items];
  switch (sortBy) {
    case 'price-asc':  return arr.sort((a, b) => a.price - b.price);
    case 'price-desc': return arr.sort((a, b) => b.price - a.price);
    case 'name':       return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'newest':     return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    default:           return arr;
  }
};

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    filteredItems: [],
    currentProduct: null,
    categories: [],
    sortBy: 'newest',
    loading: false,
    error: null,
  },
  reducers: {
    setSortBy: (s, a) => {
      s.sortBy = a.payload;
      s.filteredItems = applySort(s.items, a.payload);
    },
    clearCurrentProduct: (s) => { s.currentProduct = null; },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchProducts.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchProducts.fulfilled, (s, a) => {
        s.loading = false;
        s.items = Array.isArray(a.payload) ? a.payload : [];
        s.filteredItems = applySort(s.items, s.sortBy);
      })
      .addCase(fetchProducts.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchProductById.pending,   (s) => { s.loading = true; s.currentProduct = null; })
      .addCase(fetchProductById.fulfilled, (s, a) => { s.loading = false; s.currentProduct = a.payload; })
      .addCase(fetchProductById.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchCategories.fulfilled, (s, a) => { s.categories = Array.isArray(a.payload) ? a.payload : []; })

      .addCase(createProduct.fulfilled, (s, a) => {
        s.items.unshift(a.payload);
        s.filteredItems = applySort(s.items, s.sortBy);
      })
      .addCase(updateProduct.fulfilled, (s, a) => {
        const idx = s.items.findIndex(p => p.id === a.payload.id);
        if (idx !== -1) s.items[idx] = a.payload;
        s.filteredItems = applySort(s.items, s.sortBy);
      })
      .addCase(deleteProduct.fulfilled, (s, a) => {
        s.items = s.items.filter(p => p.id !== a.payload);
        s.filteredItems = s.filteredItems.filter(p => p.id !== a.payload);
      });
  },
});

export const { setSortBy, clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;
