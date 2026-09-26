// ─── API smoke test — run after every deploy: node scripts/smoke-api.mjs ────
// Usage: node scripts/smoke-api.mjs [http://localhost:8080]
// Verifies the things that silently break on shared hosting: the process is up,
// the DB status is reported honestly, security headers exist, per-account login
// rate limiting actually fires, and errors carry a request id.
const BASE = process.argv[2] || process.env.SMOKE_BASE || 'http://localhost:8080';
let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

const j = async (path, opts = {}) => {
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON */ }
  return { res, body };
};

const main = async () => {
  // 1. Process up + honest DB reporting (503 + db:'down' is a PASS without a DB)
  const h = await j('/api/health');
  check('health responds', !!h.res, `${h.res?.status} ${JSON.stringify(h.body)}`);
  check('health reports db state explicitly', h.body && (h.body.db === 'up' || h.body.db === 'down'), h.body?.db);

  // 2. Security headers on a real API response
  const s = Object.fromEntries([...(h.res?.headers || [])].map(([k, v]) => [k.toLowerCase(), v]));
  check('X-Content-Type-Options: nosniff', s['x-content-type-options'] === 'nosniff', s['x-content-type-options']);
  check('X-Frame-Options: DENY', s['x-frame-options'] === 'DENY', s['x-frame-options']);
  check('Referrer-Policy set', !!s['referrer-policy'], s['referrer-policy']);
  check('Cache-Control: no-store (member data never cached)', s['cache-control'] === 'no-store', s['cache-control']);
  check('X-Request-Id present', !!s['x-request-id'], s['x-request-id']);

  // 3. 404 shape
  const nf = await j('/api/definitely-not-a-route');
  check('unknown API route → JSON 404', nf.res?.status === 404 && nf.body?.error === 'Not found', JSON.stringify(nf.body));

  // 4. Per-account login rate limit: 7 attempts on the SAME account → 429 by #7
  //    (this is exactly what credential stuffing on one victim looks like)
  const acct = `smoke-victim-${Math.random().toString(36).slice(2, 8)}@test.com`;
  const codes = [];
  let retryAfter = null, err429 = null;
  for (let i = 0; i < 7; i++) {
    const res = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: acct, password: 'x'.repeat(12) }) });
    codes.push(res.status);
    if (res.status === 429 && retryAfter === null) {
      retryAfter = res.headers.get('retry-after');
      try { err429 = (await res.json())?.error; } catch { /* non-JSON */ }
    }
  }
  check('login rate limit fires (429 within 7 same-account attempts)', codes.includes(429), `sequence: ${codes.join(', ')}`);
  check('429 carries Retry-After header', retryAfter !== null && !Number.isNaN(Number(retryAfter)), `Retry-After: ${retryAfter}s`);
  check('429 body is a human error message', typeof err429 === 'string' && err429.length > 0, err429);

  // 5. Malformed JSON → 400, not 500
  const res = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops' });
  check('malformed JSON → 400 (not a 500)', res.status === 400, String(res.status));

  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
};

main().catch((e) => { console.error('smoke test crashed:', e); process.exit(1); });

