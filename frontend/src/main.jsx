import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/index.js';

import App from './App.jsx';
import './index.css';

// If stored user has a role that doesn't exist in CRM, clear stale data
try {
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const validRoles = ['admin', 'manager', 'sales', 'user'];
  if (storedUser && !validRoles.includes(storedUser.role)) {
    localStorage.clear();
  }
  // Also clear if token looks like an old non-JWT string
  const token = localStorage.getItem('access_token');
  if (token && !token.startsWith('eyJ')) {
    localStorage.clear();
  }
} catch {
  localStorage.clear();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
