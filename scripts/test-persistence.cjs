const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const root = 'C:/Users/Mitchell/Downloads/migration';
(async () => {
  const seed = JSON.parse(execFileSync(process.execPath, [`${root}/scripts/seed-test-data.mjs`], { cwd: root, encoding: 'utf8' }));
  const browser = await chromium.launch();
  const evidence = [];
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:5173/auth/login');
    await page.locator('#email').waitFor();
    await page.evaluate(users => localStorage.setItem('sh_users', JSON.stringify(users)), seed.sh_users);
    await page.locator('#email').fill('aaliyah@example.com');
    await page.locator('input[type=password]').fill('Test1234!');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.getByText('Welcome back').waitFor();
    await page.goto('http://localhost:5173/settings');
    await page.getByRole('heading', { name: 'Settings' }).waitFor();
    await page.getByRole('button', { name: 'Privacy & Safety' }).click();
    await page.getByText('Profile Visibility').waitFor();
    await page.locator('select').first().selectOption('private');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await page.getByText('Saved!').waitFor();
    await page.reload();
    await page.getByRole('heading', { name: 'Settings' }).waitFor();
    await page.getByRole('button', { name: 'Privacy & Safety' }).click();
    await page.getByText('Profile Visibility').waitFor();
    const visibility = await page.locator('select').first().inputValue();
    assert.equal(visibility, 'private');
    evidence.push({ check: 'settings-survive-reload', visibility });

    await page.goto('http://localhost:5173/');
    await page.locator('.landing-avatar-btn').click();
    await page.locator('.account-menu').getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.getByRole('button', { name: 'Yes, sign out', exact: true }).click();
    await page.goto('http://localhost:5173/auth/login');
    await page.locator('#email').fill('yusuf@example.com');
    await page.locator('input[type=password]').fill('Test1234!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByText('Welcome back').waitFor();
    await page.goto('http://localhost:5173/settings');
    await page.getByRole('heading', { name: 'Settings' }).waitFor();
    await page.getByRole('button', { name: 'Privacy & Safety' }).click();
    await page.getByText('Profile Visibility').waitFor();
    const otherVisibility = await page.locator('select').first().inputValue();
    assert.notEqual(otherVisibility, 'private');
    evidence.push({ check: 'no-cross-account-contamination', otherVisibility });

    await page.goto('http://localhost:5173/messages');
    await page.getByText('Aaliyah R.').first().click();
    const draft = 'Persistence check ' + Date.now();
    await page.getByPlaceholder('Write a respectful message').fill(draft);
    await page.getByRole('button', { name: 'Send message' }).click();
    await page.getByText(draft).waitFor();
    await page.reload();
    await page.getByText('Aaliyah R.').first().click();
    await page.getByText(draft).waitFor();
    evidence.push({ check: 'message-survives-reload', draft });

    assert.deepEqual(errors, []);
    fs.mkdirSync('C:/Users/Mitchell/AppData/Local/Temp/member-audit', { recursive: true });
    fs.writeFileSync('C:/Users/Mitchell/AppData/Local/Temp/member-audit/persistence.json', JSON.stringify(evidence, null, 2));
    console.log('PASS: settings/message persistence, per-member isolation, no page errors');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
