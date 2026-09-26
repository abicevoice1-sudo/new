// ─── Verification pipeline — member side ─────────────────────────────────────
// A member submits a selfie or ID photo; an admin approves/rejects from the
// queue. Files stay on disk under UPLOAD_DIR (outside any web root when cPanel
// app root is outside public_html); bytes are served ONLY to admins.
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_BYTES = 1_500_000; // ~1.5MB — plenty for a compressed ID/selfie photo
const KINDS = new Set(['selfie', 'id_document']);

// POST /api/verifications { kind, imageBase64 } — submit for review
router.post('/', async (req, res, next) => {
  try {
    const kind = String(req.body?.kind || '');
    const imageBase64 = String(req.body?.imageBase64 || '');
    if (!KINDS.has(kind)) return res.status(400).json({ error: 'Choose selfie or ID document.' });
    const b64 = imageBase64.replace(/^data:image\/(png|jpe?g|webp);base64,/i, '');
    if (!b64) return res.status(400).json({ error: 'Attach a photo to verify.' });
    const bytes = Buffer.from(b64, 'base64');
    if (bytes.length === 0 || bytes.length > MAX_BYTES) {
      return res.status(400).json({ error: 'Photo must be under 1.5 MB.' });
    }
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const file = path.join(UPLOAD_DIR, `v-${req.user.uid}-${Date.now()}.bin`);
    fs.writeFileSync(file, bytes);
    const { rows } = await pool.query(
      `INSERT INTO verifications (user_id, kind, storage_path) VALUES ($1,$2,$3)
       RETURNING id, kind, status, created_at`,
      [req.user.uid, kind, file],
    );
    res.status(201).json({ ok: true, verification: rows[0] });
  } catch (e) { next(e); }
});

// GET /api/verifications/mine — my submissions + statuses
router.get('/mine', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, kind, status, review_note, created_at, reviewed_at
         FROM verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.uid],
    );
    res.json(rows);
  } catch (e) { next(e); }
});

export default router;
