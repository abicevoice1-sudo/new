import Layout from '@/layouts/MainLayout';
import { useEffect, useState } from 'react';
import { adminData } from '@lib/api/adminData';

const PERMISSION_LABELS = {
  profileView: 'Profile View',
  messageView: 'Message Access',
  contactApproval: 'Contact Approval',
  familyIntroduction: 'Family Introduction',
};

function statusPillClass(status) {
  if (status === 'approved') return 'verified-pill';
  if (status === 'pending') return 'button muted';
  return '';
}

export default function AdminGuardians() {
  const [guardians, setGuardians] = useState([]);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, demo: isDemo } = await adminData.getGuardians();
        if (cancelled) return;
        // Shape guard: a non-array payload (e.g. an HTML fallback or error object)
        // must never reach .map().
        setGuardians(Array.isArray(data) ? data : []);
        setDemo(Boolean(isDemo));
      } catch {
        if (!cancelled) setLoadError('Could not load guardian assignments. Showing demo data instead.');
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
          <h1>Admin Guardian Management</h1>
          <div className="empty-state" role="status" aria-live="polite">
            <p>Loading guardian data…</p>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <main>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1>Admin Guardian Management</h1>
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
        <p>Review and manage wali (guardian) assignments for members.</p>

        {loadError && (
          <p className="empty-state" role="alert" style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>
            {loadError}
          </p>
        )}

        {guardians.length === 0 ? (
          <div className="empty-state">
            <p>No guardian assignments found.</p>
            <p style={{ marginTop: '4px' }}>Wali invitations sent by members will appear here for review.</p>
          </div>
        ) : (
          <div className="admin-grid">
            {guardians.map((guardian) => {
              const since = guardian?.assignedSince ? new Date(guardian.assignedSince) : null;
              const permissions = Array.isArray(guardian?.permissions) ? guardian.permissions : [];
              return (
                <div key={guardian.id} className="admin-card">
                  <h3>{guardian?.memberName || 'Unknown member'}</h3>
                  <p><strong>Guardian:</strong> {guardian?.guardianName || '—'}</p>
                  <p><strong>Relationship:</strong> {guardian?.relationship || '—'}</p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={statusPillClass(guardian?.status)}>
                      {guardian?.status
                        ? guardian.status.charAt(0).toUpperCase() + guardian.status.slice(1)
                        : 'Unknown'}
                    </span>
                  </p>
                  <p>
                    <strong>Assigned Since:</strong>{' '}
                    {since && !Number.isNaN(since.getTime()) ? since.toLocaleDateString() : '—'}
                  </p>
                  <div className="permission-tags" style={{ marginTop: '12px' }}>
                    <strong>Permissions:</strong><br />
                    {Object.entries(PERMISSION_LABELS).map(([perm, label]) => (
                      <span
                        key={perm}
                        className={permissions.includes(perm) ? 'verified-pill' : 'button muted'}
                        style={{
                          marginRight: '8px',
                          marginBottom: '4px',
                          display: 'inline-block',
                          padding: '4px 8px',
                          fontSize: '0.85rem',
                        }}
                      >
                        {label}
                      </span>
                    ))}
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
