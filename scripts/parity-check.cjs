// Compare key src files between the main checkout (pushed to GitHub) and the
// sandbox checkout (serving http://localhost:5173). Writes a report file.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const main = 'c:/Users/Mitchell/Downloads/migration';
const sandbox = 'c:/Users/Mitchell/Downloads/try/test/migration';
const reportPath = 'C:/Users/Mitchell/AppData/Local/Temp/member-audit/parity-report.txt';

const files = [
  'src/lib/analytics.js', 'src/lib/theme.js', 'src/lib/storage.js',
  'src/components/SiteFooter.jsx',
  'src/pages/Pricing.jsx', 'src/pages/Terms.jsx', 'src/pages/Contact.jsx',
  'src/pages/Dashboard.jsx', 'src/pages/Home.jsx', 'src/pages/Messages.jsx',
  'src/pages/Guardians.jsx', 'src/pages/Settings.jsx', 'src/pages/Profile.jsx',
  'src/pages/auth/Login.jsx', 'src/pages/auth/Register.jsx',
];

const lines = [];
let diffs = 0;
for (const f of files) {
  const a = fs.readFileSync(path.join(main, f));
  const b = fs.existsSync(path.join(sandbox, f)) ? fs.readFileSync(path.join(sandbox, f)) : null;
  const ha = crypto.createHash('sha256').update(a).digest('hex').slice(0, 12);
  const hb = b ? crypto.createHash('sha256').update(b).digest('hex').slice(0, 12) : 'MISSING';
  const same = ha === hb;
  if (!same) diffs++;
  lines.push(`${same ? 'SAME' : 'DIFF'}  ${f}  main=${ha} sandbox=${hb}`);
}
lines.push(`\nCompared ${files.length} files — differences: ${diffs}`);
fs.writeFileSync(reportPath, lines.join('\n'));
console.log(lines.join('\n'));
