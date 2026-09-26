import Layout from '@/layouts/MainLayout';
import { useEffect, useState } from 'react';
import { useToast } from '@lib/useToast';
import { http, useRemote } from '@lib/api/transport';

export default function AdminSupport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const { addToast } = useToast();

  const load = async (status = filter) => {
    setLoading(true);
    try {
      if (!useRemote) { setReports([]); return; }
      setReports(await http.get(`/api/admin/reports?status=${encodeURIComponent(status)}`));
    } catch (e) {
      addToast(e.message || 'Could not load reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(filter); }, [filter]);

  const act = async (id, action) => {
    try {
      await http.post(`/api/admin/reports/${encodeURIComponent(id)}/${action}`, {});
      addToast(action === 'action' ? `Report actioned — content hidden.` : `Report dismissed.`, 'success');
      load();
    } catch (e) {
      addToast(e.message || 'Action failed.', 'error');
    }
  };

  return (
    <Layout>
      <main>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1>Safety reports</h1>
          {!useRemote && (
            <span
              className="verified-pill"
              style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}
              title="Connect the backend (VITE_API_URL) to review live member reports"
            >
              Backend required
            </span>
          )}
        </div>
        <p>Member reports from profiles, posts, replies and messages. Actioning hides the content immediately.</p>

        <div className="settings-list" style={{ marginBottom: '24px' }}>
          <div className="toggle-row">
            <span>Filter by Status:</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter reports by status">
              <option value="open">Open</option>
              <option value="actioned">Actioned</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading reports…</p></div>
        ) : !useRemote ? (
          <div className="empty-state">
            <p>No backend connected.</p>
            <p style={{ marginTop: '4px' }}>Set VITE_API_URL to review live member reports here. Member-facing report buttons already work in demo mode.</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <p>No {filter} reports.</p>
            <p style={{ marginTop: '4px' }}>New member reports will appear here.</p>
          </div>
        ) : (
          <div className="settings-list">
            {reports.map((r) => (
              <div key={r.id} className="toggle-row" style={{ alignItems: 'flex-start' }}>
                <div>
                  <strong>{r.target_type}: {String(r.target_id).slice(0, 24)}</strong><br />
                  <small>by {r.reporter_email || r.reporter_id} · {new Date(r.created_at).toLocaleString()}</small>
                  <p style={{ marginTop: '6px' }}>{r.reason}</p>
                </div>
                {filter === 'open' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => act(r.id, 'action')} className="button primary px-3 py-1.5 text-xs font-semibold">Hide + action</button>
                    <button onClick={() => act(r.id, 'dismiss')} className="button px-3 py-1.5 text-xs font-semibold" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}>Dismiss</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}
