import Layout from '@/layouts/MainLayout';
import { useState } from 'react';
import { useToast } from '@lib/useToast';

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
};

const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

const DEMO_TICKETS = [
  {
    id: 1,
    user: 'Fatima N. (fatima@example.com)',
    subject: 'Photo Upload Issue',
    status: 'open',
    priority: 'medium',
    createdAt: '2026-08-22',
    lastUpdated: '2026-08-23',
  },
  {
    id: 2,
    user: 'Yusuf K. (yusuf@example.com)',
    subject: 'Match Notifications Not Working',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2026-08-20',
    lastUpdated: '2026-08-24',
  },
  {
    id: 3,
    user: 'Ali J. (ali@example.com)',
    subject: 'Question About Verification Process',
    status: 'closed',
    priority: 'low',
    createdAt: '2026-08-18',
    lastUpdated: '2026-08-19',
  },
];

export default function AdminSupport() {
  const [tickets, setTickets] = useState(DEMO_TICKETS);
  const [filter, setFilter] = useState('all');
  const { addToast } = useToast();

  const updateStatus = (ticketId, nextStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus, lastUpdated: new Date().toISOString().slice(0, 10) } : t)),
    );
    addToast(`Ticket #${ticketId} marked “${STATUS_LABELS[nextStatus]}”.`, 'success');
  };

  const filteredTickets = tickets.filter(
    (ticket) => filter === 'all' || ticket.status === filter,
  );

  return (
    <Layout>
      <main>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1>Admin Support Center</h1>
          <span
            className="verified-pill"
            style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}
            title="Backed by local demo data until the admin API is connected"
          >
            Demo data
          </span>
        </div>
        <p>Review, triage, and resolve member support tickets and inquiries.</p>

        <div className="settings-list" style={{ marginBottom: '24px' }}>
          <div className="toggle-row">
            <span>Filter by Status:</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter tickets by status">
              <option value="all">All Tickets</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="empty-state">
            <p>No tickets match the current filter.</p>
            <p style={{ marginTop: '4px' }}>Try a different status or check back later.</p>
          </div>
        ) : (
          <div className="settings-list">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="toggle-row">
                <div>
                  <strong>{ticket.user}</strong><br />
                  <small>{ticket.subject}</small>
                </div>
                <div>
                  <select
                    value={ticket.status}
                    onChange={(e) => updateStatus(ticket.id, e.target.value)}
                    aria-label={`Status for ticket ${ticket.id} — ${ticket.subject}`}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="ticket-priority">{PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</div>
                <div className="ticket-dates">
                  <small>Created: {ticket.createdAt}</small><br />
                  <small>Updated: {ticket.lastUpdated}</small>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="section" style={{ marginTop: '32px' }}>
          <h2>Respond to a ticket</h2>
          <p>
            Select a ticket above to update its status. Replies and internal notes are sent to the
            member's inbox and mirrored in their conversation thread once the support API is connected.
          </p>
        </div>
      </main>
    </Layout>
  );
}
