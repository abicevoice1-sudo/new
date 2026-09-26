import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();
const TARGETS = ['profile', 'post', 'reply', 'message', 'user'];

// POST /api/reports — file a report (auth; 1/day per target to prevent spam)
router.post('/', async (req, res, next) => {
  try {
    const targetType = String(req.body?.targetType || req.body?.target_type || '');
    const targetId = String(req.body?.targetId || req.body?.target_id || '');
    const reason = String(req.body?.reason || '').trim().slice(0, 1000);
    if (!TARGETS.includes(targetType)) return res.status(400).json({ error: 'Invalid report target.' });
    if (!targetId) return res.status(400).json({ error: 'Missing report target.' });
    if (!reason) return res.status(400).json({ error: 'Please describe the problem.' });
    const dup = await pool.query(
      `SELECT 1 FROM reports WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3 AND created_at > now() - interval '1 day'`,
      [req.user.uid, targetType, targetId],
    );
    if (dup.rowCount) return res.status(429).json({ error: 'You already reported this. Our team is reviewing it.' });
    const { rows } = await pool.query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES ($1,$2,$3,$4) RETURNING id, created_at`,
      [req.user.uid, targetType, targetId, reason],
    );
    res.status(201).json({ ok: true, id: rows[0].id });
  } catch (e) { next(e); }
});

// POST /api/reports/block — block a member: hides them + kills messaging both ways
router.post('/block', async (req, res, next) => {
  try {
    const blockedId = String(req.body?.userId || req.body?.blockedId || '');
    if (!blockedId || blockedId === req.user.uid) return res.status(400).json({ error: 'Invalid member.' });
    await pool.query(`INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [req.user.uid, blockedId]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// DELETE /api/reports/block/:id — unblock
router.delete('/block/:id', async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2`, [req.user.uid, req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
