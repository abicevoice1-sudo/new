const fs = require('fs');
const path = require('path');

const o = 'c:/Users/Mitchell/Downloads/migration/src';
const s = 'c:/Users/Mitchell/Downloads/try/test/migration/src';

// Recursive copy: mirrors the whole tree (including subdirectories such as
// pages/auth and pages/admin) so the sandbox serves exactly what main has.
['layouts', 'components', 'lib', 'styles', 'hooks', 'assets', 'pages', 'features'].forEach(dir => {
  const op = path.join(o, dir);
  const sp = path.join(s, dir);
  try {
    if (fs.statSync(op).isDirectory()) {
      fs.cpSync(op, sp, { recursive: true, force: true });
      console.log('synced src/' + dir + ' (recursive)');
    }
  } catch (e) {
    console.log('skip:', dir, e.message);
  }
});
console.log('done');
