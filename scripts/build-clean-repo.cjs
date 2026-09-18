// Build a clean enterprise-grade repo tree from the main checkout.
// Excludes dependencies, build output, junk probes and one-off debug scripts.
// Result: a temp directory ready for `git init` + single clean commit.
const fs = require('node:fs');
const path = require('node:path');

const SRC = 'c:/Users/Mitchell/Downloads/migration';
const DEST = 'c:/Users/Mitchell/AppData/Local/Temp/shiarishta-clean-repo';

// Never copy — dependencies, build artifacts, caches, OS junk.
const EXCLUDE_DIRS = new Set([
  'node_modules', 'dist', '.vite', '.git', 'build', 'coverage',
  '__pycache__', '.cache', 'tmp', '.vercel', '.netlify',
]);
const EXCLUDE_FILES = new Set([
  '.DS_Store', 'Thumbs.db', '.env', '.env.local', '.npm-error.log',
  // one-off debug/probe scripts (not part of the test suite)
  'probe-messages.cjs', 'fix-home.cjs', 'fix-settings.cjs', 'fix-register.cjs',
  'sweep-tmp.cjs', 'verify-dash.cjs', 'notif-test.cjs', 'mobile-audit.cjs',
  'qa-audit.cjs', '.tmp-orig-verify.cjs',
]);
// Debug scripts that live in scripts/ but are not real suites.
const EXCLUDE_SCRIPTS = new Set([
  'test-debug.cjs', 'test-debug2.cjs', 'test-final.cjs', 'test-final2.cjs',
  'test-fresh.cjs', 'test-body.cjs', 'test-result.cjs', 'test-seeded.cjs',
  'test-seeded2.cjs', 'test-login.cjs', 'test-header.cjs', 'test-account-menu.cjs',
  'test-drawer-regression.cjs', 'test-floating-menu.cjs', 'check-syntax.cjs',
  'compare-servers.mjs', 'sync-to-sandbox.cjs',
]);
const EXCLUDE_EXT = new Set(['.log', '.tmp']);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      copyDir(path.join(from, entry.name), path.join(to, entry.name));
    } else if (entry.isFile()) {
      if (EXCLUDE_FILES.has(entry.name)) continue;
      if (EXCLUDE_EXT.has(path.extname(entry.name))) continue;
      // scripts/ subfolder filter
      const rel = path.relative(SRC, path.join(from, entry.name)).replace(/\\/g, '/');
      if (rel === 'scripts/' + entry.name && EXCLUDE_SCRIPTS.has(entry.name) && from.endsWith('scripts')) continue;
      fs.copyFileSync(path.join(from, entry.name), path.join(to, entry.name));
    }
  }
}

fs.rmSync(DEST, { recursive: true, force: true });
copyDir(SRC, DEST);

// Remove known junk from scripts/
const scriptsDir = path.join(DEST, 'scripts');
if (fs.existsSync(scriptsDir)) {
  for (const name of fs.readdirSync(scriptsDir)) {
    if (EXCLUDE_SCRIPTS.has(name)) fs.rmSync(path.join(scriptsDir, name));
  }
}
// Root-level QA artifacts from earlier sessions (report stays, raw json goes)
for (const junk of ['qa-audit-report.json', 'qa-member-audit-2026-09-17.md.bak']) {
  const p = path.join(DEST, junk);
  if (fs.existsSync(p)) fs.rmSync(p);
}

const count = (dir) => {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += count(path.join(dir, e.name));
    else n++;
  }
  return n;
};
console.log('Clean tree at:', DEST);
console.log('Total files:', count(DEST));
const hasNm = fs.existsSync(path.join(DEST, 'node_modules'));
console.log('node_modules present:', hasNm);
if (hasNm) { console.error('FAIL: node_modules leaked'); process.exit(1); }
