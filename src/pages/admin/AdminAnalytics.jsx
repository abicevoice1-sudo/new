import Layout from '@/layouts/MainLayout';
import { useEffect, useState } from 'react';
import { adminData, ANALYTICS_TITLES } from '@lib/api/adminData';

/** Compact CSS bar chart — no chart library, no placeholder text. */
function MiniBarChart({ labels, values, color }) {
  const max = Math.max(...values, 1);
  return (
    <div className="chart-placeholder" role="img" aria-label={`Bar chart with ${labels.length} data points`}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '96px', width: '100%' }}>
        {labels.map((label, i) => {
          const v = values[i] ?? 0;
          const pct = Math.round((v / max) * 100);
          return (
            <div
              key={`${label}-${i}`}
              title={`${label}: ${v}`}
              style={{
                flex: 1,
                height: `${Math.max(pct, 4)}%`,
                minWidth: '8px',
                borderRadius: '6px 6px 2px 2px',
                background: color,
                opacity: 0.85,
                transition: 'height 0.25s ease-out',
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '6px', width: '100%', marginTop: '6px' }}>
        {labels.map((label, i) => (
          <span
            key={`${label}-l-${i}`}
            style={{ flex: 1, textAlign: 'center', fontSize: '0.6875rem', color: 'var(--color-ink-tertiary)' }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [charts, setCharts] = useState([]);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d'); // 7d | 30d | 90d

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, demo: isDemo } = await adminData.getAnalytics(timeRange);
        if (cancelled) return;
        setCharts(Array.isArray(data) ? data : []);
        setDemo(Boolean(isDemo));
      } catch {
        if (!cancelled) {
          setLoadError('Could not load analytics. Showing demo data instead.');
          setCharts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [timeRange]);

  if (loading) {
    return (
      <Layout>
        <main>
          <h1>Admin Analytics</h1>
          <div className="empty-state" role="status" aria-live="polite">
            <p>Loading analytics data…</p>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <main>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1>Platform Analytics</h1>
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
        <p>Insights into member engagement, growth, and platform usage.</p>

        <div className="settings-list" style={{ marginBottom: '24px' }}>
          <div className="toggle-row">
            <span>Time Range:</span>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} aria-label="Analytics time range">
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {loadError && (
          <p className="empty-state" role="alert" style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>
            {loadError}
          </p>
        )}

        {charts.length === 0 ? (
          <div className="empty-state">
            <p>No analytics data available.</p>
            <p style={{ marginTop: '4px' }}>Charts will appear once engagement data is collected.</p>
          </div>
        ) : (
          <div className="section">
            <div className="admin-grid">
              {charts.map(({ key, title, labels, values, color }) => (
                <div key={key} className="admin-card">
                  <h3>{ANALYTICS_TITLES[key] ?? title ?? key}</h3>
                  <MiniBarChart labels={labels} values={values} color={color} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
