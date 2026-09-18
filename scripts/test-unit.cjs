// Unit tests: analytics queue + profile completeness scoring.
// Pure Node — no browser, no server, no network.
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const root = path.join(__dirname, '..');
const tmp = path.join(os.tmpdir(), 'sh-unit-imports');
fs.mkdirSync(tmp, { recursive: true });
// Copy ESM sources to .mjs so Node can import them from a CJS test.
for (const [src, out] of [
  ['src/lib/analytics.js', 'analytics.mjs'],
  ['src/lib/onboardingData.js', 'onboardingData.mjs'],
]) {
  fs.copyFileSync(path.join(root, src), path.join(tmp, out));
}

const results = [];
const pass = (name) => { results.push(name); console.log('PASS:', name); };

(async () => {
  const { createAnalytics } = await import('file:///' + path.join(tmp, 'analytics.mjs').replace(/\\/g, '/'));
  const { computeProfileCompleteness } = await import('file:///' + path.join(tmp, 'onboardingData.mjs').replace(/\\/g, '/'));

  // ── In-memory storage stand-in (no DOM required) ──────────────────────────
  const memoryStorage = () => {
    const map = new Map();
    return {
      getItem: k => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: k => map.delete(k),
    };
  };

  // 1. Records, counts, exports, clears.
  const a = createAnalytics(memoryStorage());
  assert.equal(a.count(), 0);
  a.track('profile_viewed', { id: 'p1' });
  a.track('interest_sent', { id: 'p1' });
  a.track('profile_viewed', { id: 'p2' });
  assert.equal(a.count(), 3);
  assert.equal(a.count('profile_viewed'), 2);
  const events = a.getEvents();
  assert.equal(events[0].event, 'profile_viewed');
  assert.ok(events[0].ts);
  assert.equal(events[1].props.id, 'p1');
  assert.equal(JSON.parse(a.exportJson()).length, 3);
  a.clear();
  assert.equal(a.count(), 0);
  pass('analytics records, counts, exports, clears');

  // 2. Queue caps at MAX_EVENTS (500), keeping the newest.
  const b = createAnalytics(memoryStorage());
  for (let i = 0; i < 600; i++) b.track('filler', { i });
  const kept = b.getEvents();
  assert.equal(kept.length, 500);
  assert.equal(kept[0].props.i, 100); // oldest 100 dropped
  assert.equal(kept[499].props.i, 599);
  pass('analytics queue caps at 500 keeping newest');

  // 3. Garbage input rejected; corrupted storage tolerated; failures silent.
  const c = createAnalytics(memoryStorage());
  assert.equal(c.track(''), null);
  assert.equal(c.track(null), null);
  // Permanently-corrupt reads: every getItem returns invalid JSON.
  const broken = { getItem: () => 'not json', setItem: () => {}, removeItem: () => {} };
  const d = createAnalytics(broken);
  assert.equal(d.count(), 0);           // corrupted queue tolerated
  assert.doesNotThrow(() => d.track('still_works')); // never throws
  assert.equal(d.count(), 0);           // reads stay corrupt; writes are best-effort
  pass('analytics tolerates bad input and corrupted storage without throwing');

  // 4. Completeness scoring is ordered, bounded, and numeric.
  const empty = computeProfileCompleteness({});
  const full = computeProfileCompleteness({
    displayName: 'Aaliyah', bio: 'Salam', city: 'Chicago', country: 'US',
    sect: 'shia', religiosity: 'devout', prayer: 'five', education: 'masters',
    maritalStatus: 'never', children: 'none', intentions: 'marriage',
  });
  assert.equal(typeof empty, 'number');
  assert.ok(empty < full, `empty (${empty}) should score below filled (${full})`);
  assert.ok(full > 0 && full <= 100);
  pass(`completeness scoring: empty=${empty}, filled=${full}`);

  fs.mkdirSync('C:/Users/Mitchell/AppData/Local/Temp/member-audit', { recursive: true });
  fs.writeFileSync('C:/Users/Mitchell/AppData/Local/Temp/member-audit/unit-tests.json',
    JSON.stringify({ passed: results, ts: new Date().toISOString() }, null, 2));
  console.log(`ALL PASS: ${results.length} unit checks`);
})().catch(e => { console.error(e); process.exitCode = 1; });

