import { createSlice } from '@reduxjs/toolkit';

const stored = localStorage.getItem('nexora-theme') || 'light';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme:          stored,
    sidebarCollapsed: false,
    modal:          { open: false, type: null, data: null },
    globalSearch:   '',
    notifications:  [],
  },
  reducers: {
    toggleTheme: (s) => {
      s.theme = s.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('nexora-theme', s.theme);
      document.documentElement.classList.toggle('dark', s.theme === 'dark');
    },
    setTheme: (s, a) => {
      s.theme = a.payload;
      localStorage.setItem('nexora-theme', a.payload);
      document.documentElement.classList.toggle('dark', a.payload === 'dark');
    },
    toggleSidebar:    (s) => { s.sidebarCollapsed = !s.sidebarCollapsed; },
    setSidebarCollapsed: (s, a) => { s.sidebarCollapsed = a.payload; },
    openModal:  (s, a) => { s.modal = { open: true,  type: a.payload.type,  data: a.payload.data || null }; },
    closeModal: (s) =>    { s.modal = { open: false, type: null, data: null }; },
    setGlobalSearch: (s, a) => { s.globalSearch = a.payload; },
    addNotification: (s, a) => {
      s.notifications.unshift({ id: Date.now(), ...a.payload });
      if (s.notifications.length > 10) s.notifications.pop();
    },
    removeNotification: (s, a) => {
      s.notifications = s.notifications.filter((n) => n.id !== a.payload);
    },
  },
});

export const {
  toggleTheme, setTheme,
  toggleSidebar, setSidebarCollapsed,
  openModal, closeModal,
  setGlobalSearch,
  addNotification, removeNotification,
} = uiSlice.actions;

export const selectTheme            = (state) => state.ui.theme;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectModal            = (state) => state.ui.modal;
export const selectGlobalSearch     = (state) => state.ui.globalSearch;

export default uiSlice.reducer;
