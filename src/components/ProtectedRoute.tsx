/**
 * ProtectedRoute — wraps any route that requires the user to be signed in.
 *
 * Behaviour:
 *  • While session is being restored (isLoading = true) → show a full-screen
 *    loading state so there is no flash of a redirect.
 *  • Not authenticated → redirect to /login, preserving the intended path in
 *    location.state.from so Login.tsx can navigate back after sign-in.
 *  • Authenticated but wrong role (optional allowedRoles prop) → redirect to
 *    /dashboard (user is logged in but can't access this specific page).
 *  • All checks pass → render children as-is.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { FaVideo } from 'react-icons/fa6';
import { useAuth, type BackendRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, only users with one of these roles can access the route. */
  allowedRoles?: BackendRole[];
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-[#3678F1] flex items-center justify-center shadow-lg shadow-[#3678F1]/25 animate-pulse">
        <FaVideo className="text-white text-lg" />
      </div>
      <p className="text-sm text-neutral-500">Loading…</p>
    </div>
  );
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
