const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const root = 'C:/Users/Mitchell/Downloads/migration';
const base = 'http://localhost:5173';
const out = 'C:/Users/Mitchell/AppData/Local/Temp/member-audit/interest-click.json';
const steps = [];
(async () => {
  const seed = JSON.parse(execFileSync(process.execPath, [`${root}/scripts/seed-test-data.mjs`], { cwd: root, encoding: 'utf8' }));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(`${base}/auth/login`);
    await page.evaluate(users => localStorage.setItem('sh_users', JSON.stringify(users)), seed.sh_users);
    await page.locator('#email').fill('aaliyah@example.com');
    await page.locator('#password').fill('Test1234!');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForURL('**/dashboard');
    await page.goto(`${base}/profiles/p2`);
    await page.getByRole('heading', { name: 'Yusuf K., 31', exact: true }).waitFor();
    await page.waitForTimeout(800); // let entrance animations settle

    // Hypothesis probe: what element actually receives a click at the CTA's center?
    const probe = () => page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Send interest' || b.textContent.trim() === 'Interest sent');
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { label: btn.textContent.trim(), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, hitTag: hit?.tagName ?? null, hitClass: String(hit?.className ?? '').slice(0, 60), hitText: String(hit?.textContent ?? '').slice(0, 30), coveredByHeader: !!hit?.closest('header'), scrollY: Math.round(window.scrollY), accountMenuOpen: !!document.querySelector('.account-menu') };
    });
    const initial = await probe();
    steps.push({ step: 'initial probe', ...initial });

    let defaultClick = 'ok';
    try { await page.getByRole('button', { name: 'Send interest', exact: true }).click({ timeout: 3000 }); }
    catch (e) { defaultClick = 'intercepted: ' + e.message.split('\n')[0]; }
    steps.push({ step: 'default-position click attempt', defaultClick, afterProbe: await probe() });

    // Retry only if the initial click did not apply the interest.
    let scrolledClick = 'not needed: initial click succeeded';
    if (!await page.getByRole('button', { name: 'Interest sent', exact: true }).isVisible()) {
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Send interest');
        if (btn) window.scrollTo({ top: btn.getBoundingClientRect().top + window.scrollY - 150, behavior: 'instant' });
      });
      await page.waitForTimeout(400);
      try {
        await page.getByRole('button', { name: 'Send interest', exact: true }).click({ timeout: 5000 });
        scrolledClick = 'ok';
      } catch (e) { scrolledClick = 'failed: ' + e.message.split('\n')[0]; }
    }
    const interestApplied = await page.getByRole('button', { name: 'Interest sent', exact: true }).isVisible().catch(() => false);
    steps.push({ step: 'click after scrolling clear of header', scrolledClick, interestApplied, probe: await probe() });
    if (!interestApplied) throw new Error('Send interest never applied even after scrolling: ' + JSON.stringify(steps));

    await page.reload();
    await page.getByRole('heading', { name: 'Yusuf K., 31', exact: true }).waitFor();
    await page.waitForTimeout(600);
    const resetsAfterReload = await page.getByRole('button', { name: 'Send interest', exact: true }).isVisible().catch(() => false);
    steps.push({ step: 'reload', resetsAfterReload });

    // Does the adjacent Message button do anything at all?
    await page.getByRole('button', { name: 'Message', exact: true }).click();
    await page.waitForTimeout(700);
    steps.push({ step: 'Message button', urlAfter: page.url() });

    steps.push({ errors });
    fs.writeFileSync(out, JSON.stringify(steps, null, 2));
    console.log(JSON.stringify(steps, null, 2));
  } catch (e) {
    steps.push({ fatal: e.message });
    fs.writeFileSync(out, JSON.stringify(steps, null, 2));
    throw e;
  } finally { await browser.close(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
