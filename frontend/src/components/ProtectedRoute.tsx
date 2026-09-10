import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '../schemas/index.js';
import { useAuthStore } from '../store/authStore.js';

export function ProtectedRoute({ allow }: { allow?: UserRole[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
