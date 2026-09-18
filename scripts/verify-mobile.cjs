const fs = require('fs');
const css = fs.readFileSync('src/styles/globals.css', 'utf8');

const checks = {
  'padding-top: 4rem': /padding-top\s*:\s*4rem/,
  'flex-shrink:0 .mobile-menu-btn': /mobile-topbar[\s\S]{0,200}\.mobile-menu-btn[\s\S]{0,100}flex-shrink\s*:\s*0/,
  'margin-left:auto button:last-child': /button:last-child[\s\S]{0,100}margin-left\s*:\s*auto/,
  'min-width:0 .app-brand': /\.app-brand[\s\S]{0,100}min-width\s*:\s*0/,
  '.mobile-topbar display:none base': /\.mobile-topbar\s*\{[\s\S]{0,200}display\s*:\s*none/,
  '@media (max-width: 900px)': /@media\s*\(max-width:\s*900px\)/,
};

console.log('=== CSS Fix Verification (file read direct) ===');
console.log('globals.css size:', css.length, 'bytes\n');

let allPass = true;
for (const [name, re] of Object.entries(checks)) {
  const pass = re.test(css);
  if (!pass) allPass = false;
  console.log((pass ? 'PASS' : 'FAIL'), '-', name);
}

console.log('\n' + (allPass ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'));
process.exit(allPass ? 0 : 1);
