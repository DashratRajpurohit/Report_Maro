import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useSocketConnection } from '../hooks/useSocket.js';
import { NotificationBell } from './NotificationBell.js';
import { Button } from './Button.js';

export function Layout() {
  useSocketConnection();
  const { user, clearSession } = useAuthStore();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-brand-700">
            Societal Innovation Portal
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/problems" className="text-slate-600 hover:text-slate-900">
              Problems
            </Link>
            {user?.role === 'citizen' && (
              <Link to="/submit" className="text-slate-600 hover:text-slate-900">
                Report a problem
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-slate-600 hover:text-slate-900">
                Admin
              </Link>
            )}
            {user?.role === 'university' && (
              <Link to="/university" className="text-slate-600 hover:text-slate-900">
                University
              </Link>
            )}
            {user?.role === 'industry' && (
              <Link to="/industry" className="text-slate-600 hover:text-slate-900">
                Industry
              </Link>
            )}
            {user ? (
              <>
                <NotificationBell />
                <span className="text-slate-500">{user.full_name}</span>
                <Button variant="ghost" onClick={clearSession}>
                  Sign out
                </Button>
              </>
            ) : (
              <Link to="/login" className="text-slate-600 hover:text-slate-900">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
