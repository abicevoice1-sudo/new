// ─── Local dev database — throwaway Postgres that survives across runs ──────
// Usage: node scripts/dev-db.mjs   (leave it running; Ctrl+C or kill to stop)
// The API connects with DB_PORT=5433. Data lives in ./.pgdata-dev (git-ignored
// territory — never commit it). Same UTF8 encoding as production.
import EmbeddedPostgres from 'embedded-postgres';
import pgClient from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, '.pgdata-dev');

const PORT = 5432; // same as .env DB_PORT default so the API connects with no extra config

const pg = new EmbeddedPostgres({
  databaseDir: dir, user: 'postgres', password: 'postgres', port: PORT, persistent: true,
});
if (!fs.existsSync(path.join(dir, 'PG_VERSION'))) {
  console.log('[dev-db] initialising fresh cluster…');
  await pg.initialise();
}
await pg.start();
const admin = new pgClient.Client({ host: 'localhost', port: PORT, user: 'postgres', password: 'postgres', database: 'postgres' });
await admin.connect();
const found = await admin.query(`SELECT 1 FROM pg_database WHERE datname = 'shiarishta'`);
if (!found.rowCount) {
  await admin.query("CREATE DATABASE shiarishta WITH ENCODING 'UTF8' TEMPLATE template0");
  console.log('[dev-db] created database shiarishta (UTF8)');
}
await admin.end();
console.log(`[dev-db] ready on :${PORT} — shiarishta (UTF8). Kill this process to stop Postgres.`);
setInterval(() => {}, 1 << 30);
