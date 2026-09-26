import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { auth } from '../../lib/api/authService';

// Reset password — consumes the one-hour, single-use emailed token.
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true); setError('');
    try {
      await auth.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/auth/login'), 1800);
    } catch (err) {
      setError(err.message || 'Reset failed — the link may have expired. Request a new one.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-12" style={{ background: 'var(--color-canvas)' }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: 'color-mix(in srgb, var(--color-elevated) 82%, transparent)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg,#10b981,#d4af69)', color: '#fff' }}>
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-ink)' }}>Choose a new password</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-ink-secondary)' }}>At least 8 characters. This link works once and expires in an hour.</p>
        {done ? (
          <p className="text-sm" style={{ color: 'var(--color-primary)' }}>Password updated — taking you to sign in…</p>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {error && <div className="p-4 rounded-xl text-sm" style={{ background: 'var(--color-danger-subtle)', color: 'var(--color-danger)' }}>{error}</div>}
            {!token && <div className="p-4 rounded-xl text-sm" style={{ background: 'var(--color-danger-subtle)', color: 'var(--color-danger)' }}>This page needs a reset link from your email. <Link to="/auth/forgot" className="link-primary">Request one</Link>.</div>}
            <div>
              <label htmlFor="np1" className="block mb-1.5 text-sm font-medium" style={{ color: 'var(--color-ink-secondary)' }}>New password</label>
              <input id="np1" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input w-full" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }} />
            </div>
            <div>
              <label htmlFor="np2" className="block mb-1.5 text-sm font-medium" style={{ color: 'var(--color-ink-secondary)' }}>Confirm new password</label>
              <input id="np2" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input w-full" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }} />
            </div>
            <button type="submit" disabled={busy || !token} className="btn btn-primary w-full py-3.5">{busy ? 'Updating…' : 'Update password'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
