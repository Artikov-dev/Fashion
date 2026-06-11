import { configureStore } from '@reduxjs/toolkit';
import authReducer          from '../slices/authSlice';
import contactsReducer      from '../slices/contactsSlice';
import leadsReducer         from '../slices/leadsSlice';
import tasksReducer         from '../slices/tasksSlice';
import analyticsReducer     from '../slices/analyticsSlice';
import uiReducer            from '../slices/uiSlice';
import notificationsReducer from '../slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    contacts:      contactsReducer,
    leads:         leadsReducer,
    tasks:         tasksReducer,
    analytics:     analyticsReducer,
    ui:            uiReducer,
    notifications: notificationsReducer,
  },
  preloadedState: {
    auth: {
      user:        (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { localStorage.removeItem('user'); return null; } })(),
      accessToken: localStorage.getItem('access_token') || null,
      loading: false, error: null, successMsg: null,
    },
  },
});

export default store;
