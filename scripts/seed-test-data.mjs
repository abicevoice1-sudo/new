// scripts/seed-test-data.mjs
// ─── One-shot localStorage seeder for demo / QA ─────────────────────────────
// Node writes real bcrypt hashes (bcryptjs, cost 10) so the browser-side
// authService.login() (bcrypt.compareSync) accepts them verbatim.
// Browser keys are PREFIXED with `sh_` by src/lib/api/storage.js, so the JSON
// payload file we emit must contain the SUFFIX keys: users / session / profiles.
//
// Usage:
//   FAKE_PASSWORD='Test1234!' node scripts/seed-test-data.mjs   # prints JSON
//   # then paste into DevTools console, OR copy dist JSON into seed.html
//
// The emitted JSON shape:
//   { "sh_users": [...], "sh_profiles": [...] }
import bcrypt from 'bcryptjs';

const password = process.env.FAKE_PASSWORD ?? 'Test1234!';
const ADMIN_EMAILS = ['admin@shiarishta.com', 'moderator@shiarishta.com'];

const seedUsers = [
  { email: 'admin@shiarishta.com', displayName: 'Site Admin' },
  { email: 'moderator@shiarishta.com', displayName: 'Moderator' },
  { email: 'aaliyah@example.com', displayName: 'Aaliyah R.' },
  { email: 'yusuf@example.com', displayName: 'Yusuf K.' },
  { email: 'maryam@example.com', displayName: 'Maryam S.' },
];

const users = seedUsers.map((u, i) => {
  const cleanEmail = u.email.trim().toLowerCase();
  return {
    uid: `seed-${String(i + 1).padStart(2, '0')}`,
    email: cleanEmail,
    displayName: u.displayName,
    passwordHash: bcrypt.hashSync(String(password), 10),
    // NOTE: isAdmin is evaluated at register() time from VITE_ADMIN_EMAILS.
    // We bake it in here so a stale/missing .env still yields working admins.
    isAdmin: ADMIN_EMAILS.includes(cleanEmail),
    createdAt: new Date().toISOString(),
  };
});

// Minimal profile mirrors for the three member accounts (IDs match mockData p1-p3).
const profiles = [
  { id: 'p1', displayName: 'Aaliyah R.', ownerEmail: 'aaliyah@example.com' },
  { id: 'p2', displayName: 'Yusuf K.', ownerEmail: 'yusuf@example.com' },
  { id: 'p3', displayName: 'Maryam S.', ownerEmail: 'maryam@example.com' },
];

const payload = { sh_users: users, sh_profiles: profiles };

// Print compact JSON to stdout — pipe to a file or copy into DevTools.
process.stdout.write(JSON.stringify(payload));
