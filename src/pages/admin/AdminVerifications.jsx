import { useEffect, useState } from 'react';
import Layout from '@/layouts/MainLayout';
import { useToast } from '@lib/useToast';
import { http, useRemote } from '@lib/api/transport';

// Admin verification queue — every submission is reviewed by a person.
// Approving flips the member's public verified badge instantly.
export default function AdminVerifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [fileUrl, setFileUrl] = useState('');
  const { addToast } = useToast();

  const load = async (s = status) => {
    setLoading(true);
    try {
      if (!useRemote) { setItems([]); return; }
      setItems(await http.get(`/api/admin/verifications?status=${encodeURIComponent(s)}`));
    } catch (e) {
      addToast(e.message || 'Could not load verifications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(status); }, [status]);

  const act = async (id, action) => {
    try {
      await http.post(`/api/admin/verifications/${encodeURIComponent(id)}/${action}`, {});
      addToast(action === 'approve' ? 'Approved — verified badge is live for this member.' : 'Rejected — the member can resubmit.', 'success');
      load();
    } catch (e) {
      addToast(e.message || 'Action failed.', 'error');
    }
  };

  const openFile = (id) => {
    const base = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');
    const url = `${base}/api/admin/verifications/${encodeURIComponent(id)}/file`;
    const token = localStorage.getItem('sh_token');
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => { if (!r.ok) throw new Error('Could not load image'); return r.blob(); })
      .then((b) => setFileUrl(URL.createObjectURL(b)))
      .catch((e) => addToast(e.message, 'error'));
  };

  return (
    <Layout>
      <main>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1>Verification queue</h1>
          {!useRemote && (
            <span className="verified-pill" style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
              Backend required
            </span>
          )}
        </div>
        <p>Selfie and ID submissions from members. Approving sets the public verified badge; rejecting asks the member to resubmit. Review by a person, every time.</p>

        <div className="settings-list" style={{ marginBottom: '24px' }}>
          <div className="toggle-row">
            <div><strong>Filter by status</strong></div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter verifications by status">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading submissions…</p></div>
        ) : !useRemote ? (
          <div className="empty-state">
            <p>No backend connected.</p>
            <p style={{ marginTop: '4px' }}>Set VITE_API_URL to review verification submissions.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>No {status} submissions.</p></div>
        ) : (
          <div className="settings-list">
            {items.map((v) => (
              <div key={v.id} className="toggle-row" style={{ alignItems: 'flex-start' }}>
                <div>
                  <strong>{v.member_name || 'Member'} <span style={{ fontWeight: 400, fontSize: '0.8em' }}>({v.member_email})</span></strong><br />
                  <small>{v.kind === 'selfie' ? 'Selfie' : 'ID document'} · submitted {new Date(v.created_at).toLocaleString()}</small>
                  {fileUrl && <div style={{ marginTop: 8 }}><img src={fileUrl} alt="Verification submission" style={{ maxWidth: 260, borderRadius: 8, border: '1px solid var(--color-border)' }} /></div>}
                </div>
                {status === 'pending' ? (
                  <div style={{ display: 'flex', gap: 8, flexDirection: 'column', alignItems: 'stretch' }}>
                    <button onClick={() => openFile(v.id)} className="button px-3 py-1.5 text-xs font-semibold" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}>View photo</button>
                    <button onClick={() => act(v.id, 'approve')} className="button primary px-3 py-1.5 text-xs font-semibold">Approve</button>
                    <button onClick={() => act(v.id, 'reject')} className="button px-3 py-1.5 text-xs font-semibold" style={{ background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}>Reject</button>
                  </div>
                ) : (
                  <small style={{ color: 'var(--color-ink-faint)' }}>Reviewed {v.reviewed_at ? new Date(v.reviewed_at).toLocaleString() : ''}</small>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}
