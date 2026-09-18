// Live verification: analytics events fire from real user actions.
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

const root = 'C:/Users/Mitchell/Downloads/migration';
const out = 'C:/Users/Mitchell/AppData/Local/Temp/member-audit';
const base = 'http://localhost:5173';

(async () => {
  const seed = JSON.parse(execFileSync(process.execPath, [`${root}/scripts/seed-test-data.mjs`], { cwd: root, encoding: 'utf8' }));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${base}/auth/login`);
  await page.evaluate(u => localStorage.setItem('sh_users', JSON.stringify(u)), seed.sh_users);
  await page.reload();
  await page.locator('#email').fill('aaliyah@example.com');
  await page.locator('input[type=password]').fill('Test1234!');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL('**/dashboard');

  // View a profile and send interest
  await page.goto(`${base}/profiles`);
  await page.waitForTimeout(800);
  const firstCard = page.locator('main a[href^="/profiles/"]').first();
  await firstCard.click();
  await page.waitForTimeout(800);
  const btn = page.getByRole('button', { name: 'Send interest', exact: true });
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(300); }

  const events = await page.evaluate(() => JSON.parse(localStorage.getItem('shiarishta_events_v1') || '[]'));
  const names = events.map(e => e.event);
  console.log('EVENTS QUEUED:', names.join(', ') || '(none)');
  const results = {
    profile_viewed: names.includes('profile_viewed'),
    interest_sent: names.includes('interest_sent'),
  };
  console.log(results.profile_viewed ? 'PASS: profile_viewed fired' : 'FAIL: no profile_viewed');
  console.log(results.interest_sent ? 'PASS: interest_sent fired' : 'WARN: no interest_sent (interest may already be marked sent)');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(`${out}/analytics-live.json`, JSON.stringify({ results, events }, null, 2));
  await browser.close();
  if (!results.profile_viewed) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
