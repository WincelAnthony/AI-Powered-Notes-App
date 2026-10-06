import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="center-note" role="status">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
