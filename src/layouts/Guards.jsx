import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth/AuthContext';
import Layout from './MainLayout';

function LoadingGate() {
  return (
    <Layout>
      <main>
        <div className="empty-state">
          <p>Loading…</p>
        </div>
      </main>
    </Layout>
  );
}

/** Blocks logged-out visitors. Preserves the target so login can redirect back. */
export function RequireAuth() {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingGate />;
  if (!isLoggedIn) return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Blocks non-admins. Relies on session.isAdmin set at register/login. */
export function RequireAdmin() {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingGate />;
  if (!isLoggedIn) return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
