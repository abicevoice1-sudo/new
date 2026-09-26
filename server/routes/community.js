import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
const SLUG_RE = /^[a-z0-9]{2,32}$/;

// GET /api/community — rooms with live post counts
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.icon,
              (SELECT COUNT(*)::int FROM posts p WHERE p.community_id = c.id AND p.is_hidden = FALSE) AS posts
         FROM communities c ORDER BY c.id`,
    );
    res.json(rows.map(r => ({ id: r.id, name: r.name, icon: r.icon, members: r.posts })));
  } catch (e) { next(e); }
});

// POST /api/community — create a room (auth)
router.post('/', authRequired, async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? '').trim().slice(0, 60);
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32);
    if (!SLUG_RE.test(id)) return res.status(400).json({ error: 'Use 2–32 lowercase letters/numbers for the name.' });
    try {
      const { rows } = await pool.query(
        `INSERT INTO communities (id, name, created_by) VALUES ($1,$2,$3) RETURNING id, name, icon`,
        [id, name, req.user.uid],
      );
      res.status(201).json(rows[0]);
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ error: 'That community already exists.' });
      throw e;
    }
  } catch (e) { next(e); }
});

// GET /api/community/:slug/posts — feed for a room ('all' = every room)
router.get('/:slug/posts', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { rows } = await pool.query(
      `SELECT p.id, p.community_id AS sub, p.title, p.body, p.author_name AS author,
              p.likes, p.created_at,
              (SELECT COUNT(*)::int FROM replies r WHERE r.post_id = p.id AND r.is_hidden = FALSE) AS replies
         FROM posts p
        WHERE p.is_hidden = FALSE AND ($1 = 'all' OR p.community_id = $1)
        ORDER BY p.created_at DESC LIMIT 100`,
      [slug],
    );
    res.json(rows.map(r => ({ ...r, id: String(r.id), time: r.created_at, tags: [] })));
  } catch (e) { next(e); }
});

// POST /api/community/:slug/posts — new post (auth)
router.post('/:slug/posts', authRequired, async (req, res, next) => {
  try {
    const title = String(req.body?.title ?? '').trim();
    const body = String(req.body?.body ?? '').trim().slice(0, 10000);
    if (!title) return res.status(400).json({ error: 'A title is required.' });
    if (title.length > 300) return res.status(400).json({ error: 'Title must be under 300 characters.' });
    const room = await pool.query(`SELECT id FROM communities WHERE id = $1`, [req.params.slug]);
    if (!room.rowCount) return res.status(404).json({ error: 'Community not found.' });
    const author = String(req.body?.author ?? '').trim() || req.user.displayName || 'Member';
    const { rows } = await pool.query(
      `INSERT INTO posts (community_id, author_id, author_name, title, body)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [req.params.slug, req.user.uid, author.slice(0, 60), title, body],
    );
    res.status(201).json({ id: String(rows[0].id) });
  } catch (e) { next(e); }
});

// GET /api/community/post/:id — full thread incl. visible replies
router.get('/post/:id', async (req, res, next) => {
  try {
    const p = await pool.query(
      `SELECT p.id, p.community_id AS sub, p.title, p.body, p.author_name AS author,
              p.likes, p.created_at,
              (SELECT COUNT(*)::int FROM replies r WHERE r.post_id = p.id AND r.is_hidden = FALSE) AS replies
         FROM posts p WHERE p.id = $1 AND p.is_hidden = FALSE`,
      [req.params.id],
    );
    if (!p.rowCount) return res.status(404).json({ error: 'Post not found.' });
    const r = await pool.query(
      `SELECT id, author_name AS author, body, created_at AS time FROM replies
        WHERE post_id = $1 AND is_hidden = FALSE ORDER BY created_at ASC LIMIT 200`,
      [req.params.id],
    );
    res.json({ ...p.rows[0], id: String(p.rows[0].id), time: p.rows[0].created_at, tags: [], repliesList: r.rows });
  } catch (e) { next(e); }
});

// POST /api/community/post/:id/replies — reply (auth)
router.post('/post/:id/replies', authRequired, async (req, res, next) => {
  try {
    const body = String(req.body?.body ?? '').trim();
    if (!body) return res.status(400).json({ error: 'Reply cannot be empty.' });
    if (body.length > 5000) return res.status(400).json({ error: 'Reply must be under 5000 characters.' });
    const p = await pool.query(`SELECT id FROM posts WHERE id = $1 AND is_hidden = FALSE`, [req.params.id]);
    if (!p.rowCount) return res.status(404).json({ error: 'Post not found.' });
    const author = req.user.displayName || 'Member';
    const { rows } = await pool.query(
      `INSERT INTO replies (post_id, author_id, author_name, body) VALUES ($1,$2,$3,$4) RETURNING id`,
      [req.params.id, req.user.uid, author.slice(0, 60), body],
    );
    res.status(201).json({ id: String(rows[0].id) });
  } catch (e) { next(e); }
});

export default router;
