import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailCheck, AlertCircle, Sparkles } from 'lucide-react';
import { auth } from '../../lib/api/authService';

// Email verification landing page — the token arrives by email as
// /verify-email?token=…; this page consumes it once and reports honestly.
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState({ busy: true, ok: false, error: '' });

  useEffect(() => {
    if (!token) { setState({ busy: false, ok: false, error: 'This link is missing its token. Sign in and request a new one.' }); return; }
    auth.verifyEmail(token)
      .then(() => setState({ busy: false, ok: true, error: '' }))
      .catch((e) => setState({ busy: false, ok: false, error: e.message || 'Verification failed.' }));
  }, [token]);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-12" style={{ background: 'var(--color-canvas)' }}>
      <div className="w-full max-w-md text-center rounded-2xl p-8" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg,#10b981,#d4af69)', color: '#fff' }}>
          {state.busy ? <Sparkles className="w-5 h-5" /> : state.ok ? <MailCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
          {state.busy ? 'Verifying…' : state.ok ? 'Email verified' : 'Could not verify'}
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-ink-secondary)' }}>
          {state.busy
            ? 'One moment — confirming your email with the server.'
            : state.ok
              ? 'Your email is confirmed. Sign in and complete your profile — verified emails get seen first.'
              : state.error}
        </p>
        <Link to="/auth/login" className="button primary inline-flex items-center px-5 py-2.5 font-semibold">Go to sign in</Link>
      </div>
    </div>
  );
}
