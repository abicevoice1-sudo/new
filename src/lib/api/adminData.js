// ─── Admin data layer — deterministic, shape-validated, demo-backed ──────────
// The admin pages previously fetched `/api/admin/*` directly. No API server is
// wired in this build, so those fetches returned Vite's index.html fallback
// (HTTP 200, text/html) which was parsed into `{ error: "<html>" }` and then
// rendered as data — crashing `.map()` calls and printing an "error" card.
//
// This module gives every admin surface a stable, typed data source that
// follows the same async-repository contract as `repository.js`. When a real
// HTTP adapter lands, these getters become `fetch` calls and zero call sites
// change. Every getter returns `{ data, demo }` so pages can badge demo data.

const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));

// ── Admin messages ───────────────────────────────────────────────────────────
const DEMO_MESSAGES = [
  {
    id: 'am-1',
    sender: 'System',
    recipient: 'Admin',
    subject: 'Platform Update',
    message: 'The platform has been updated to v2.1.0 with improved matching algorithms.',
    timestamp: '2026-08-24T09:00:00Z',
    read: true,
  },
  {
    id: 'am-2',
    sender: 'Support Team',
    recipient: 'Admin',
    subject: 'User Feedback',
    message: 'Several members have requested in-platform video chaperoned calls.',
    timestamp: '2026-08-23T16:30:00Z',
    read: false,
  },
  {
    id: 'am-3',
    sender: 'Fatima N.',
    recipient: 'Admin',
    subject: 'Account Issue',
    message: "I'm unable to upload my profile photo. It keeps returning an error.",
    timestamp: '2026-08-23T14:15:00Z',
    read: false,
  },
];

// ── Guardian assignments ─────────────────────────────────────────────────────
const DEMO_GUARDIANS = [
  {
    id: 'ag-1',
    guardianName: 'Ahmed Hassan',
    memberName: 'Fatima N.',
    relationship: 'Father',
    status: 'approved',
    permissions: ['profileView', 'messageView', 'contactApproval'],
    assignedSince: '2026-06-15',
  },
  {
    id: 'ag-2',
    guardianName: 'Maryam S.',
    memberName: 'Yusuf K.',
    relationship: 'Sister',
    status: 'pending',
    permissions: ['profileView'],
    assignedSince: '2026-08-20',
  },
  {
    id: 'ag-3',
    guardianName: 'Khalid Ali',
    memberName: 'Zainab H.',
    relationship: 'Uncle',
    status: 'approved',
    permissions: ['profileView', 'messageView'],
    assignedSince: '2026-07-01',
  },
];

// ── Analytics — one deterministic dataset per time range ─────────────────────
const DEMO_ANALYTICS = {
  '7d': {
    memberGrowth: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ label: 'New members', data: [4, 7, 5, 9, 6, 11, 8] }],
    },
    messageVolume: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ label: 'Messages sent', data: [120, 135, 110, 142, 158, 98, 76] }],
    },
    matchSuccessRate: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ label: 'Intros accepted %', data: [68, 72, 65, 78, 82, 75, 80] }],
    },
  },
  '30d': {
    memberGrowth: {
      labels: ['W1', 'W2', 'W3', 'W4'],
      datasets: [{ label: 'New members', data: [34, 41, 38, 52] }],
    },
    messageVolume: {
      labels: ['W1', 'W2', 'W3', 'W4'],
      datasets: [{ label: 'Messages sent', data: [820, 905, 861, 1042] }],
    },
    matchSuccessRate: {
      labels: ['W1', 'W2', 'W3', 'W4'],
      datasets: [{ label: 'Intros accepted %', data: [66, 71, 74, 79] }],
    },
  },
  '90d': {
    memberGrowth: {
      labels: ['Jun', 'Jul', 'Aug'],
      datasets: [{ label: 'New members', data: [128, 149, 171] }],
    },
    messageVolume: {
      labels: ['Jun', 'Jul', 'Aug'],
      datasets: [{ label: 'Messages sent', data: [3120, 3480, 4021] }],
    },
    matchSuccessRate: {
      labels: ['Jun', 'Jul', 'Aug'],
      datasets: [{ label: 'Intros accepted %', data: [61, 70, 77] }],
    },
  },
};

const SERIES_COLORS = {
  memberGrowth: 'var(--color-primary)',
  messageVolume: 'var(--color-accent)',
  matchSuccessRate: 'var(--color-warning)',
};

/** Whitelisted chart keys + array/number validation — never render raw API keys. */
function normalizeAnalytics(raw, range) {
  const source = raw && typeof raw === 'object' ? raw : null;
  const base = DEMO_ANALYTICS[range] ?? DEMO_ANALYTICS['7d'];
  const charts = [];
  for (const key of Object.keys(base)) {
    const src = source?.[key] ?? base[key];
    const labels = Array.isArray(src?.labels) ? src.labels : [];
    const values = Array.isArray(src?.datasets?.[0]?.data)
      ? src.datasets[0].data.filter((n) => typeof n === 'number' && Number.isFinite(n))
      : [];
    if (labels.length && values.length) {
      charts.push({ key, title: ANALYTICS_TITLES[key] ?? key, labels, values, color: SERIES_COLORS[key] });
    }
  }
  return charts;
}

export const ANALYTICS_TITLES = {
  memberGrowth: 'Member Growth',
  messageVolume: 'Message Volume',
  matchSuccessRate: 'Match Success Rate',
};

export const adminData = {
  /** @returns {Promise<{ data: Array, demo: boolean }>} */
  async getMessages() {
    await wait();
    return { data: DEMO_MESSAGES, demo: true };
  },
  /** @returns {Promise<{ data: Array, demo: boolean }>} */
  async getGuardians() {
    await wait();
    return { data: DEMO_GUARDIANS, demo: true };
  },
  /** @returns {Promise<{ data: Array<{key,title,labels,values,color}>, demo: boolean }>} */
  async getAnalytics(range = '7d') {
    await wait();
    return { data: normalizeAnalytics(null, range), demo: true };
  },
};

export default adminData;
