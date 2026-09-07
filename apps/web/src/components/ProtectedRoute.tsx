import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '@sih/shared-types';
import { useAuthStore } from '../store/authStore.js';

/** Wraps a set of <Route> children; redirects to /login when unauthenticated or wrong role. */
export function ProtectedRoute({ allow }: { allow?: UserRole[] }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
