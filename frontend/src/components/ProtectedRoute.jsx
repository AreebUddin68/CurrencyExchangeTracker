import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, adminOnly = false, premiumOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user)   return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'Admin') return <Navigate to="/dashboard" />;
  if (premiumOnly && user.role !== 'PremiumUser' && user.role !== 'Admin') return <Navigate to="/dashboard" />;
  return children;
}
