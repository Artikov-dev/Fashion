import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';

import Navbar        from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Auth          from './pages/Auth';
import Home          from './pages/Home';
import Products      from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart          from './pages/Cart';
import Checkout      from './pages/Checkout';
import OrderSuccess  from './pages/OrderSuccess';
import OrderHistory  from './pages/OrderHistory';
import Admin         from './pages/Admin';

export default function App() {
  const user = useSelector((s) => s.auth.user);
  return (
    <BrowserRouter>
      <Navbar />
      <AnimatedRoutes user={user} />
    </BrowserRouter>
  );
}

function AnimatedRoutes({ user }) {
  const location = useLocation();

  const pageProps = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.45, ease: 'easeInOut' },
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/auth" element={
          user ? <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace /> : (
            <motion.div {...pageProps}><Auth /></motion.div>
          )
        } />
        <Route path="/"     element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/home') : '/auth'} replace />} />

        {/* Customer */}
        <Route path="/home"          element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/products"      element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/products/:id"  element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
        <Route path="/cart"          element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout"      element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
        <Route path="/orders/history" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
        {/* Legacy admin routes */}
        <Route path="/admin/orders"    element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={
          <motion.div {...pageProps} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f2ee', fontFamily: 'Cormorant Garamond, serif' }}>
            <h1 style={{ fontSize: 120, fontWeight: 300, color: '#d1ccc6', lineHeight: 1 }}>404</h1>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 14, color: '#9e9589', marginBottom: 32 }}>This page doesn't exist.</p>
            <a href="/" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px', background: '#0a0a0a', color: '#fff', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Jost, sans-serif' }}>
              Go Home
            </a>
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}
