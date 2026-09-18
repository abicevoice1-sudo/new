// Mobile readiness audit: touch targets, horizontal overflow, and viewport
// rendering on key routes at 390x844. Writes evidence JSON; non-zero exit on
// hard failures (overflow). Touch-target warnings are reported, not fatal.
const fs = require('node:fs');
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');

const root = 'C:/Users/Mitchell/Downloads/migration';
const out = 'C:/Users/Mitchell/AppData/Local/Temp/member-audit';
const base = 'http://localhost:5173';
const MIN_TARGET = 44; // px — WCAG 2.5.8 / platform convention

const ROUTES = ['/', '/profiles', '/dashboard', '/messages', '/guardians', '/pricing', '/contact'];

(async () => {
  const seed = JSON.parse(execFileSync(process.execPath, [`${root}/scripts/seed-test-data.mjs`], { cwd: root, encoding: 'utf8' }));
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; moto g power) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  // Login once so member routes render their real state.
  await page.goto(`${base}/auth/login`);
  await page.evaluate(users => localStorage.setItem('sh_users', JSON.stringify(users)), seed.sh_users);
  await page.reload();
  await page.locator('#email').fill('aaliyah@example.com');
  await page.locator('input[type=password]').fill('Test1234!');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL('**/dashboard');

  const report = [];
  let overflowFailures = 0;
  for (const route of ROUTES) {
    await page.goto(base + route);
    await page.waitForTimeout(600);
    const doc = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    const hasOverflow = doc.scrollW > doc.clientW + 1;

    // Touch-target audit: visible buttons/links in the main content area.
    const smallTargets = await page.evaluate((min) => {
      const bad = [];
      const els = [...document.querySelectorAll('main a, main button')];
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.width < min || r.height < min) {
          bad.push({
            tag: el.tagName.toLowerCase(),
            text: (el.innerText || el.getAttribute('aria-label') || '').slice(0, 40),
            w: Math.round(r.width), h: Math.round(r.height),
          });
        }
      }
      return bad.slice(0, 8);
    }, MIN_TARGET);

    report.push({ route, hasOverflow, scrollW: doc.scrollW, clientW: doc.clientW, smallTargets });
    if (hasOverflow) overflowFailures++;
    console.log(`${hasOverflow ? 'FAIL' : 'PASS'} ${route} — scrollW=${doc.scrollW} clientW=${doc.clientW}, small targets: ${smallTargets.length}`);
    for (const t of smallTargets) console.log(`   small: <${t.tag}> ${t.w}x${t.h} "${t.text}"`);
  }

  fs.writeFileSync(`${out}/mobile-audit.json`, JSON.stringify({ report, errors }, null, 2));
  if (errors.length) { console.error('Page errors:', errors); process.exitCode = 1; }
  if (overflowFailures > 0) { console.error(`FAIL: ${overflowFailures} route(s) with horizontal overflow`); process.exitCode = 1; }
  else console.log('MOBILE AUDIT PASS: no horizontal overflow on sampled routes');
  await browser.close();
})().catch(e => { console.error(e); process.exitCode = 1; });
