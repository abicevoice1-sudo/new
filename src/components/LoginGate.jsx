import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

// Signed-out gate shared by the community feed and the full-page post view, so
// the "reading is open, writing needs an account" rule reads identically on both.
export default function LoginGate({ onClose }) {
  return (
    <div className="ai-backdrop" style={{ zIndex: 400 }} onClick={onClose}>
      <div className="ai-drawer" style={{ width: '380px', maxWidth: '95vw', margin: '2rem auto', borderRadius: 'var(--radius-xl)', position: 'relative', top: '20vh' }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Join the conversation">
        <div className="ai-drawer-header">
          <div className="ai-orb"><Lock className="w-4 h-4" /></div>
          <div><p className="ai-drawer-title">Join the conversation</p></div>
          <button className="ai-icon-btn" onClick={onClose} aria-label="Close"><span style={{ fontSize: '1.25rem' }}>×</span></button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-ink-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Create a free account or log in to comment, post, and join communities. Reading is open to everyone.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/register" className="button primary w-full text-center py-2.5 font-semibold" onClick={onClose}>Create free account</Link>
            <Link to="/auth/login" className="button w-full text-center py-2.5 font-semibold" onClick={onClose} style={{ background: 'var(--color-elevated)', color: 'var(--color-ink)', border: '1px solid var(--color-border)' }}>Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
