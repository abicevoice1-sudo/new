const http = require('http');

function fetch(url, cb) {
  http.get(url, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => cb(null, res.statusCode, d));
  }).on('error', e => cb(e.message));
}

const cssUrl = 'http://localhost:5173/src/styles/globals.css';
console.log('Fetching served CSS from:', cssUrl);

fetch(cssUrl, (err, st, css) => {
  if (err) { console.log('ERROR fetching CSS:', err); process.exit(1); }
  console.log('Served CSS status:', st, '| size:', css.length, 'bytes\n');

  const checks = [
    ['padding-top: 4rem rule', /padding-top\s*:\s*4rem/],
    ['flex-shrink:0 on .mobile-menu-btn inside MQ', /mobile-topbar[\s\S]{0,200}\.mobile-menu-btn[\s\S]{0,100}flex-shrink\s*:\s*0/],
    ['margin-left:auto on button:last-child', /button:last-child[\s\S]{0,100}margin-left\s*:\s*auto/],
    ['min-width:0 on .app-brand', /\.app-brand[\s\S]{0,100}min-width\s*:\s*0/],
    ['.mobile-topbar base display:none', /\.mobile-topbar\s*\{[\s\S]{0,200}display\s*:\s*none/],
    ['@media (max-width: 900px) block', /@media\s*\(max-width:\s*900px\)/],
  ];

  console.log('=== SERVED CSS VERIFICATION ===');
  let allPass = true;
  for (const [name, re] of checks) {
    const pass = re.test(css);
    if (!pass) allPass = false;
    console.log((pass ? '✅' : '❌'), name);
  }

  console.log('\n' + (allPass ? '✅ ALL CHECKS PASSED — fix is LIVE in served CSS' : '❌ SOME CHECKS FAILED'));
  process.exit(allPass ? 0 : 1);
});
