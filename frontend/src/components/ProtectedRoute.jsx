import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-cyan-500 dark:border-slate-700"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
