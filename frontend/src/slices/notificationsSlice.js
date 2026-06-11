import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

/* ── random task titles pool ─────────────────────────────── */
const TASK_POOL = [
  { title: 'Yangi mijozga qo\'ng\'iroq qilish',     priority: 'high',   icon: '📞' },
  { title: 'Taklifnoma tayyorlash',                  priority: 'medium', icon: '📄' },
  { title: 'Shartnomani ko\'rib chiqish',            priority: 'urgent', icon: '📋' },
  { title: 'Demo uchrashuv rejalash',                priority: 'high',   icon: '🤝' },
  { title: 'Hisobot yuborish',                       priority: 'medium', icon: '📊' },
  { title: 'Mijoz email\'ini javoblash',             priority: 'low',    icon: '✉️' },
  { title: 'CRM ma\'lumotlarini yangilash',          priority: 'low',    icon: '🔄' },
  { title: 'Haftalik natijalarni tahlil qilish',     priority: 'medium', icon: '📈' },
  { title: 'Yangi lead bilan bog\'lanish',           priority: 'high',   icon: '⚡' },
  { title: 'Prezentatsiya materiallarini tayyorlash', priority: 'urgent', icon: '🎯' },
  { title: 'Klient bilan follow-up qo\'ng\'iroq',   priority: 'high',   icon: '📞' },
  { title: 'Trello boardni yangilash',               priority: 'low',    icon: '✅' },
];

let _notifId = Date.now();
const nextId = () => ++_notifId;

/* ── thunk: auto-create random task via API ──────────────── */
export const createRandomTask = createAsyncThunk(
  'notifications/createRandomTask',
  async (_, { rejectWithValue }) => {
    const pick = TASK_POOL[Math.floor(Math.random() * TASK_POOL.length)];
    const due  = new Date(Date.now() + (1 + Math.floor(Math.random() * 6)) * 86400000);

    try {
      const res = await api.post('/tasks', {
        title:    pick.title,
        priority: pick.priority,
        status:   'todo',
        due_date: due.toISOString(),
      });
      return { task: res.data.data, meta: pick };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Task yaratib bo\'lmadi');
    }
  }
);

/* ── slice ───────────────────────────────────────────────── */
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],       // { id, type, title, body, icon, time, read, taskId? }
    unread: 0,
  },
  reducers: {
    addNotification(state, { payload }) {
      state.items.unshift({ id: nextId(), read: false, time: Date.now(), ...payload });
      if (state.items.length > 50) state.items.pop();
      state.unread = state.items.filter(n => !n.read).length;
    },
    markRead(state, { payload }) {
      const n = state.items.find(i => i.id === payload);
      if (n) n.read = true;
      state.unread = state.items.filter(n => !n.read).length;
    },
    markAllRead(state) {
      state.items.forEach(n => { n.read = true; });
      state.unread = 0;
    },
    removeNotification(state, { payload }) {
      state.items = state.items.filter(i => i.id !== payload);
      state.unread = state.items.filter(n => !n.read).length;
    },
    clearAll(state) {
      state.items = [];
      state.unread = 0;
    },
  },
  extraReducers: (b) => {
    b.addCase(createRandomTask.fulfilled, (state, { payload }) => {
      state.items.unshift({
        id:     nextId(),
        read:   false,
        time:   Date.now(),
        type:   'task',
        icon:   payload.meta.icon,
        title:  'Yangi vazifa qo\'shildi',
        body:   payload.meta.title,
        taskId: payload.task?.id,
        priority: payload.meta.priority,
      });
      if (state.items.length > 50) state.items.pop();
      state.unread = state.items.filter(n => !n.read).length;
    });
    b.addCase(createRandomTask.rejected, (state, { payload }) => {
      state.items.unshift({
        id:    nextId(),
        read:  false,
        time:  Date.now(),
        type:  'error',
        icon:  '⚠️',
        title: 'Vazifa yaratishda xato',
        body:  payload || 'Noma\'lum xato',
      });
      state.unread = state.items.filter(n => !n.read).length;
    });
  },
});

export const { addNotification, markRead, markAllRead, removeNotification, clearAll } =
  notificationsSlice.actions;

export const selectNotifications = s => s.notifications.items;
export const selectUnread        = s => s.notifications.unread;

export default notificationsSlice.reducer;
