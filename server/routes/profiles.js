import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Best-effort auth: attach req.user when a token is present, never 401 here.
router.use((req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  import('jsonwebtoken').then(({ default: jwt }) => {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-only-secret-change-me'); }
    catch { /* treat as signed out */ }
    next();
  }).catch(next);
});

function visibleProfile(row, viewer) {
  if (row.is_blocked) return null;
  if (row.visibility === 'private' && viewer?.uid !== row.user_id) return null;
  const isOwner = viewer?.uid === row.user_id;
  if (row.visibility === 'public' || viewer?.uid || isOwner) {
    const photosLocked = row.photos_visibility === 'private' && !isOwner;
    return {
      id: row.user_id, displayName: row.display_name, age: row.age,
      gender: row.gender, city: row.city, country: row.country, sect: row.sect,
      profession: row.profession, bio: row.bio,
      expectations: row.expectations, aboutFamily: row.about_family, is_verified: row.is_verified,
      visibility: row.visibility, photo: photosLocked ? null : row.photo_url,
    };
  }
  return {
    id: row.user_id, displayName: row.display_name, age: row.age,
    profession: row.profession, is_verified: row.is_verified,
    expectations: row.expectations, aboutFamily: row.about_family,
    visibility: row.visibility, locked: true,
  };
}

// GET /api/profiles?minAge&maxAge&gender&sect&search&verifiedOnly
router.get('/', async (req, res, next) => {
  try {
    const { minAge, maxAge, gender, sect, search, verifiedOnly } = req.query;
    const conds = [`p.is_blocked = FALSE`];
    const params = [];
    if (minAge) { params.push(+minAge); conds.push(`p.age >= $${params.length}`); }
    if (maxAge) { params.push(+maxAge); conds.push(`p.age <= $${params.length}`); }
    if (gender === 'male' || gender === 'female') { params.push(gender); conds.push(`p.gender = $${params.length}`); }
    if (sect && sect !== 'Any sect') { params.push(sect); conds.push(`p.sect = $${params.length}`); }
    if (verifiedOnly === 'true') conds.push(`p.is_verified = TRUE`);
    if (search) { params.push(`%${search}%`); conds.push(`(p.display_name ILIKE $${params.length} OR p.profession ILIKE $${params.length} OR p.city ILIKE $${params.length})`); }
    if (!req.user) conds.push(`p.visibility <> 'private'`);
    else { params.push(req.user.uid); conds.push(`(p.visibility <> 'private' OR p.user_id = $${params.length})`); }
    const { rows } = await pool.query(
      `SELECT p.*, NULL AS photo_url FROM profiles p WHERE ${conds.join(' AND ')} ORDER BY p.created_at DESC LIMIT 100`,
      params,
    );
    res.json(rows.map(r => visibleProfile(r, req.user)).filter(Boolean));
  } catch (e) { next(e); }
});

// GET /api/profiles/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM profiles WHERE user_id = $1`, [req.params.id]);
    const out = rows[0] ? visibleProfile(rows[0], req.user) : null;
    if (!out) return res.status(404).json({ error: 'Profile not found.' });
    res.json(out);
  } catch (e) { next(e); }
});

export default router;
