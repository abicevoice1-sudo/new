import { pool } from './db.js';

// Seed rooms + welcome threads so a fresh database is never an empty product.
export async function seed() {
  const rooms = [
    ['all', 'All', '💰'], ['hyderabad', 'Hyderabad', '🇮🇳'], ['dubai', 'Dubai', '🇦🇪'],
    ['dallas', 'Dallas', '🇺🇸'], ['london', 'London', '🇬🇧'], ['toronto', 'Toronto', '🇨🇦'],
    ['reverts', 'Reverts', '🌙'], ['parents', 'Parents', '👨‍👩‍👧‍👦'], ['newlywed', 'Newlywed', '💍'],
  ];
  for (const [id, name, icon] of rooms) {
    await pool.query(`INSERT INTO communities (id, name, icon) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`, [id, name, icon]);
  }
  const { rowCount } = await pool.query(`SELECT 1 FROM posts LIMIT 1`);
  if (!rowCount) {
    const welcome = [
      ['hyderabad', 'Support Team', 'Welcome to /Hyderabad — introduce yourself', 'Salaam! Share what you are hoping for and how your family prefers to be involved.'],
      ['dubai', 'Support Team', 'Welcome to /Dubai — introduce yourself', 'Salaam! Tell us a little about yourself and what a respectful first conversation looks like to you.'],
      ['reverts', 'Support Team', 'New reverts support — weekly virtual meetups', 'A gentle space for brothers and sisters who embraced Islam recently. Say salaam below for the invite.'],
    ];
    for (const [sub, author, title, body] of welcome) {
      await pool.query(`INSERT INTO posts (community_id, author_name, title, body) VALUES ($1,$2,$3,$4)`, [sub, author, title, body]);
    }
  }
  console.log('[api] seed complete');
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
