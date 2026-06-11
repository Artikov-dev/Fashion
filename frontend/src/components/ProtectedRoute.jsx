import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * roles — optional array of allowed roles, e.g. ['admin', 'manager']
 * If omitted, any authenticated user is allowed.
 */
export default function ProtectedRoute({ children, roles }) {
  const user     = useSelector((s) => s.auth.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
