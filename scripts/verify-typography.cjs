// scripts/verify-typography.cjs
// ─── One typographic system on every page ───────────────────────────────────
// Body copy must render in the sans face and headings in the display face on
// every route, and no page may pull a family the design system does not use.
// (index.html used to preload Fraunces, which no CSS/JS ever referenced.)
//
// Usage:  npx vite --port 5173 --strictPort
//         node scripts/verify-typography.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = 'C:/Users/Mitchell/Downloads/migration';
const out = 'C:/Users/Mitchell/AppData/Local/Temp/member-audit';
const base = process.env.BASE_URL ?? 'http://localhost:5173';
const SANS = 'Inter';
const DISPLAY = 'Cormorant Garamond';
// Families the design system ships: Inter (UI/body), Cormorant Garamond
// (display headings) and the system mono stack used by the ⌘K hints.
const ALLOWED = [SANS, DISPLAY, 'ui-monospace'];

const PUBLIC_ROUTES = [
  '/', '/profiles', '/blog', '/community', '/contact', '/agents', '/pricing',
  '/privacy', '/terms', '/success-stories', '/about', '/safety', '/support',
  '/guardians', '/auth/login', '/auth/register', '/this-route-does-not-exist',
];
const MEMBER_ROUTES = ['/dashboard', '/messages', '/settings', '/profile'];
const ADMIN_ROUTES = ['/admin/login', '/admin/dashboard', '/admin/messages', '/admin/support', '/admin/guardians', '/admin/analytics'];
// Surfaces worth eyeballing after a typography change (dense pages included).
const SHOT_ROUTES = new Set(['/', '/profiles', '/auth/login', '/dashboard', '/messages', '/settings', '/admin/dashboard', '/admin/support']);

// Runs in the page: which families are concretely used, and on what.
const PROBE = () => {
  const familyOf = sel => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el).fontFamily : null;
  };
  const used = new Set();
  const byTag = {};
  const monoEls = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const hasText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    const fa = getComputedStyle(el).fontFamily;
    used.add(fa);
    const tag = el.tagName.toLowerCase();
    if (!byTag[tag]) byTag[tag] = fa;
    if (/mono/i.test(fa)) {
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
      monoEls.add(`${tag}${cls ? '.' + cls : ''}`);
    }
  }
  const google = performance.getEntriesByType('resource')
    .map(r => r.name)
    .filter(u => u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com'));
  return {
    body: getComputedStyle(document.body).fontFamily,
    h1: familyOf('h1'),
    h2: familyOf('h2'),
    h3: familyOf('h3'),
    used: Array.from(used).sort(),
    byTag,
    monoElements: Array.from(monoEls).sort().slice(0, 12),
    googleFontRequests: google,
  };
};

const primary = stack => String(stack || '').replace(/["']/g, '').split(',')[0].trim();

(async () => {
  const seed = JSON.parse(execFileSync(process.execPath, [`${root}/scripts/seed-test-data.mjs`], { cwd: root, encoding: 'utf8' }));
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const report = [];
  const problems = [];
  const shots = [];

  async function shot(route) {
    if (!SHOT_ROUTES.has(route)) return;
    const file = path.join(out, `typography${route.replace(/\//g, '-')}.png`);
    await page.screenshot({ path: file });
    shots.push(file);
  }

  async function audit(route, sink) {
    const data = await page.evaluate(PROBE);
    const row = { route: sink, ...data };
    report.push(row);
    const stray = data.used.map(primary).filter(f => !ALLOWED.includes(f));
    if (primary(data.body) !== SANS) problems.push({ route: sink, why: `body renders in ${primary(data.body)}`, got: data.body });
    for (const tag of ['h1', 'h2', 'h3']) {
      if (data[tag] && primary(data[tag]) !== DISPLAY) {
        problems.push({ route: sink, why: `<${tag}> renders in ${primary(data[tag])}`, got: data[tag] });
      }
    }
    if (stray.length) problems.push({ route: sink, why: `unexpected families in use: ${stray.join(', ')}` });
    const fraunces = data.googleFontRequests.filter(u => /Fraunces/i.test(u));
    if (fraunces.length) problems.push({ route: sink, why: `preloads an unused family: ${fraunces[0]}` });
    const heads = ['h1', 'h2', 'h3'].map(t => `${t}=${data[t] ? primary(data[t]) : '-'}`).join(' ');
    console.log(`${stray.length || fraunces.length ? 'WARN' : 'ok  '}: ${sink.padEnd(26)} body=${primary(data.body)} ${heads} | families in use: ${data.used.map(primary).join(' + ')}`);
    if (data.monoElements.length) console.log(`      mono elements: ${data.monoElements.join(', ')}`);
    return row;
  }

  try {
    for (const route of PUBLIC_ROUTES) {
      await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(450);
      await audit(route, route);
      await shot(route);
    }

    // Member session: seed the QA users in browser storage, then sign in for real.
    await page.goto(`${base}/auth/login`);
    await page.locator('#email').waitFor();
    await page.evaluate(users => localStorage.setItem('sh_users', JSON.stringify(users)), seed.sh_users);
    await page.locator('#email').fill('aaliyah@example.com');
    await page.locator('input[type=password]').fill('Test1234!');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForURL('**/dashboard');
    for (const route of MEMBER_ROUTES) {
      await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      await audit(route, route);
      await shot(route);
    }
    await page.getByRole('button', { name: /log out|logout/i }).first().click().catch(() => {});

    // Admin session: the seeded admin email carries isAdmin, so the guard opens.
    await page.goto(`${base}/admin/login`);
    await page.locator('#adminEmail, #email').first().waitFor();
    await page.locator('#adminEmail, #email').first().fill('admin@shiarishta.com');
    await page.locator('input[type=password]').fill('Test1234!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForTimeout(1200);
    for (const route of ADMIN_ROUTES) {
      await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(450);
      await audit(route, route);
      await shot(route);
    }

    fs.writeFileSync(path.join(out, 'typography-report.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(out, 'typography-problems.json'), JSON.stringify(problems, null, 2));
    console.log(`\n${report.length} routes audited · ${problems.length} typography problem(s)`);
    console.log(`report: ${path.join(out, 'typography-report.json')}`);
    if (shots.length) console.log(`screenshots: ${shots.join(', ')}`);
    if (problems.length) console.log(`\nProblems:\n${problems.map(p => ` - ${p.route}: ${p.why}`).join('\n')}`);
    assert.deepEqual(errors, [], `page errors: ${JSON.stringify(errors)}`);
    assert.deepEqual(problems, [], 'typography is not uniform across pages (see problems above)');
    console.log('\nPASS: every page uses one body face and one display face');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });

