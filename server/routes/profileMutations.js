import { Router } from 'express';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

// PUT /api/profiles/me — owner updates own profile; validation server-side
router.put('/me', async (req, res, next) => {
  try {
    const b = req.body || {};
    const age = b.age === undefined || b.age === null || b.age === '' ? null : Number(b.age);
    if (age !== null && (!Number.isInteger(age) || age < 18 || age > 100))
      return res.status(400).json({ error: 'Age must be between 18 and 100.' });
    if (b.gender && !['male', 'female'].includes(b.gender))
      return res.status(400).json({ error: 'Invalid gender.' });
    for (const f of ['visibility', 'photos_visibility', 'photosVisibility']) {
      const v = b[f];
      if (v && !['public', 'members', 'private'].includes(v))
        return res.status(400).json({ error: `Invalid ${f}.` });
    }
    if (b.bio && String(b.bio).length > 2000)
      return res.status(400).json({ error: 'Bio must be under 2000 characters.' });
    const cols = ['display_name', 'displayName', 'age', 'gender', 'city', 'country',
      'sect', 'profession', 'bio', 'visibility', 'photos_visibility', 'photosVisibility'];
    const sets = []; const params = [];
    for (const key of cols) {
      if (b[key] === undefined) continue;
      const col = key === 'displayName' ? 'display_name'
        : key === 'photosVisibility' ? 'photos_visibility' : key;
      const v = key === 'age' ? age : (b[key] === '' ? null : b[key]);
      params.push(v);
      sets.push(`${col} = $${params.length}`);
    }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update.' });
    params.push(req.user.uid);
    const { rows } = await pool.query(
      `UPDATE profiles SET ${sets.join(', ')}, updated_at = now() WHERE user_id = $${params.length} RETURNING *`,
      params,
    );
    res.json({ ok: true, profile: rows[0] });
  } catch (e) { next(e); }
});

// POST /api/profiles/:id/interest — express interest; mutual = match
router.post('/:id/interest', async (req, res, next) => {
  try {
    const to = req.params.id;
    if (to === req.user.uid) return res.status(400).json({ error: 'You cannot express interest in yourself.' });
    const target = await pool.query(`SELECT 1 FROM users WHERE id = $1`, [to]);
    if (!target.rowCount) return res.status(404).json({ error: 'Profile not found.' });
    await pool.query(
      `INSERT INTO interests (from_user_id, to_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.uid, to],
    );
    const mutual = await pool.query(
      `SELECT 1 FROM interests WHERE from_user_id = $1 AND to_user_id = $2`,
      [to, req.user.uid],
    );
    res.json({ success: true, matched: mutual.rowCount > 0 });
  } catch (e) { next(e); }
});

export default router;
