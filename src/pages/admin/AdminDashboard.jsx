import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, MessageCircle, Heart, ShieldCheck, Activity,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import Layout from '@/layouts/MainLayout';

const MOCK_STATS = {
  totalMembers: 1247, activeToday: 89, newMembersWeek: 34,
  messagesToday: 156, matchesThisWeek: 23, pendingVerifications: 12,
  profileCompletenessAvg: 78, responseRate: 64
};

const MOCK_ACTIVITY = [
  { id: 1, type: 'member_joined', description: 'Fatima N. completed her profile and joined', timestamp: '2026-09-04T10:30:00Z' },
  { id: 2, type: 'message_sent', description: '156 messages exchanged in the last hour', timestamp: '2026-09-04T09:45:00Z' },
  { id: 3, type: 'verification_completed', description: 'Yusuf K. passed identity verification', timestamp: '2026-09-04T08:15:00Z' },
  { id: 4, type: 'match_made', description: 'New compatibility match: Maryam S. & Hassan M.', timestamp: '2026-09-04T07:20:00Z' },
  { id: 5, type: 'guardian_invite', description: 'Wali invite sent to guardian of Zainab A.', timestamp: '2026-09-04T06:50:00Z' },
  { id: 6, type: 'profile_flagged', description: 'Profile flagged for review — incomplete photos', timestamp: '2026-09-04T06:10:00Z' }
];

const MOCK_DAILY = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - 29 + i);
  return {
    date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    members: Math.floor(30 + Math.random() * 60 + i * 1.5),
    messages: Math.floor(80 + Math.random() * 120 + i * 2),
    matches: Math.floor(5 + Math.random() * 18)
  };
});

const STAT_CONFIG = [
  { key: 'totalMembers', label: 'Total Members', icon: Users, color: 'primary', trend: 12.5 },
  { key: 'activeToday', label: 'Active Today', icon: Activity, color: 'success', trend: 8.3 },
  { key: 'newMembersWeek', label: 'New This Week', icon: UserPlus, color: 'accent', trend: -2.1 },
  { key: 'messagesToday', label: 'Messages Today', icon: MessageCircle, color: 'info', trend: 15.7 },
  { key: 'matchesThisWeek', label: 'Matches This Week', icon: Heart, color: 'danger', trend: 22.0 },
  { key: 'pendingVerifications', label: 'Pending Verifications', icon: ShieldCheck, color: 'warning', trend: -5.0 }
];

const ACTIVITY_META = {
  member_joined: { color: 'success', icon: '+' },
  message_sent: { color: 'primary', icon: '💬' },
  verification_completed: { color: 'info', icon: '✓' },
  match_made: { color: 'danger', icon: '💞' },
  guardian_invite: { color: 'accent', icon: '🛡' },
  profile_flagged: { color: 'warning', icon: '⚠' }
};

const colorMap = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', fill: 'var(--primary)' },
  success: { bg: 'bg-success/10', text: 'text-success', fill: 'var(--success)' },
  accent: { bg: 'bg-accent/10', text: 'text-accent', fill: 'var(--accent)' },
  info: { bg: 'bg-info/10', text: 'text-info', fill: 'var(--info)' },
  danger: { bg: 'bg-danger/10', text: 'text-danger', fill: 'var(--danger)' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', fill: 'var(--warning)' }
};

function Sparkline({ dataKey, data, color = 'primary', height = 80 }) {
  const values = data.map(d => d[dataKey]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 300;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  }).join(' ');
  const linePath = points.split(' ').map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ');
  const c = colorMap[color] || colorMap.primary;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none" aria-hidden="true">
      <path d={`M0,${height} ${points.split(' ').map(p => `L${p}`).join(' ')} L${w},${height} Z`} fill={c.fill} opacity="0.12" />
      <path d={linePath} fill="none" stroke={c.fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ stat, value, index }) {
  const c = colorMap[stat.color] || colorMap.primary;
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        const start = performance.now();
        const animate = (now) => {
          const p = Math.min((now - start) / 800, 1);
          setDisplay(Math.floor((1 - Math.pow(1 - p, 3)) * value));
          if (p < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="bg-elevated rounded-2xl border border-line/20 p-5 hover:border-line/40 hover:-translate-y-0.5 transition-all duration-200 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
          <stat.icon className={`w-5 h-5 ${c.text}`} />
        </span>
        <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${stat.trend >= 0 ? 'text-success' : 'text-danger'}`}>
          {stat.trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {Math.abs(stat.trend)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-ink">{display.toLocaleString()}</p>
      <p className="text-xs text-muted mt-0.5">{stat.label}</p>
    </motion.div>
  );
}

// __CHUNK2__

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const [chartMetric, setChartMetric] = useState('members');
  const stats = MOCK_STATS;
  const activity = MOCK_ACTIVITY;
  const daily = MOCK_DAILY;

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink">Admin Dashboard</h1>
            <p className="text-sm text-muted mt-1">Platform overview, member analytics, and community health.</p>
          </div>
          <div className="flex items-center gap-2">
            {['7d', '30d', '90d'].map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeRange === r ? 'bg-primary text-white' : 'bg-elevated text-muted border border-line/20 hover:border-line/40'}`}>
                {r === '7d' ? '7 days' : r === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {STAT_CONFIG.map((stat, i) => (
            <StatCard key={stat.key} stat={stat} value={stats[stat.key]} index={i} />
          ))}
        </div>

        {/* Main grid: Activity chart + Activity feed */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Activity Chart */}
          <div className="bg-elevated rounded-2xl border border-line/20 shadow-sm p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 className="text-base font-bold text-ink">Platform Activity</h2>
              <div className="flex items-center gap-1 bg-hover rounded-lg p-1">
                {[
                  { key: 'members', label: 'Members' },
                  { key: 'messages', label: 'Messages' },
                  { key: 'matches', label: 'Matches' }
                ].map(m => (
                  <button key={m.key} onClick={() => setChartMetric(m.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${chartMetric === m.key ? 'bg-elevated text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <Sparkline dataKey={chartMetric} data={daily} color={chartMetric === 'members' ? 'primary' : chartMetric === 'messages' ? 'info' : 'danger'} height={120} />
            <div className="flex items-center justify-between mt-3 text-[11px] text-muted">
              <span>{daily[0]?.date}</span>
              <span>{daily[daily.length - 1]?.date}</span>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-line/15">
              <div>
                <p className="text-xs text-muted mb-0.5">Avg. Profile Completeness</p>
                <p className="text-lg font-bold text-ink">{stats.profileCompletenessAvg}%</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-0.5">Response Rate</p>
                <p className="text-lg font-bold text-ink">{stats.responseRate}%</p>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-elevated rounded-2xl border border-line/20 shadow-sm p-6">
            <h2 className="text-base font-bold text-ink mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activity.map(item => {
                const meta = ACTIVITY_META[item.type] || { color: 'primary', icon: '•' };
                const c = colorMap[meta.color] || colorMap.primary;
                const timeAgo = getTimeAgo(item.timestamp);
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-hover/60 transition-colors">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${c.bg}`}>
                      <span className={c.text}>{meta.icon}</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink leading-relaxed">{item.description}</p>
                      <p className="text-[11px] text-faint mt-0.5">{timeAgo}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}

function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
