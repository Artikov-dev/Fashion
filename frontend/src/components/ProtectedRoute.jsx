import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const user     = useSelector((s) => s.auth.user);
  const location = useLocation();

  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/home" replace />;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.995 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}
