import { useState } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { fileReport } from '../lib/api/safety';
import LoginGate from './LoginGate';

// Report + block flag for profiles, posts, replies, messages.
// Reading stays open; guests get the login gate when they try to file.
export function ReportFlag({ targetType, targetId, onDone }) {
  const { isLoggedIn } = useAuth();
  const [reason, setReason] = useState('');
  const [gate, setGate] = useState(false);
  const [state, setState] = useState({ idle: true, busy: false, ok: false, error: '' });

  const submit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { setGate(true); return; }
    if (!reason.trim()) { setState({ idle: false, busy: false, ok: false, error: 'Please describe the problem.' }); return; }
    setState({ idle: false, busy: true, ok: false, error: '' });
    try {
      await fileReport({ targetType, targetId, reason: reason.trim() });
      setState({ idle: false, busy: false, ok: true, error: '' });
      onDone?.();
    } catch (err) {
      setState({ idle: false, busy: false, ok: false, error: err.message || 'Could not send your report.' });
    }
  };

  if (state.ok) {
    return <p className="text-xs" style={{ color: 'var(--color-ink-secondary)' }}>Thanks — our team will review this.</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={`report-${targetType}-${targetId}`} className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>
        Report this {targetType}?
      </label>
      <textarea
        id={`report-${targetType}-${targetId}`}
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="What is wrong? (e.g. harassment, scam, contact solicitation)"
        rows={2}
        maxLength={1000}
        className="input w-full resize-none text-xs"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      />
      {state.error && <p className="text-xs" style={{ color: 'var(--color-danger, #c0392b)' }}>{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={state.busy} className="button primary px-3 py-1.5 text-xs font-semibold" style={{ opacity: state.busy ? 0.6 : 1 }}>
          {state.busy ? 'Sending…' : 'Send report'}
        </button>
        {onDone && <button type="button" onClick={onDone} className="text-xs hover:underline" style={{ color: 'var(--color-ink-faint)' }}>Cancel</button>}
      </div>
      {gate && <LoginGate onClose={() => setGate(false)} />}
    </form>
  );
}
