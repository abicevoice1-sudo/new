import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { pool, migrate } from './db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import profileMutationRoutes from './routes/profileMutations.js';
import messageRoutes from './routes/messages.js';
import communityRoutes from './routes/community.js';
import reportRoutes from './routes/reports.js';
import verificationRoutes from './routes/verifications.js';
import waliRoutes from './routes/wali.js';
import draftRoutes from './routes/drafts.js';
import adminRoutes from './routes/admin.js';
import { authRequired } from './middleware/auth.js';

// ─── Boot-time configuration gate: fail fast, never run with regrets ─────────
// A matrimonial platform holds women's photos and family details. A forgeable
// JWT secret means anyone with this repo can mint an admin token. We refuse to
// start in production with a missing or known-default secret.
const PORT = Number(process.env.PORT || 8080);
const IS_PROD = process.env.NODE_ENV === 'production';
const KNOWN_DEFAULT_SECRETS = new Set([
  'change-me-to-a-long-random-secret',
  'dev-only-secret-change-me',
  'test-secret-for-verification-only-not-production',
]);

function failBoot(msg) {
  console.error('[boot] ' + msg);
  console.error('[boot] refusing to start. Fix the environment and restart.');
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  const hint = "Generate one: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"";
  if (IS_PROD) failBoot('JWT_SECRET is missing or shorter than 32 chars. ' + hint);
  console.warn('[boot] WARN (dev only): JWT_SECRET missing/weak — dev convenience mode. ' + hint);
}
if (IS_PROD && KNOWN_DEFAULT_SECRETS.has(process.env.JWT_SECRET)) {
  failBoot('JWT_SECRET is a known default value from the repo. That is an admin-account-takeover waiting to happen.');
}

const app = express();
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim());

// Behind cPanel/nginx/LiteSpeed every request arrives from the proxy; without
// this, req.ip is the proxy for everyone and per-IP rate limits are meaningless.
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : (IS_PROD ? 1 : 0));
app.disable('x-powered-by');

// ─── Security headers (helmet-equivalent, zero dependencies) ─────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  // Member data must never sit in shared-hosting proxy caches.
  res.setHeader('Cache-Control', 'no-store');
  if (IS_PROD) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
// 2mb: verification photos arrive base64 (1.5MB cap ≈ 2MB base64). The write
// rate limiter is the DoS control here, not the body cap alone.
app.use(express.json({ limit: '2mb' }));

// ─── Request IDs: correlate a member's "it errored" with one log line ────────
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// ─── Fixed-window rate limiter — in-memory, single instance, zero deps ───────
// Good to ~thousands of rps on one cPanel app. At real scale, swap the Map for
// Redis INCR+EXPIRE (one function) — every call site stays identical.
const buckets = new Map();
function rateLimit({ windowMs, max, keyBy, message }) {
  const keyOf = keyBy || ((req) => req.ip);
  return (req, res, next) => {
    const now = Date.now();
    const key = keyOf(req);
    let b = buckets.get(key);
    if (!b || now - b.start >= windowMs) { b = { start: now, count: 0 }; buckets.set(key, b); }
    b.count += 1;
    // Memory guard: periodic sweep keeps this O(active clients), not O(all time).
    if (buckets.size > 10000) {
      for (const [k, v] of buckets) if (now - v.start >= windowMs) buckets.delete(k);
    }
    if (b.count > max) {
      res.setHeader('Retry-After', Math.ceil((windowMs - (now - b.start)) / 1000));
      return res.status(429).json({ error: message || 'Too many requests. Please slow down.' });
    }
    next();
  };
}

// Credential stuffing: attacker loops one account → limit per IP+email.
// Password spraying: attacker loops many accounts → limit per IP overall.
const loginPerAccount = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  keyBy: (req) => `login:acct:${req.ip}:${String(req.body?.email || 'none').toLowerCase().slice(0, 120)}`,
  message: 'Too many attempts for this account. Try again in 15 minutes.',
});
const authPerIp = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  keyBy: (req) => `auth:ip:${req.ip}`,
  message: 'Too many sign-up/sign-in attempts from your network. Try again in 15 minutes.',
});
// Writes only — reads stay generous so browsing never feels throttled.
const writePerIp = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  // E2E test process opts out explicitly; production never sets this.
  if (process.env.E2E_TEST_MODE === '1' && ['::1', '::ffff:127.0.0.1', '127.0.0.1'].includes(req.ip)) return next();

  return rateLimit({
    windowMs: 60 * 1000, max: 30,
    keyBy: (req2) => `write:ip:${req2.ip}`,
    message: 'Slow down a little — the community will still be here in a minute.',
  })(req, res, next);
};
// ─── Routes: same shapes, now with brute-force and spam ceilings ─────────────
// Path-specific limiters mount BEFORE the routers: Express matches in
// registration order, so these run first and always apply (even on the error
// path, when the DB is down and handlers fall through with next(e)).
app.use('/api/auth/login', loginPerAccount);
app.use('/api/auth', authPerIp, authRoutes);
// Password reset endpoints get their own tight ceilings: a mail-bombing or
// token-guessing wave must hit a wall long before it annoys a real member.
app.use('/api/auth/forgot', rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  keyBy: (r) => `forgot:ip:${r.ip}`,
  message: 'Too many reset requests. Check your inbox, or try again in an hour.',
}));
app.use('/api/auth/reset', rateLimit({
  windowMs: 60 * 60 * 1000, max: 10,
  keyBy: (r) => `reset:ip:${r.ip}`,
  message: 'Too many attempts. Try again in an hour.',
}));
app.use('/api/auth/resend-verification', rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  keyBy: (r) => `resend:ip:${r.ip}`,
  message: 'Too many verification requests. Try again in an hour.',
}));
app.use('/api/profiles', profileRoutes);
app.use('/api/profiles', profileMutationRoutes);
app.use('/api/messages', authRequired, writePerIp, messageRoutes);
app.use('/api/community', writePerIp, communityRoutes);
app.use('/api/reports', authRequired, writePerIp, reportRoutes);
app.use('/api/verifications', authRequired, writePerIp, verificationRoutes);
app.use('/api/wali', writePerIp, waliRoutes);
// Introductions get their own ceilings: drafts are precious (one per slot) and
// the claim surface must resist token probing on shared networks.
// NOT mounted behind authRequired: the claim/decline/short-code endpoints are
// intentionally public (the token IS the credential); each protected route in
// routes/drafts.js carries its own authRequired.
app.use('/api/drafts', writePerIp, draftRoutes);
app.use('/api/admin', adminRoutes);

// ─── Health: honest about partial degradation instead of pretending ──────────
let dbState = { up: false, migrated: false, error: null, lastCheck: null };
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    dbState = { up: true, migrated: dbState.migrated, error: null, lastCheck: new Date().toISOString() };
    res.json({ ok: dbState.migrated, db: 'up', migrated: dbState.migrated, time: dbState.lastCheck });
  } catch (e) {
    dbState = { up: false, migrated: dbState.migrated, error: e.code || e.message, lastCheck: new Date().toISOString() };
    res.status(503).json({ ok: false, db: 'down', error: dbState.error, time: dbState.lastCheck });
  }
});

// 404 + error handler (never leak stack to clients; always carry a request id)
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ error: 'Invalid JSON body.', requestId: req.id });
  }
  console.error(`[api] req=${req.id}`, err);
  res.status(err.status || 500).json({
    error: err.expose ? err.message : 'Internal server error',
    requestId: req.id,
  });
});

// ─── Listen FIRST, migrate in the background with retry ──────────────────────
// Old behavior: `await migrate()` before listen — Postgres down at boot meant a
// crashed process and a dead site until a human restarted it (the classic
// cPanel 3am outage). New behavior: the HTTP server comes up immediately,
// reports db:'down' on /api/health, and keeps retrying the schema until the
// database is reachable. Restarts after a DB blip self-heal.
const RETRY_MS = 15000;
async function migrateWithRetry(attempt = 1) {
  try {
    await migrate();
    dbState.migrated = true;
    console.log(`[api] schema ready${attempt > 1 ? ` (after ${attempt - 1} failed attempt${attempt > 2 ? 's' : ''})` : ''}`);
  } catch (e) {
    dbState.migrated = false;
    if (attempt <= 3 || attempt % 4 === 0) {
      console.error(`[api] migration attempt ${attempt} failed: ${e.code || ''} ${e.message}`);
    }
    setTimeout(() => migrateWithRetry(attempt + 1), RETRY_MS).unref();
  }
}
migrateWithRetry();

const server = app.listen(PORT, () => {
  console.log(`[api] listening on :${PORT} (${IS_PROD ? 'production' : 'development'})`);
  if (!IS_PROD && !process.env.JWT_SECRET) console.warn('[api] dev mode without JWT_SECRET — do not expose this instance');
});

// ─── Graceful shutdown: drain connections, close the pool, then exit ─────────
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[api] ${signal} received — draining connections…`);
  server.close(() => {
    pool.end().then(() => {
      console.log('[api] db pool closed — bye');
      process.exit(0);
    }).catch(() => process.exit(0));
  });
  // cPanel/PM2 will SIGKILL eventually; still, never hang past 10s.
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  // Log and stay up: a single bad request must not take the site down.
  console.error('[api] unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  // Node's own guidance: state is untrusted after this — drain and exit.
  console.error('[api] uncaughtException:', err);
  shutdown('uncaughtException');
});
