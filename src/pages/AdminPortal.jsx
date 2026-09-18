import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth/AuthContext';
import Layout from '../layouts/MainLayout';

/**
 * Thin outlet for the guarded /admin subtree.
 * Auth is enforced by RequireAdmin in routes.jsx — this only provides layout.
 */
export default function AdminPortal() {
  const { logout } = useAuth();

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'sh_session' && !e.newValue) logout();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [logout]);

  return (
    <Layout>
      <main>
        <Outlet />
      </main>
    </Layout>
  );
}
