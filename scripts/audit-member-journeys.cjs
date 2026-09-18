const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = 'C:/Users/Mitchell/Downloads/migration';
const out = 'C:/Users/Mitchell/AppData/Local/Temp/member-audit';
fs.mkdirSync(out, { recursive: true });
const seed = JSON.parse(execFileSync(process.execPath, [path.join(root, 'scripts/seed-test-data.mjs')], { encoding: 'utf8', cwd: root }));
const base = 'http://localhost:5173';
const results = { checks: [], pages: [], errors: [], failedRequests: [] };
let browser;
async function check(name, fn) {
  try { results.checks.push({ name, result: await fn() }); }
  catch (e) { results.checks.push({ name, error: e.message }); }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
}
async function go(page, route) {
  await page.goto(base + route, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
}
async function login(page, email, admin = false) {
  await go(page, admin ? '/admin/login' : '/auth/login');
  await page.locator('#email, #adminEmail').fill(email);
  await page.locator('input[type=password]').fill('Test1234!');
  await page.getByRole('button', {name: 'Sign In', exact: true}).click();
  await page.waitForURL(admin ? '**/admin/dashboard' : '**/dashboard');
}
async function logout(page) {
  await go(page, '/');
  await page.locator('.landing-avatar-btn').click();
  await page.locator('.account-menu').getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, sign out', exact: true }).click();
}
(async () => {
 browser = await chromium.launch();
 const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
 const page = await context.newPage();
 page.setDefaultTimeout(6000);
 page.on('pageerror', e => results.errors.push({ url: page.url(), message: e.message }));
 page.on('response', r => { if (r.status() >= 400) results.failedRequests.push({ url: r.url(), status: r.status() }); });
 await go(page, '/');
 // Only designated QA users, in an isolated browser. Never inject sessions.
 await page.evaluate(users => localStorage.setItem('sh_users', JSON.stringify(users)), seed.sh_users);
 await check('Signed-out protected route', async () => { await go(page, '/messages'); return { url: page.url() }; });
 await check('Wrong password', async () => {
   await page.locator('#email, #adminEmail').fill('aaliyah@example.com');
   await page.locator('input[type=password]').fill('Wrong-test-password');
   await page.getByRole('button', {name: 'Sign In', exact: true}).click();
   await page.waitForTimeout(500);
   return { rejected: (await page.locator('body').innerText()).includes('Invalid email or password') };
 });
 await check('Member A actual login and reload persistence', async () => {
   await login(page, 'aaliyah@example.com'); await page.reload();
   await page.waitForTimeout(500); return { url: page.url(), text: (await page.locator('main').first().innerText()).slice(0, 900) };
 });
 const routes = ['/', '/dashboard', '/profiles', '/profiles/p1', '/profiles?view=curated', '/messages', '/settings', '/onboard', '/guardians', '/agents', '/pricing', '/support', '/contact', '/blog', '/community', '/about', '/safety', '/privacy', '/terms', '/success-stories', '/profile', '/register', '/login'];
 for (const route of routes) await check('Route ' + route, async () => {
   await go(page, route);
   const snapshot = await page.evaluate(() => ({
     title: document.title, headings: [...document.querySelectorAll('h1,h2')].map(e => e.textContent),
     text: (document.querySelector('main') || document.body).innerText,
     controls: [...document.querySelectorAll('main button, main input, main select, main textarea')].map(e => ({ tag: e.tagName, name: e.getAttribute('aria-label') || e.textContent?.trim().slice(0, 100), placeholder: e.getAttribute('placeholder'), type: e.type })),
     overflow: document.documentElement.scrollWidth > innerWidth
   }));
   results.pages.push({ route, viewport: 'desktop', ...snapshot });
   if (['/dashboard','/messages','/settings','/profiles/p1'].includes(route)) await page.screenshot({ path: path.join(out, route.replaceAll('/', '_') + '.png'), fullPage: true });
   return { headings: snapshot.headings, overflow: snapshot.overflow };
 });
 await check('Profile edits survive Save and reload', async () => {
   await go(page, '/settings');
   await page.getByRole('textbox', { name: 'Display name', exact: true }).fill('QA Changed Name');
   await page.locator('main textarea').fill('QA biography persistence check.');
   await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
   const reportedSaved = await page.getByText('Saved!', { exact: true }).isVisible();
   await go(page, '/settings');
   return { reportedSaved, nameAfterReload: await page.getByRole('textbox', { name: 'Display name', exact: true }).inputValue(), bioAfterReload: await page.locator('main textarea').inputValue() };
 });
 await check('Security settings content', async () => {
   await page.getByRole('button', { name: 'Security', exact: true }).click();
   return { headings: await page.locator('main h2').allTextContents(), content: (await page.locator('main').first().innerText()).slice(-600) };
 });
 await check('Settings appearance applies theme', async () => {
   await page.getByRole('button', { name: 'Appearance', exact: true }).click();
   const color = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
   const before = await color();
   await page.getByRole('button', { name: 'Dark', exact: true }).click();
   await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
   await page.waitForTimeout(300); const afterSave = await color();
   await go(page, '/settings');
   return { before, afterSave, afterReload: await color() };
 });
 await check('Chat send and persistence', async () => {
   await go(page, '/messages');
   await page.getByRole('list', { name: 'Conversations', exact: true }).locator('button').first().click();
   await page.getByRole('textbox', {name:'Message', exact:true}).fill('QA disposable message 2026 audit');
   await page.locator('main form button[type=submit]').click();
   const visibleImmediately = await page.getByRole('log').innerText();
   await go(page, '/messages');
   await page.getByRole('list', { name: 'Conversations', exact: true }).locator('button').first().click();
   return { visibleImmediately: visibleImmediately.includes('QA disposable message'), persists: (await page.getByRole('log').innerText()).includes('QA disposable message') };
 });
 await check('Introduction accept and persistence', async () => {
   await go(page, '/messages'); await page.getByRole('button', { name: /^Requests/ }).click();
   const requests = page.getByRole('list', { name: 'Introduction requests' });
   const before = await requests.locator('article').count();
   await requests.getByRole('button', { name: 'Accept', exact: true }).first().click();
   const accepted = (await page.locator('main').first().innerText()).includes('You accepted');
   await go(page, '/messages'); await page.getByRole('button', { name: /^Requests/ }).click();
   return { before, accepted, requestsAfterReload: await requests.locator('article').count() };
 });
 await check('Profile interest persistence and Message action', async () => {
   await go(page, '/profiles/p2');
   await page.getByRole('button', { name: 'Send interest', exact: true }).click();
   const interestFeedback = await page.getByRole('button', { name: 'Interest sent', exact: true }).isVisible();
   await go(page, '/profiles/p2');
   const resets = await page.getByRole('button', { name: 'Send interest', exact: true }).isVisible();
   await page.getByRole('button', { name: 'Message', exact: true }).click();
   return { interestFeedback, resetsAfterReload: resets, urlAfterMessageClick: page.url() };
 });
 await check('Search profiles no-result and recovery', async () => {
   await go(page, '/profiles');
   await page.getByRole('textbox', { name: 'Search profiles' }).fill('QA-nonexistent-person-999');
   const empty = (await page.locator('main').first().innerText()).slice(-600);
   await page.getByRole('textbox', { name: 'Search profiles' }).fill('Yusuf');
   return { empty, results: (await page.locator('main').first().innerText()).slice(-700) };
 });
 await check('Guardian permission revocation persists', async () => {
   await go(page, '/guardians');
   const card = page.locator('.guardian-card').first();
   await card.getByRole('button', { name: 'Revoke Message Access', exact: true }).click();
   const revoked = await card.getByRole('button', { name: 'Grant Message Access', exact: true }).isVisible();
   await go(page, '/guardians');
   return { revoked, revertedAfterReload: await card.getByRole('button', { name: 'Revoke Message Access', exact: true }).isVisible() };
 });
 await check('Contact submission outcome and network', async () => {
   await go(page, '/contact'); const posts = [];
   const listener = req => { if(req.method() === 'POST') posts.push(req.url()); }; page.on('request', listener);
   try {
     await page.locator('#contactName').fill('Disposable QA'); await page.locator('#contactEmail').fill('qa@example.com');
     await page.locator('#contactSubject').fill('QA local form test'); await page.locator('#contactMessage').fill('Disposable local audit test, not a real support request.');
     await page.getByRole('button', { name: 'Send Message', exact: true }).click();
     await page.getByText('Message Sent!', { exact: true }).waitFor();
     return { successShown: true, postRequests: posts };
   } finally { page.off('request', listener); }
 });
 await check('Account switching and settings isolation', async () => {
   await go(page, '/settings');
   await page.getByRole('button', { name: /Privacy & Safety/ }).click();
   await page.locator('main select').first().selectOption('private');
   await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
   await logout(page); await login(page, 'yusuf@example.com');
   const dashboard = (await page.locator('main').first().innerText()).slice(0, 650);
   await go(page, '/settings');
   await page.getByRole('button', { name: /Privacy & Safety/ }).click();
   return { dashboard, memberBPrivacy: await page.locator('main select').first().inputValue() };
 });
 await check('Member B ordinary admin navigation', async () => {
   await go(page, '/admin/dashboard'); return { url: page.url(), heading: await page.locator('h1').allTextContents() };
 });
 await check('Admin actual login', async () => {
   await logout(page); await login(page, 'admin@shiarishta.com', true);
   return { url: page.url(), headings: await page.locator('h1,h2').allTextContents() };
 });
 for(const route of ['/admin/dashboard','/admin/messages','/admin/support','/admin/guardians','/admin/analytics']) await check('Admin screen '+route, async () => {
   await go(page, route); const text = await page.locator('main').first().innerText();
   results.pages.push({route, viewport:'desktop', text});
   return { url:page.url(), headings:await page.locator('h1,h2').allTextContents(), demoLabel: text.includes('Demo data') };
 });
 await check('Restore member B', async () => { await logout(page); await login(page, 'yusuf@example.com'); return { url:page.url() }; });
 await page.setViewportSize({width:390,height:844});
 for(const route of ['/','/dashboard','/profiles','/messages','/settings','/onboard','/guardians']) await check('Mobile '+route, async () => {
   await go(page,route);
   const layout = await page.evaluate(() => ({width:innerWidth,scrollWidth:document.documentElement.scrollWidth, mainCount:document.querySelectorAll('main').length}));
   await page.screenshot({path:path.join(out,'mobile-'+(route.replaceAll('/','_')||'home')+'.png'),fullPage:true});
   return layout;
 });
 await check('Logged-in mobile floating navigation',async () => {
   await go(page,'/'); await page.getByRole('button',{name:'Open menu',exact:true}).click();
   const dialog=page.getByRole('dialog',{name:'Mobile navigation'}); await dialog.waitFor();
   const content=await dialog.innerText(); await page.keyboard.press('Escape'); await dialog.waitFor({state:'detached'});
   return {content,escapeCloses:true};
 });
 fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
 await browser.close();
 console.log('Audit route snapshots:', out);
})().catch(async e => { console.error(e); if(browser) await browser.close(); process.exitCode = 1; });
