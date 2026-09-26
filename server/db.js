import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'shiarishta',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 10,
  // Fail fast when the DB is unreachable — a 30s+ OS-level TCP hang per request
  // makes health checks and the migration retry loop sluggish.
  connectionTimeoutMillis: 5000,
  // The product stores emoji (community icons) and non-Latin names. Windows and
  // some shared hosts negotiate WIN1252/LATIN1 from the server locale, which
  // makes the whole schema fail to load ("has no equivalent in encoding").
  // Pin the session encoding on every connection.
  client_encoding: 'UTF8',
});

// pg Pool emits 'error' on idle-client failures (e.g. Postgres restarted under
// us). With no listener, EventEmitter throws → uncaughtException → crash.
// A shared-hosting DB restarting must never take the API down with it.
pool.on('error', (err) => {
  console.error('[api] idle pg client error (pool keeps running):', err.code || err.message);
});

// Belt and braces: even if a proxy/role resets the session encoding, set it here.
pool.on('connect', (client) => {
  client.query("SET client_encoding TO 'UTF8'").catch(() => { /* non-fatal */ });
});

export async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query("SET client_encoding TO 'UTF8'");
    await client.query(sql);
  } finally {
    client.release();
  }
  console.log('[api] schema migrated');
}
