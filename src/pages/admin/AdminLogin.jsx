import Layout from '@/layouts/MainLayout';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';

export default function AdminLogin() {
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    try {
      const { user } = await login(formData.email, formData.password);
      if (!user?.isAdmin) {
        setStatus('error');
        setErrorMessage('This account does not have admin access.');
        return;
      }
      navigate(location.state?.from ?? '/admin/dashboard', { replace: true });
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <Layout>
      <main>
        <div className="auth-suite-compact">
          <div className="auth-copy">
            <h1>Admin Login</h1>
            <p>Sign in with an admin account to access the admin panel.</p>

            {errorMessage && (
              <div className="form-error">
                <p>{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-card">
              <div>
                <label htmlFor="adminEmail">Email Address *</label>
                <input
                  type="email"
                  id="adminEmail"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="adminPassword">Password *</label>
                <input
                  type="password"
                  id="adminPassword"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" className="button primary" disabled={status === 'loading'}>
                {status === 'loading' ? 'Signing in…' : 'Sign In'}
              </button>

              <div className="auth-note" style={{ marginTop: '16px', fontSize: '0.9rem' }}>
                <p>Admin access is granted to emails in VITE_ADMIN_EMAILS{isAdmin ? ' (you are signed in as admin).' : '.'}</p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </Layout>
  );
}
