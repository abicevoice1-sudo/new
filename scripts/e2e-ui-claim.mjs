// ─── UI e2e — real browser against dev API: introductions end to end ─────────
// Prerequisites — read these before editing:
//   1. The dev API server (server/index.js) MUST be running on :8080 with
//      ADMIN_EMAILS set so registration produces an admin token. The simplest
//      fixed contract: ADMIN_EMAILS="admin@shiarishta.com"  (kept in .env.example
//      and in the `e2e-ui` npm script that spawns the server for you).
//   2. The Vite dev server (npm run dev) MUST be running on :5173 with
//      VITE_API_URL=http://localhost:8080 so all api.* calls land on the live
//      backend instead of the localStorage demo.
//   3. Chromium must be installed: npx playwright install chromium
//
// This test uses a FIXED admin email so it matches a known ADMIN_EMAILS value.
// If you need a different admin address, update ADMIN_EMAILS + the constant below.
import { chromium } from 'playwright';

const API = process.env.E2E_API_URL || 'http://localhost:8080';
// Default Vite dev port is 5173 (see vite.config.js). Override with E2E_APP_URL.
const APP = process.env.E2E_APP_URL || 'http://localhost:5173';
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`); ok ? pass++ : fail++; };
const api = async (method, route, { token, body } = {}) => {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  return { status: res.status, data };
};

const stamp = Date.now().toString(36);
// Fixed admin — must appear in ADMIN_EMAILS on the dev server.
const adminEmail = 'admin@shiarishta.com';
const mmEmail = `ui-mm-${stamp}@example.com`;
const herEmail = `ui-her-${stamp}@example.com`;
const PW = 'UiSecret123';

const run = async () => {
  // 1. admin + matchmaker, role grant
  // If the admin email already exists (re-run), register returns 409.
  // In that case log in to recover the token.
  let admin = await api('POST', '/api/auth/register', { body: { email: adminEmail, password: PW, displayName: 'UI Admin' } });
  if (admin.status === 409 || admin.status === 400) {
    admin = await api('POST', '/api/auth/login', { body: { email: adminEmail, password: PW } });
  }
  check('admin registered / logged in', admin.status === 200 && admin.data.user.isAdmin === true, admin.data?.user?.isAdmin ? 'isAdmin=true' : 'isAdmin missing');
  const mm = await api('POST', '/api/auth/register', { body: { email: mmEmail, password: PW, displayName: 'Fatima UI' } });
  check('matchmaker registered', mm.status === 201);
  const role = await api('POST', `/api/admin/users/${mm.data.user.uid}/role`, { token: admin.data.token, body: { role: 'matchmaker' } });
  check('admin granted matchmaker role', role.status === 200 || role.status === 201, `${role.status}`);

  // 2. draft created via API (the UI for this is tested in step 4)
  const draft = await api('POST', '/api/drafts', {
    token: mm.data.token,
    body: {
      gender: 'female', displayName: 'Zoya UI', age: 25, city: 'Hyderabad', country: 'India',
      sect: 'Ithna Ashari', profession: 'Doctor',
      bio: 'About me: calm, practising, family-first.',
      expectations: 'About expectations: kind, educated, deen-centred.',
      contactEmail: herEmail, consentAttested: true,
    },
  });
  check('draft created with share link', draft.status === 201 && !!draft.data.shareUrl);
  const token = draft.data.shareUrl.split('/claim/')[1];

  // 3. the browser flow — her side
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(`${APP}/claim/${token}`, { waitUntil: 'networkidle' });
  const bodyText = await page.textContent('body');
  check('claim page shows the invitation', bodyText.includes('A profile is waiting for you') && bodyText.includes('Zoya UI'), 'preview rendered');
  check('claim page shows who introduced her', bodyText.includes('Fatima UI') && bodyText.includes('matchmaker'));
  check('claim page hides her full email', !bodyText.includes(herEmail), 'masked only');

  await page.click('text=This is me — make it mine');
  await page.fill('#cl-email', herEmail);
  await page.fill('#cl-name', 'Zoya Claimed UI');
  await page.fill('#cl-pass', PW);
  await page.click('button:has-text("Claim this profile")');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  check('claim signs her in and lands on dashboard', page.url().includes('/dashboard'), page.url());

  // 4. matchmaker's dashboard
  const mm2 = await browser.newPage();
  await mm2.goto(`${APP}/auth/login`, { waitUntil: 'networkidle' });
  await mm2.fill('input[type="email"]', mmEmail);
  await mm2.fill('input[type="password"]', PW);
  await mm2.click('button[type="submit"]');
  await mm2.waitForURL('**/dashboard', { timeout: 15000 });
  await mm2.goto(`${APP}/drafts`, { waitUntil: 'networkidle' });
  const mmText = await mm2.textContent('body');
  check('drafts dashboard renders for matchmaker', mmText.includes('New introduction draft') && mmText.includes('Your open invitations'), 'form + quota visible');
  check('matchmaker scope is women-only in UI', mmText.includes('Matchmaker · women only'), 'scope pill');
  check('her claimed draft shows as claimed', mmText.includes('Zoya UI') && mmText.includes('Claimed by her'), 'receipt row');
  check('female-only select enforced in UI', await mm2.locator('select').first().isDisabled(), 'gender select locked');

  check('no page errors on either page', errors.length === 0, errors.slice(0, 2).join(' | '));
  await browser.close();
};

run()
  .catch((e) => { console.error('UI E2E CRASHED:', e.message); fail++; })
  .finally(() => { console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail === 0 ? 0 : 1; });
