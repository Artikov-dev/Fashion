import { useEffect, Component, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectTheme } from './slices/uiSlice';

import Layout         from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth (small — not lazy)
import Auth from './pages/Auth';

// Lazy-load CRM pages so one page crash won't kill the whole app
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Pipeline     = lazy(() => import('./pages/Pipeline'));
const Contacts     = lazy(() => import('./pages/Contacts'));
const ContactDetail = lazy(() => import('./pages/ContactDetail'));
const Leads        = lazy(() => import('./pages/Leads'));
const LeadDetail   = lazy(() => import('./pages/LeadDetail'));
const Tasks        = lazy(() => import('./pages/Tasks'));
const Analytics    = lazy(() => import('./pages/Analytics'));
const Admin        = lazy(() => import('./pages/Admin'));
const Settings     = lazy(() => import('./pages/Settings'));

// Page-level spinner
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-6 w-6 border-2 border-[#185FA5] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Global error boundary — shows error instead of blank screen
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A] p-8">
          <div className="max-w-md w-full bg-white dark:bg-[#1E293B] rounded-2xl p-8 border border-red-200 dark:border-red-500/20 shadow-lg text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Xato yuz berdi</h1>
            <p className="text-sm text-gray-500 dark:text-white/40 mb-6 font-mono bg-gray-50 dark:bg-white/5 p-3 rounded-lg text-left overflow-auto max-h-32">
              {this.state.error?.message || String(this.state.error)}
            </p>
            <button
              onClick={() => { localStorage.clear(); window.location.href = '/auth'; }}
              className="px-5 py-2 bg-[#185FA5] text-white text-sm font-medium rounded-xl hover:bg-[#1451A0] transition-colors"
            >
              Qayta boshlash
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function CRMRoute({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  const user  = useSelector((s) => s.auth.user);
  const theme = useSelector(selectTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Root redirect */}
          <Route path="/"
            element={<Navigate to={user ? '/dashboard' : '/auth'} replace />}
          />

          {/* Auth */}
          <Route path="/auth"
            element={user ? <Navigate to="/dashboard" replace /> : <Auth />}
          />

          {/* CRM routes */}
          <Route path="/dashboard"    element={<CRMRoute><Dashboard /></CRMRoute>} />
          <Route path="/pipeline"     element={<CRMRoute><Pipeline /></CRMRoute>} />
          <Route path="/contacts"     element={<CRMRoute><Contacts /></CRMRoute>} />
          <Route path="/contacts/:id" element={<CRMRoute><ContactDetail /></CRMRoute>} />
          <Route path="/leads"        element={<CRMRoute><Leads /></CRMRoute>} />
          <Route path="/leads/:id"    element={<CRMRoute><LeadDetail /></CRMRoute>} />
          <Route path="/tasks"        element={<CRMRoute><Tasks /></CRMRoute>} />
          <Route path="/analytics"    element={<CRMRoute roles={['admin','manager']}><Analytics /></CRMRoute>} />
          <Route path="/admin"        element={<CRMRoute roles={['admin']}><Admin /></CRMRoute>} />
          <Route path="/settings"     element={<CRMRoute><Settings /></CRMRoute>} />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
              <h1 className="text-8xl font-bold text-gray-200 dark:text-white/10">404</h1>
              <p className="text-sm text-gray-400 dark:text-white/30 mt-4 mb-6">Sahifa topilmadi</p>
              <a href="/" className="px-6 py-2.5 bg-[#185FA5] text-white text-sm font-medium rounded-xl hover:bg-[#1451A0] transition-colors">
                Bosh sahifaga
              </a>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
