const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch();
  const evidence = [];
  try {
    const page = await browser.newPage();
    const errors = [];
    const posts = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (r.method() === 'POST') posts.push(r.url()); });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://localhost:5173/contact');
      await page.getByRole('heading', { name: 'Contact form unavailable', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Sending unavailable', exact: true }).isDisabled(), true);
      const draft = { contactName: 'Disposable QA', contactEmail: 'qa@example.com', contactSubject: 'Local draft', contactMessage: 'Do not deliver this test draft.' };
      for (const [id, value] of Object.entries(draft)) await page.locator(`#${id}`).fill(value);
      // Exercise the defensive handler without enabling the disabled button.
      await page.locator('main form').evaluate(form => form.requestSubmit());
      await page.getByRole('alert').filter({ hasText: 'Message not sent.' }).waitFor();
      for (const [id, value] of Object.entries(draft)) assert.equal(await page.locator(`#${id}`).inputValue(), value);
      assert.doesNotMatch(await page.locator('body').innerText(), /Message Sent!|Message sent successfully!|Unexpected Application Error/);
      evidence.push({ width, disabled: true, draftPreserved: true, noFalseSuccess: true });
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(posts, []);
    fs.writeFileSync('C:/Users/Mitchell/AppData/Local/Temp/member-audit/contact-unavailable.json', JSON.stringify(evidence, null, 2));
    console.log('PASS: desktop/mobile Contact unavailable, disabled send, draft retained, no false success, POST or page errors');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
