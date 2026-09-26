import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();
// Contact details are stripped server-side before any message is stored.
const CONTACT_RE = /(\b[\w.+-]+@[\w-]+\.[\w.]+\b)|(\+?\d[\d\s\-().]{7,}\d)|(whatsapp|telegram|signal|instagram|snapchat|facebook)\s*[:@]?\s*[\w.]+/i;

function clean(body) {
  return String(body ?? '').trim().slice(0, 5000);
}

// GET /api/messages — conversations for the signed-in user, newest first.
// Blocked pairs disappear from the list entirely (both directions).
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.user_a, c.user_b, c.created_at,
              (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_at,
              CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END AS other_id,
              (SELECT p.display_name FROM profiles p WHERE p.user_id = CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END) AS other_name
         FROM conversations c
        WHERE (c.user_a = $1 OR c.user_b = $1)
          AND NOT EXISTS (
            SELECT 1 FROM blocks b
             WHERE (b.blocker_id = c.user_a AND b.blocked_id = c.user_b)
                OR (b.blocker_id = c.user_b AND b.blocked_id = c.user_a)
          )
        ORDER BY last_at DESC NULLS LAST, c.created_at DESC`,
      [req.user.uid],
    );
    res.json(rows.map(r => ({
      id: r.id, participantId: r.other_id, participantName: r.other_name || 'Member',
      lastMessage: r.last_message || '', timestamp: r.last_at || r.created_at, unread: false,
    })));
  } catch (e) { next(e); }
});

// GET /api/messages/:id — thread; 403 unless participant, and never readable
// across a block in either direction (a block must cut history, not just sends).
router.get('/:id', async (req, res, next) => {
  try {
    const c = await pool.query(`SELECT * FROM conversations WHERE id = $1`, [req.params.id]);
    if (!c.rowCount) return res.status(404).json({ error: 'Conversation not found.' });
    if (c.rows[0].user_a !== req.user.uid && c.rows[0].user_b !== req.user.uid)
      return res.status(403).json({ error: 'Not your conversation.' });
    const other = c.rows[0].user_a === req.user.uid ? c.rows[0].user_b : c.rows[0].user_a;
    const blocked = await pool.query(
      `SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [req.user.uid, other],
    );
    if (blocked.rowCount) return res.status(403).json({ error: 'This conversation is unavailable.' });
    const { rows } = await pool.query(
      `SELECT id, sender_id AS "senderId", body AS text, created_at AS timestamp
         FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 500`,
      [req.params.id],
    );
    res.json(rows.map(m => ({ ...m, senderId: m.senderId === req.user.uid ? 'me' : 'them' })));
  } catch (e) { next(e); }
});

// POST /api/messages — start (or reuse) a conversation with another user.
// GATE: messaging unlocks only on mutual interest — the nikah-first rule.
// Anyone can express interest; only two-way interest opens a conversation.
router.post('/', async (req, res, next) => {
  try {
    const other = String(req.body?.userId || req.body?.profileId || '');
    if (!other || other === req.user.uid) return res.status(400).json({ error: 'Invalid recipient.' });
    const exists = await pool.query(`SELECT id FROM users WHERE id = $1`, [other]);
    if (!exists.rowCount) return res.status(404).json({ error: 'Member not found.' });
    const blocked = await pool.query(
      `SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [req.user.uid, other],
    );
    if (blocked.rowCount) return res.status(403).json({ error: 'Messaging is unavailable with this member.' });
    const [mine, theirs] = await Promise.all([
      pool.query(`SELECT 1 FROM interests WHERE from_user_id = $1 AND to_user_id = $2`, [req.user.uid, other]),
      pool.query(`SELECT 1 FROM interests WHERE from_user_id = $1 AND to_user_id = $2`, [other, req.user.uid]),
    ]);
    if (!mine.rowCount || !theirs.rowCount) {
      return res.status(403).json({
        error: 'Messaging unlocks when you both express interest. Send interest and wait for theirs.',
        mutualInterest: false,
      });
    }
    const a = req.user.uid < other ? req.user.uid : other;
    const b = req.user.uid < other ? other : req.user.uid;
    const { rows } = await pool.query(
      `INSERT INTO conversations (user_a, user_b) VALUES ($1,$2)
       ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a RETURNING id`,
      [a, b],
    );
    res.status(201).json({ id: rows[0].id });
  } catch (e) { next(e); }
});

// POST /api/messages/:id — send; blocks enforced, contact details stripped
router.post('/:id', async (req, res, next) => {
  try {
    const c = await pool.query(`SELECT * FROM conversations WHERE id = $1`, [req.params.id]);
    if (!c.rowCount) return res.status(404).json({ error: 'Conversation not found.' });
    const conv = c.rows[0];
    if (conv.user_a !== req.user.uid && conv.user_b !== req.user.uid)
      return res.status(403).json({ error: 'Not your conversation.' });
    const other = conv.user_a === req.user.uid ? conv.user_b : conv.user_a;
    const blocked = await pool.query(
      `SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [req.user.uid, other],
    );
    if (blocked.rowCount) return res.status(403).json({ error: 'Messaging is unavailable with this member.' });
    let body = clean(req.body?.text || req.body?.body);
    if (!body) return res.status(400).json({ error: 'Message cannot be empty.' });
    if (CONTACT_RE.test(body)) {
      body = '[Removed: sharing contact details is not allowed before mutual consent. Keep the conversation here.]';
    }
    const { rows } = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1,$2,$3)
       RETURNING id, sender_id AS "senderId", body AS text, created_at AS timestamp`,
      [req.params.id, req.user.uid, body],
    );
    res.status(201).json({ ...rows[0], senderId: 'me' });
  } catch (e) { next(e); }
});

export default router;
