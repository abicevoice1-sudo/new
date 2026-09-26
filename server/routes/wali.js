// ─── Wali companion links — the member shares a read-only view with a guardian ─
// The wali needs no account: a revocable token URL shows one member's profile
// (never email, never contact details, nothing else) plus a human note that
// this is read-only and controlled by the member.
import { Router } from 'express';
import crypto from 'crypto';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// POST /api/wali/link — create (or rotate) my wali link
router.post('/link', authRequired, async (req, res, next) => {
  try {
    const token = crypto.randomBytes(24).toString('base64url');
    await pool.query(`INSERT INTO wali_links (token, user_id) VALUES ($1,$2)`, [token, req.user.uid]);
    const base = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
    res.status(201).json({ ok: true, url: `${base}/wali/${token}` });
  } catch (e) { next(e); }
});

// GET /api/wali/:token — public, read-only, deliberately minimal payload
router.get('/:token', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, p.display_name, p.age, p.city, p.country, p.sect, p.profession,
              p.bio, p.is_verified, l.revoked
         FROM wali_links l
         JOIN users u ON u.id = l.user_id
         LEFT JOIN profiles p ON p.user_id = u.id
        WHERE l.token = $1`,
      [req.params.token],
    );
    if (!rows[0] || rows[0].revoked) return res.status(404).json({ error: 'This wali link is invalid or was revoked.' });
    const r = rows[0];
    res.json({
      readOnly: true,
      member: {
        displayName: r.display_name, age: r.age, city: r.city, country: r.country,
        sect: r.sect, profession: r.profession, bio: r.bio, isVerified: r.is_verified,
      },
    });
  } catch (e) { next(e); }
});

// DELETE /api/wali/link/:token — member revokes a link
router.delete('/link/:token', authRequired, async (req, res, next) => {
  try {
    await pool.query(`UPDATE wali_links SET revoked = TRUE WHERE token = $1 AND user_id = $2`, [req.params.token, req.user.uid]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
