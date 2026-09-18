import Layout from '@/layouts/MainLayout';
import { useEffect, useState } from 'react';
import { adminData } from '@lib/api/adminData';

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, demo: isDemo } = await adminData.getMessages();
        if (cancelled) return;
        // Shape guard: never trust the transport layer with non-array payloads.
        setMessages(Array.isArray(data) ? data : []);
        setDemo(Boolean(isDemo));
      } catch {
        if (!cancelled) setLoadError('Could not load the admin inbox. Showing demo data instead.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <Layout>
        <main>
          <h1>Admin Messages</h1>
          <div className="empty-state" role="status" aria-live="polite">
            <p>Loading messages…</p>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <main>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1>Admin Messages</h1>
          {demo && (
            <span
              className="verified-pill"
              style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}
              title="Backed by local demo data until the admin API is connected"
            >
              Demo data
            </span>
          )}
        </div>
        <p>Messages sent to administrators from members and system notifications.</p>

        {loadError && (
          <p className="empty-state" role="alert" style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>
            {loadError}
          </p>
        )}

        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages to display.</p>
            <p style={{ marginTop: '4px' }}>New member and system messages will appear here.</p>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((msg) => {
              const senderInitial = (msg?.sender ?? '?').charAt(0).toUpperCase();
              const timestamp = msg?.timestamp ? new Date(msg.timestamp) : null;
              return (
                <div key={msg.id} className="message-card">
                  <div className="message-card-avatar">
                    <span className="avatar-mark">{senderInitial}</span>
                  </div>
                  <div className="message-card-body">
                    <div className="message-card-top">
                      <strong>{msg?.sender ?? 'Unknown sender'}</strong>
                      <span>{timestamp && !Number.isNaN(timestamp.getTime()) ? timestamp.toLocaleString() : '—'}</span>
                      {!msg?.read && (
                        <span
                          className="verified-pill"
                          style={{ background: 'var(--color-danger-subtle)', color: 'var(--color-danger)' }}
                        >
                          Unread
                        </span>
                      )}
                    </div>
                    <p className="message-card-preview">
                      <strong>{msg?.subject}:</strong> {msg?.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </Layout>
  );
}
