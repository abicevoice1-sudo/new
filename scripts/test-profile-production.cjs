const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
 const { preview } = await import('vite');
 const server = await preview({root:'C:/Users/Mitchell/Downloads/try/test/migration',build:{outDir:'C:/Users/Mitchell/AppData/Local/Temp/member-audit/build'},preview:{port:0,host:'127.0.0.1',open:false}});
 const browser = await chromium.launch();
 const evidence = [];
 try {
 const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
 const base = `http://127.0.0.1:${server.httpServer.address().port}`;
 const { execFileSync } = require('node:child_process');
 const root = 'C:/Users/Mitchell/Downloads/migration';
 const seed = JSON.parse(execFileSync(process.execPath, [`${root}/scripts/seed-test-data.mjs`], { cwd: root, encoding: 'utf8' }));
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(`${base}/auth/login`);
 await page.evaluate(users => localStorage.setItem('sh_users', JSON.stringify(users)), seed.sh_users);
 await page.locator('#email').fill('aaliyah@example.com');
 await page.locator('input[type=password]').fill('Test1234!');
 await page.getByRole('button', { name: 'Sign In', exact: true }).click();
 await page.waitForURL('**/dashboard');
 const avatar = page.locator('.landing-avatar-btn');
 const menu = page.locator('.account-menu');
 await avatar.waitFor();
 assert.equal(await menu.count(), 0);
 assert.equal(await avatar.getAttribute('aria-expanded'), 'false');
 await avatar.click(); await menu.waitFor();
 assert.equal(await avatar.getAttribute('aria-expanded'), 'true');
 await avatar.click(); await menu.waitFor({ state: 'detached' });
 await avatar.click(); await menu.waitFor();
 await menu.getByRole('button', { name: 'Sign out', exact: true }).click();
 await menu.getByRole('button', { name: 'Cancel', exact: true }).click();
 assert.equal(await menu.isVisible(), true);
 assert.equal(await menu.getByRole('button', { name: 'Sign out', exact: true }).isVisible(), true);
 await page.keyboard.press('Escape'); await menu.waitFor({ state: 'detached' });
 evidence.push({ step: 'Production account menu initially closed, toggles, Cancel preserves login, Escape closes', pass: true });
 for(const [id,name] of [['p1','Aaliyah R., 27'],['p2','Yusuf K., 31']]) {
   await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/profiles/${id}`);
   for(const phase of ['initial','reload']) {
     if(phase==='reload') await page.reload();
     await page.getByRole('heading',{name,exact:true}).waitFor();
     await page.getByText('AI Compatibility Index',{exact:true}).waitFor();
     const text=await page.locator('body').innerText();
     assert.doesNotMatch(text,/Unexpected Application Error|Cannot read properties|NaN/);
     assert.equal(await page.getByRole('img',{name:/^\d+% compatibility$/}).count(),1);
     evidence.push({id,phase,pass:true,text:text.slice(0,1800)});
   }
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: production p1/p2 render and reload, numeric compatibility, no console/page errors');
 } finally {
 fs.writeFileSync('C:/Users/Mitchell/AppData/Local/Temp/member-audit/production-profile.json',JSON.stringify(evidence,null,2));
 await browser.close(); await new Promise(resolve=>server.httpServer.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
