// scripts/verify-input-icon-alignment.cjs
// ─── Regression guard: input adornments must never overlap the text area ─────
// `.input` is an unlayered component rule and `input.input` (0,1,1) beats
// Tailwind utilities, which ship inside `@layer utilities`. So pl-11 / pl-10 /
// pl-8 / pr-4 written in JSX never applied to `.input` fields and the
// absolutely-positioned icons covered the placeholder and the typed value.
// The fix is the .input-with-icon / .input-with-prefix / .input-with-action
// component classes in src/styles/globals.css.
//
// This script measures every `.input` that has an absolutely-positioned
// sibling (leading icon, "/" prefix, show-password toggle, clear button) and
// asserts a visible gap between the adornment edge and the input's content box.
//
// Run with the dev server up, e.g.:
//   npx vite --port 5199 --strictPort
//   $env:BASE_URL='http://localhost:5199'; node scripts/verify-input-icon-alignment.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = 'C:/Users/Mitchell/Downloads/migration';
const out = 'C:/Users/Mitchell/AppData/Local/Temp/member-audit';
const base = process.env.BASE_URL ?? 'http://localhost:5173';
const MIN_GAP = 4; // px required between an adornment edge and the text content box

// Executed inside the page: geometry of every `.input` + its absolute siblings.
const MEASURE = () => {
  const describe = el => el.id
    || el.getAttribute('aria-label')
    || el.getAttribute('placeholder')
    || el.className;
  const rows = [];
  for (const el of document.querySelectorAll('.input')) {
    const wrap = el.parentElement;
    if (!wrap) continue;
    const box = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const contentLeft = box.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft);
    const contentRight = box.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight);
    for (const kid of wrap.children) {
      if (kid === el) continue;
      if (getComputedStyle(kid).position !== 'absolute') continue;
      const kb = kid.getBoundingClientRect();
      if (!kb.width || !kb.height) continue;
      const leading = (kb.left - box.left) < box.width / 2;
      rows.push({
        field: describe(el),
        side: leading ? 'leading' : 'trailing',
        gap: Math.round((leading ? contentLeft - kb.right : kb.left - contentRight) * 10) / 10,
        paddingLeft: cs.paddingLeft,
        paddingRight: cs.paddingRight,
        className: el.className,
      });
    }
  }
  return rows;
};

(async () => {
  const seed = JSON.parse(execFileSync(process.execPath, [`${root}/scripts/seed-test-data.mjs`], { cwd: root, encoding: 'utf8' }));
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const checked = [];
  const findings = [];

  async function audit(label, screenshot) {
    const rows = await page.evaluate(MEASURE);
    for (const row of rows) {
      checked.push({ page: label, ...row });
      if (row.gap < MIN_GAP) findings.push({ page: label, ...row });
    }
    if (screenshot) await page.screenshot({ path: path.join(out, screenshot) });
    const failed = findings.some(f => f.page === label);
    console.log(`${failed ? 'FAIL' : 'PASS'}: ${label} — ${rows.length} adornment(s): ${rows.map(r => `${r.side} ${r.field} gap ${r.gap}px`).join(' | ')}`);
    return rows;
  }

  try {
    // Proof of the original root cause: a Tailwind padding utility cannot move
    // an .input field's padding, because that layer loses to the component rule.
    await page.goto(`${base}/auth/login`);
    await page.locator('#email').waitFor();
    const probe = await page.evaluate(() => {
      const el = document.createElement('input');
      el.className = 'input pl-11';
      el.style.width = '200px';
      document.body.appendChild(el);
      const measured = getComputedStyle(el).paddingLeft;
      el.remove();
      return measured;
    });
    assert.equal(probe, '14px', `expected Tailwind pl-11 to be ineffectual on .input (got ${probe})`);
    console.log(`INFO: Tailwind "pl-11" computes to ${probe} padding-left on .input — utilities lose to the unlayered component rule (root cause)`);

    await audit('login', 'input-icons-login.png');

    await page.goto(`${base}/auth/register`);
    await page.locator('#displayName').waitFor();
    await audit('register', 'input-icons-register.png');

    await page.goto(`${base}/auth/login`);
    await page.locator('#email').waitFor();
    await page.evaluate(users => localStorage.setItem('sh_users', JSON.stringify(users)), seed.sh_users);
    await page.locator('#email').fill('aaliyah@example.com');
    await page.locator('input[type=password]').fill('Test1234!');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForURL('**/dashboard');

    await page.goto(`${base}/messages`);
    await page.getByRole('heading', { name: 'Messages' }).waitFor();
    await audit('messages', 'input-icons-messages.png');

    await page.goto(`${base}/profiles`);
    await page.locator('input[aria-label="Search profiles"]').waitFor();
    await audit('profiles', 'input-icons-profiles.png');

    await page.goto(`${base}/community`);
    await page.getByRole('heading', { name: 'Community' }).waitFor();
    await audit('community', 'input-icons-community.png');

    // Community also renders a "/" slug prefix inside the create-community dialog.
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.locator('input[placeholder="e.g. hyderabad, dubai, london"]').waitFor();
    await audit('community-create-dialog', 'input-icons-community-dialog.png');

    assert.deepEqual(findings, [], `adornments overlap the text area:\n${JSON.stringify(findings, null, 2)}`);
    assert.equal(checked.length >= 12, true, `expected at least 12 adorned inputs, measured ${checked.length}`);
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'input-icon-alignment.json'), JSON.stringify(checked, null, 2));
    console.log(`PASS: ${checked.length} adorned inputs across 6 surfaces keep a >=${MIN_GAP}px gap (report: ${path.join(out, 'input-icon-alignment.json')})`);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });

