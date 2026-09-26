import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { pool } from '../db.js';
import { authRequired, adminRequired } from '../middleware/auth.js';

const router = Router();

// POST /api/admin/login — separate admin credential check (email must be is_admin).
// Public: it is the way to prove admin status. Everything below requires it.
router.use(authRequired, adminRequired);

// GET /api/admin/reports?status=open
router.get('/reports', async (req, res, next) => {
  try {
    const status = ['open', 'actioned', 'dismissed'].includes(req.query.status) ? req.query.status : 'open';
    const { rows } = await pool.query(
      `SELECT r.*, u.email AS reporter_email FROM reports r
        JOIN users u ON u.id = r.reporter_id
       WHERE r.status = $1 ORDER BY r.created_at DESC LIMIT 200`,
      [status],
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/admin/reports/:id/action — hide the target + mark actioned
router.post('/reports/:id/action', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM reports WHERE id = $1`, [req.params.id]);
    const report = rows[0];
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    if (report.target_type === 'post') {
      const r = await pool.query(`SELECT id FROM posts WHERE id = $1`, [report.target_id]).catch(() => ({ rowCount: 0 }));
      if (r.rowCount) await pool.query(`UPDATE posts SET is_hidden = TRUE WHERE id = $1`, [report.target_id]);
    } else if (report.target_type === 'reply') {
      const r = await pool.query(`SELECT id FROM replies WHERE id = $1`, [report.target_id]).catch(() => ({ rowCount: 0 }));
      if (r.rowCount) await pool.query(`UPDATE replies SET is_hidden = TRUE WHERE id = $1`, [report.target_id]);
    } else if (report.target_type === 'profile' || report.target_type === 'user') {
      await pool.query(`UPDATE profiles SET is_blocked = TRUE WHERE user_id = $1`, [report.target_id]).catch(() => {});
    }
    await pool.query(`UPDATE reports SET status = 'actioned' WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/admin/reports/:id/dismiss
router.post('/reports/:id/dismiss', async (req, res, next) => {
  try {
    await pool.query(`UPDATE reports SET status = 'dismissed' WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// GET /api/admin/overview — real counts, never mock data
router.get('/overview', async (_req, res, next) => {
  try {
    const [[u], [p], [m], [po], [re], [ro]] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS n FROM users`).then(r => r.rows),
      pool.query(`SELECT COUNT(*)::int AS n FROM profiles WHERE is_blocked = FALSE`).then(r => r.rows),
      pool.query(`SELECT COUNT(*)::int AS n FROM messages WHERE created_at > now() - interval '1 day'`).then(r => r.rows),
      pool.query(`SELECT COUNT(*)::int AS n FROM posts WHERE is_hidden = FALSE`).then(r => r.rows),
      pool.query(`SELECT COUNT(*)::int AS n FROM replies WHERE created_at > now() - interval '7 days'`).then(r => r.rows),
      pool.query(`SELECT COUNT(*)::int AS n FROM reports WHERE status = 'open'`).then(r => r.rows),
    ]);
    res.json({
      totalMembers: u.n, activeProfiles: p.n, messagesToday: m.n,
      livePosts: po.n, repliesThisWeek: re.n, openReports: ro.n,
    });
  } catch (e) { next(e); }
});

// POST /api/admin/users/:id/role { role } — approve a matchmaker/guardian (or
// revoke back to member). Admin-only. Revoking never deletes data; it only
// stops new drafts — existing claimed memberships belong to their owners.
router.post('/users/:id/role', async (req, res, next) => {
  try {
    const role = String(req.body?.role || '');
    if (!['member', 'matchmaker', 'guardian'].includes(role)) {
      return res.status(400).json({ error: 'Role must be member, matchmaker or guardian.' });
    }
    const { rows } = await pool.query(`UPDATE users SET role=$2 WHERE id=$1 RETURNING id, email, role`, [req.params.id, role]);
    if (!rows[0]) return res.status(404).json({ error: 'Member not found.' });
    res.json({ ok: true, ...rows[0] });
  } catch (e) { next(e); }
});

// GET /api/admin/users?role=member — find members (e.g. to approve applications)
router.get('/users', async (req, res, next) => {
  try {
    const role = ['member', 'matchmaker', 'guardian'].includes(req.query.role) ? req.query.role : null;
    const { rows } = await pool.query(
      role
        ? `SELECT id, email, display_name, role, email_verified, created_at FROM users WHERE role=$1 ORDER BY created_at DESC LIMIT 100`
        : `SELECT id, email, display_name, role, email_verified, created_at FROM users ORDER BY created_at DESC LIMIT 100`,
      role ? [role] : [],
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/admin/analytics?range=7d|30d — real series from created_at buckets
router.get('/analytics', async (req, res, next) => {
  try {
    const range = req.query.range === '30d' ? '30d' : '7d';
    const days = range === '30d' ? 30 : 7;
    const members = await pool.query(
      `SELECT to_char(d, 'Mon DD') AS label, (SELECT COUNT(*)::int FROM users u WHERE u.created_at::date = d) AS value
         FROM generate_series((now() - ($1 || ' days')::interval)::date, now()::date, '1 day') d ORDER BY d`,
      [days],
    );
    const messages = await pool.query(
      `SELECT to_char(d, 'Mon DD') AS label, (SELECT COUNT(*)::int FROM messages m WHERE m.created_at::date = d) AS value
         FROM generate_series((now() - ($1 || ' days')::interval)::date, now()::date, '1 day') d ORDER BY d`,
      [days],
    );
    res.json({
      range,
      charts: [
        { key: 'memberGrowth', title: 'Member Growth', labels: members.rows.map(r => r.label), values: members.rows.map(r => r.value), color: 'var(--color-primary)' },
        { key: 'messageVolume', title: 'Message Volume', labels: messages.rows.map(r => r.label), values: messages.rows.map(r => r.value), color: 'var(--color-accent)' },
      ],
    });
  } catch (e) { next(e); }
});

// ─── Verification queue — approve sets the public verified badge ─────────────
// GET /api/admin/verifications?status=pending
router.get('/verifications', async (req, res, next) => {
  try {
    const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'pending';
    const { rows } = await pool.query(
      `SELECT v.id, v.kind, v.status, v.created_at, v.reviewed_at, v.review_note,
              u.email AS member_email, p.display_name AS member_name
         FROM verifications v
         JOIN users u ON u.id = v.user_id
         LEFT JOIN profiles p ON p.user_id = v.user_id
        WHERE v.status = $1
        ORDER BY v.created_at ASC LIMIT 200`,
      [status],
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/admin/verifications/:id/approve — flips the member's public badge
router.post('/verifications/:id/approve', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE verifications SET status='approved', reviewed_by=$2, reviewed_at=now(), review_note=$3
        WHERE id=$1 AND status='pending' RETURNING user_id`,
      [req.params.id, req.user.uid, String(req.body?.note || '').slice(0, 500) || null],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Submission not found or already reviewed.' });
    await pool.query(`UPDATE profiles SET is_verified=TRUE, updated_at=now() WHERE user_id=$1`, [rows[0].user_id]);
    res.json({ ok: true, verified: true });
  } catch (e) { next(e); }
});

// POST /api/admin/verifications/:id/reject — with a reason the member can read
router.post('/verifications/:id/reject', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE verifications SET status='rejected', reviewed_by=$2, reviewed_at=now(), review_note=$3
        WHERE id=$1 AND status='pending' RETURNING id`,
      [req.params.id, req.user.uid, String(req.body?.note || '').slice(0, 500) || 'Photo was not clear enough — please resubmit.'],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Submission not found or already reviewed.' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// GET /api/admin/verifications/:id/file — bytes only for authenticated admins
router.get('/verifications/:id/file', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT storage_path FROM verifications WHERE id=$1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found.' });
    const p = String(rows[0].storage_path);
    // Defense in depth: never serve anything outside UPLOAD_DIR even if a path
    // in the DB were tampered with.
    const uploadDir = (process.env.UPLOAD_DIR || '').replace(/\/+$/, '');
    if (uploadDir && !path.resolve(p).startsWith(path.resolve(uploadDir))) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    fs.readFile(p, (err, buf) => {
      if (err) return res.status(404).json({ error: 'File missing on disk.' });
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.send(buf);
    });
  } catch (e) { next(e); }
});

export default router;
