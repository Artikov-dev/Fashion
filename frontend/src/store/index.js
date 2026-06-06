import { configureStore } from '@reduxjs/toolkit';
import authReducer    from '../slices/authSlice';
import productsReducer from '../slices/productsSlice';
import cartReducer    from '../features/cart/cartSlice';
import ordersReducer  from '../features/orders/ordersSlice';

export const store = configureStore({
  reducer: {
    auth:     authReducer,
    products: productsReducer,
    cart:     cartReducer,
    orders:   ordersReducer,
  },
  preloadedState: {
    auth: {
      user:         JSON.parse(localStorage.getItem('user') || 'null'),
      accessToken:  localStorage.getItem('access_token') || null,
      loading: false, error: null, successMsg: null,
    },
  },
});

export default store;
