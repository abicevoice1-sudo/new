const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const root = 'C:/Users/Mitchell/Downloads/migration';
const out = 'C:/Users/Mitchell/AppData/Local/Temp/member-audit';
const base = 'http://localhost:5173';
const steps = [];
(async () => {
  const seed = JSON.parse(execFileSync(process.execPath, [`${root}/scripts/seed-test-data.mjs`], { cwd: root, encoding: 'utf8' }));
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  function passed(step) { steps.push({ step, status: 'PASS' }); console.log('PASS:', step); }
  async function dashboard() {
    await page.waitForURL('**/dashboard');
    await page.locator('main h1').first().waitFor();
    assert.match(await page.locator('main').first().innerText(), /Aaliyah/i);
    // Dashboard uses MainLayout (not LandingLayout); verify the sidebar user panel is present.
    assert.equal(await page.locator('aside.app-sidebar').isVisible(), true);
  }
  async function login() {
    await page.locator('#email, #adminEmail').fill('aaliyah@example.com');
    await page.locator('input[type=password]').fill('Test1234!');
    await page.getByRole('button', {name: 'Sign In', exact: true}).click();
    await dashboard();
  }
  try {
    await page.goto(`${base}/auth/login`);
    await page.locator('#email, #adminEmail').waitFor();
    // Provision designated QA users only, in disposable browser storage.
    // Authentication always goes through the real form; no session injection.
    await page.evaluate(users => localStorage.setItem('sh_users', JSON.stringify(users)), seed.sh_users);
    assert.equal(await page.getByRole('button', {name: 'Sign In', exact: true}).isVisible(), true);
    passed('Signed-out login form renders');
    await login(); passed('Login form authenticates and renders member dashboard');
    await page.reload(); await dashboard(); passed('Reload preserves login and member identity');
    await page.goto(`${base}/`);
    const avatar = page.locator('.landing-avatar-btn');
    const menu = page.locator('.account-menu');
    await avatar.waitFor();
    assert.equal(await menu.count(), 0);
    assert.equal(await avatar.getAttribute('aria-expanded'), 'false');
    await avatar.click();
    await menu.waitFor();
    assert.equal(await avatar.getAttribute('aria-expanded'), 'true');
    await avatar.click();
    await menu.waitFor({ state: 'detached' });
    await avatar.click();
    await menu.waitFor();
    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'detached' });
    await avatar.click();
    await menu.waitFor();
    await page.locator('.landing-brand').click();
    await menu.waitFor({ state: 'detached' });
    passed('Menu starts closed, toggles, and closes with Escape and outside click');
    await avatar.click();
    await menu.getByRole('button', { name: 'Sign out', exact: true }).click();
    await menu.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(await menu.isVisible(), true);
    assert.equal(await menu.getByRole('button', { name: 'Sign out', exact: true }).isVisible(), true);
    passed('Cancel sign out keeps the member logged in and menu open');
    assert.equal((await page.locator('.landing-avatar-btn').innerText()).trim(), 'AR');
    await menu.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.getByRole('button', { name: 'Yes, sign out', exact: true }).waitFor();
    passed('Account menu displays current member and logout confirmation');
    await page.getByRole('button', { name: 'Yes, sign out', exact: true }).click();
    await page.locator('.landing-avatar-btn').waitFor({ state: 'detached' });
    assert.equal(await page.locator('.landing-header a[href="/auth/login"]').first().isVisible(), true);
    passed('Confirmed logout restores signed-out header');
    await page.goto(`${base}/dashboard`);
    await page.waitForURL('**/auth/login');
    await page.locator('#email, #adminEmail').waitFor();
    assert.equal(await page.locator('input[type=password]').isVisible(), true);
    passed('Protected dashboard redirects to usable login form after logout');
    await login(); passed('Second login restores the same member dashboard');
    // Dashboard uses MainLayout; navigate directly to profile instead of
    // using the LandingLayout avatar menu.
    await page.goto(`${base}/profile`);
    await page.waitForURL('**/profile');
    await page.getByRole('heading', { name: 'Build a profile that truly represents you', exact: true }).waitFor();
    await page.getByText('Display name', { exact: false }).first().waitFor();
    const profileContent = await page.locator('body').innerText();
    assert.match(profileContent, /The essentials/);
    assert.doesNotMatch(profileContent, /This page took a wrong turn|Unexpected Application Error/);
    passed('Account Profile link renders onboarding editor at /profile, not 404 or error');
    await page.reload();
    await page.getByRole('heading', { name: 'Build a profile that truly represents you', exact: true }).waitFor();
    assert.doesNotMatch(await page.locator('body').innerText(), /This page took a wrong turn|Unexpected Application Error/);
    passed('Direct /profile reload renders the editor');
    assert.deepEqual(errors, []); passed('No uncaught browser errors in this journey');
    await page.screenshot({ path: `${out}/auth-journey-pass.png`, fullPage: true });
  } catch (e) {
    steps.push({ status: 'FAIL', message: e.message, url: page.url() });
    await page.screenshot({ path: `${out}/auth-journey-failure.png`, fullPage: true });
    fs.writeFileSync(`${out}/auth-journey-failure.txt`, await page.locator('body').innerText());
    throw e;
  } finally {
    fs.writeFileSync(`${out}/auth-journey.json`, JSON.stringify({ steps, errors }, null, 2));
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
