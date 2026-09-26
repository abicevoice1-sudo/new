// ─── End-to-end feature test — real Postgres, real API, real HTTP ────────────
// Spins a throwaway Postgres (embedded-postgres, dev-only dependency), boots
// server/index.js as a child process, then exercises every trust-ladder flow
// over HTTP and asserts on the actual responses.
//
//   node scripts/e2e-features.mjs
import EmbeddedPostgres from 'embedded-postgres';
import pgClient from 'pg';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PG_PORT = 5433;
const API_PORT = 8081;
const BASE = `http://localhost:${API_PORT}`;
const ADMIN_EMAIL = 'admin-e2e@example.com';

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  ok ? pass++ : fail++;
};

let serverLog = '';
let child = null;
let pg = null;

const api = async (method, route, { token, body } = {}) => {
  const res = await fetch(`${BASE}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) { try { data = await res.json(); } catch { /* ignore */ } }
  else data = await res.arrayBuffer();
  return { status: res.status, data, headers: res.headers };
};

// The mail adapter prints links in dev mode; that is how tokens are captured.
const waitForMail = async (pattern, ms = 8000, from = 0) => {
  const started = Date.now();
  while (Date.now() - started < ms) {
    const ms2 = [...serverLog.slice(from).matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'))];
    if (ms2.length) return ms2[0][1]; // first mail after the cursor — deterministic
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`mail link never appeared: ${pattern}`);
};

const waitForHealthy = async (ms = 45000) => {
  const started = Date.now();
  while (Date.now() - started < ms) {
    try {
      const r = await api('GET', '/api/health');
      if (r.status === 200 && r.data?.ok === true) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
};

const register = async (email, displayName) => {
  const r = await api('POST', '/api/auth/register', { body: { email, password: 'SuperSecret123', displayName } });
  if (r.status !== 201) throw new Error(`register failed for ${email}: ${r.status} ${JSON.stringify(r.data)}`);
  return { token: r.data.token, user: r.data.user };
};

const main = async () => {
  // ── 1. Throwaway database ──
  const dataDir = path.join(ROOT, '.pgdata-e2e');
  fs.rmSync(dataDir, { recursive: true, force: true });
  pg = new EmbeddedPostgres({ databaseDir: dataDir, user: 'postgres', password: 'postgres', port: PG_PORT, persistent: false });
  await pg.initialise();
  await pg.start();
  // Production (cPanel) databases are UTF8. Create the test DB the same way —
  // a WIN1252 database cannot store emoji at all, which is a locale problem,
  // not an app problem.
  const pgAdmin = new pgClient.Client({ host: 'localhost', port: PG_PORT, user: 'postgres', password: 'postgres', database: 'postgres' });
  await pgAdmin.connect();
  await pgAdmin.query("CREATE DATABASE shiarishta WITH ENCODING 'UTF8' TEMPLATE template0");
  await pgAdmin.end();
  check('embedded Postgres started', true, `:${PG_PORT} (UTF8 database)`);

  // ── 2. API server as a child process ──
  child = spawn(process.execPath, ['server/index.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(API_PORT),
      DB_HOST: 'localhost', DB_PORT: String(PG_PORT), DB_NAME: 'shiarishta',
      DB_USER: 'postgres', DB_PASSWORD: 'postgres',
      JWT_SECRET: crypto.randomBytes(48).toString('hex'),
      ADMIN_EMAILS: ADMIN_EMAIL,
      CLIENT_URL: 'http://localhost:5173',
      E2E_TEST_MODE: '1',
      SMTP_HOST: '',
      UPLOAD_DIR: path.join(ROOT, '.tmp-uploads-e2e'),
    },
  });
  child.stdout.on('data', (d) => { serverLog += d.toString(); });
  child.stderr.on('data', (d) => { serverLog += d.toString(); });

  const healthy = await waitForHealthy();
  check('server boots and migrates against real Postgres', healthy, healthy ? 'health ok:true' : serverLog.slice(-400));
  if (!healthy) return;

  // ── 3. Registration + email verification (Zoya condition #1) ──
  const mailMark = serverLog.length; // only mail printed after this point counts
  const a = await register('a-e2e@example.com', 'Aisha E2E');
  const b = await register('b-e2e@example.com', 'Bilal E2E');
  const admin = await register(ADMIN_EMAIL, 'Admin E2E');
  check('register returns a session with emailVerified:false', a.user.emailVerified === false, JSON.stringify(a.user.emailVerified));
  check('admin email gets isAdmin:true from ADMIN_EMAILS', admin.user.isAdmin === true);

  const verifyToken = await waitForMail(/verify-email\?token=([a-f0-9]{64})/, 8000, mailMark);
  const verified = await api('GET', `/api/auth/verify-email?token=${verifyToken}`);
  check('email verification link activates the account', verified.status === 200 && verified.data.emailVerified === true, JSON.stringify(verified.data));
  const reused = await api('GET', `/api/auth/verify-email?token=${verifyToken}`);
  check('verification token is single-use', reused.status === 400, `${reused.status}`);

  const relogin = await api('POST', '/api/auth/login', { body: { email: 'a-e2e@example.com', password: 'SuperSecret123' } });
  check('login now reports emailVerified:true', relogin.data?.user?.emailVerified === true, JSON.stringify(relogin.data?.user?.emailVerified));

  // ── 4. Password reset (Zoya condition #2) ──
  const forgot = await api('POST', '/api/auth/forgot', { body: { email: 'a-e2e@example.com' } });
  check('forgot always returns the same shape (no account enumeration)', forgot.status === 200 && !!forgot.data.ok);
  const unknown = await api('POST', '/api/auth/forgot', { body: { email: 'nobody-here@example.com' } });
  check('forgot for an unknown email is indistinguishable', unknown.status === forgot.status && !!unknown.data.ok);
  const resetToken = await waitForMail(/auth\/reset\?token=([a-f0-9]{64})/);
  const weak = await api('POST', '/api/auth/reset', { body: { token: resetToken, password: 'short' } });
  check('reset rejects a password under 8 chars', weak.status === 400, `${weak.status}`);
  const reset = await api('POST', '/api/auth/reset', { body: { token: resetToken, password: 'BrandNewSecret456' } });
  check('reset accepts a valid token + strong password', reset.status === 200, JSON.stringify(reset.data));
  const oldPw = await api('POST', '/api/auth/login', { body: { email: 'a-e2e@example.com', password: 'SuperSecret123' } });
  const newPw = await api('POST', '/api/auth/login', { body: { email: 'a-e2e@example.com', password: 'BrandNewSecret456' } });
  check('old password stops working after reset', oldPw.status === 401, `${oldPw.status}`);
  check('new password works after reset', newPw.status === 200, `${newPw.status}`);
  const replay = await api('POST', '/api/auth/reset', { body: { token: resetToken, password: 'AnotherSecret789' } });
  check('reset token is single-use', replay.status === 400, `${replay.status}`);
  a.token = newPw.data.token;

  // ── 5. Interest-gated messaging (Zoya condition #4) ──
  const blockedMsg = await api('POST', '/api/messages', { token: a.token, body: { userId: b.user.uid } });
  check('messaging is blocked before mutual interest', blockedMsg.status === 403 && blockedMsg.data.mutualInterest === false, JSON.stringify(blockedMsg.data));
  await api('POST', `/api/profiles/${b.user.uid}/interest`, { token: a.token, body: {} });
  const oneWay = await api('POST', '/api/messages', { token: a.token, body: { userId: b.user.uid } });
  check('one-way interest still does not open messaging', oneWay.status === 403, `${oneWay.status}`);
  await api('POST', `/api/profiles/${a.user.uid}/interest`, { token: b.token, body: {} });
  const conv = await api('POST', '/api/messages', { token: a.token, body: { userId: b.user.uid } });
  check('mutual interest opens the conversation', conv.status === 201 && !!conv.data.id, JSON.stringify(conv.data));
  const cid = conv.data.id;

  const clean = await api('POST', `/api/messages/${cid}`, { token: a.token, body: { text: 'Assalamu Alaikum, my number is +91 98765 43210 and email me at aisha@example.com' } });
  check('contact details are stripped before storage', typeof clean.data?.text === 'string' && clean.data.text.includes('[Removed'), String(clean.data?.text).slice(0, 60));
  const normal = await api('POST', `/api/messages/${cid}`, { token: a.token, body: { text: 'My wali would like to speak with your family this week, in sha Allah.' } });
  check('ordinary messages are stored untouched', normal.data?.text?.includes('wali') === true, String(normal.data?.text).slice(0, 50));
  const outsider = await api('GET', `/api/messages/${cid}`, { token: (await register('c-e2e@example.com', 'Outsider')).token });
  check('a non-participant cannot read the thread', outsider.status === 403, `${outsider.status}`);

  // ── 6. Verification pipeline with human review (Zoya condition #3) ──
  const tinyJpeg = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
  const submit = await api('POST', '/api/verifications', { token: a.token, body: { kind: 'selfie', imageBase64: tinyJpeg } });
  check('member can submit a verification photo', submit.status === 201 && submit.data.verification.status === 'pending', JSON.stringify(submit.data?.verification?.status));
  const badKind = await api('POST', '/api/verifications', { token: a.token, body: { kind: 'passport_scan', imageBase64: tinyJpeg } });
  check('only the two documented submission kinds are accepted', badKind.status === 400, `${badKind.status}`);
  const mine = await api('GET', '/api/verifications/mine', { token: a.token });
  check('member sees their own submission list', Array.isArray(mine.data) && mine.data.length === 1, `count=${mine.data?.length}`);
  const notAdmin = await api('GET', '/api/admin/verifications?status=pending', { token: a.token });
  check('a normal member cannot reach the admin queue', notAdmin.status === 403, `${notAdmin.status}`);
  const queue = await api('GET', '/api/admin/verifications?status=pending', { token: admin.token });
  check('admin sees the pending submission', queue.status === 200 && queue.data.length === 1, `count=${queue.data?.length}`);
  const vid = queue.data[0].id;
  const fileNoAuth = await api('GET', `/api/admin/verifications/${vid}/file`, {});
  check('verification photo bytes require admin auth', fileNoAuth.status === 401, `${fileNoAuth.status}`);
  const file = await api('GET', `/api/admin/verifications/${vid}/file`, { token: admin.token });
  check('admin can view the submitted photo', file.status === 200 && file.data?.byteLength > 0, `bytes=${file.data?.byteLength}`);
  const beforeApprove = await api('GET', `/api/profiles/${a.user.uid}`, { token: a.token });
  check('member is NOT verified before review', beforeApprove.data?.is_verified === false, `${beforeApprove.data?.is_verified}`);
  const approve = await api('POST', `/api/admin/verifications/${vid}/approve`, { token: admin.token, body: {} });
  check('admin approval succeeds', approve.status === 200 && approve.data.verified === true, JSON.stringify(approve.data));
  const afterApprove = await api('GET', `/api/profiles/${a.user.uid}`, { token: a.token });
  check('approval flips the public verified badge', afterApprove.data?.is_verified === true, `${afterApprove.data?.is_verified}`);
  const doubleApprove = await api('POST', `/api/admin/verifications/${vid}/approve`, { token: admin.token, body: {} });
  check('a reviewed submission cannot be re-reviewed', doubleApprove.status === 404, `${doubleApprove.status}`);

  // ── 7. Wali companion link (trust-ladder step 5) ──
  const link = await api('POST', '/api/wali/link', { token: a.token, body: {} });
  check('member can create a wali link', link.status === 201 && typeof link.data.url === 'string', link.data?.url?.slice(-12));
  const waliToken = link.data.url.split('/wali/')[1];
  const publicView = await api('GET', `/api/wali/${waliToken}`, {});
  check('wali link opens without an account', publicView.status === 200 && publicView.data.readOnly === true, `${publicView.status}`);
  check('wali view shows the member profile', publicView.data?.member?.displayName === 'Aisha E2E', publicView.data?.member?.displayName);
  check('wali view never exposes the email', !JSON.stringify(publicView.data).includes('a-e2e@example.com'), 'no email leak');
  const revoke = await api('DELETE', `/api/wali/link/${waliToken}`, { token: a.token });
  check('member can revoke the wali link', revoke.status === 200, `${revoke.status}`);
  const revoked = await api('GET', `/api/wali/${waliToken}`, {});
  check('revoked wali link stops working', revoked.status === 404, `${revoked.status}`);

  // ── 10. Introductions: verified matchmaker drafts, woman claims, scopes hold
  const promoter = await register('mm-e2e@example.com', 'Fatima Matchmaker');
  const dadbod = await register('gd-e2e@example.com', 'Ustadh Guardian');
  await api('POST', `/api/admin/users/${promoter.user.uid}/role`, { token: admin.token, body: { role: 'matchmaker' } });
  await api('POST', `/api/admin/users/${dadbod.user.uid}/role`, { token: admin.token, body: { role: 'guardian' } });

  const caps = await api('GET', '/api/drafts/capabilities', { token: promoter.token });
  check('matchmaker capabilities report a female-only scope', caps.data?.canDraft === true && String(caps.data?.draftGenderScope) === 'female', JSON.stringify(caps.data?.draftGenderScope));

  const noRole = await api('POST', '/api/drafts', { token: a.token, body: { gender: 'female', displayName: 'X', contactEmail: 'x@example.com', consentAttested: true } });
  check('a plain member cannot create drafts', noRole.status === 403, `${noRole.status}`);
  const boyAttempt = await api('POST', '/api/drafts', { token: promoter.token, body: { gender: 'male', displayName: 'Y', contactEmail: 'y@example.com', consentAttested: true } });
  check('a matchmaker cannot draft a male profile', boyAttempt.status === 403, `${boyAttempt.status}`);
  const noAttest = await api('POST', '/api/drafts', { token: promoter.token, body: { gender: 'female', displayName: 'Z', contactEmail: 'z@example.com', consentAttested: false } });
  check('a draft without attestation is refused', noAttest.status === 400, `${noAttest.status}`);

  const draft = await api('POST', '/api/drafts', {
    token: promoter.token,
    body: {
      gender: 'female', displayName: 'Zoya Draft', age: 24, city: 'Hyderabad', country: 'India',
      sect: 'Ithna Ashari', profession: 'Doctor',
      bio: 'About me: quiet, studious, family-first.',
      expectations: 'About expectations: practising, kind, educated.',
      aboutFamily: 'Sayed family, parents supportive.',
      contactEmail: 'zoya-claim@example.com', contactPhone: '+91 90000 00000',
      consentAttested: true,
    },
  });
  check('matchmaker creates a private draft with share links', draft.status === 201 && !!draft.data.shareUrl && !!draft.data.whatsappUrl && !!draft.data.draft.shortCode, draft.data?.draft?.shortCode);
  const draftToken = draft.data.shareUrl.split('/claim/')[1];
  check('draft hands back quota counts', typeof draft.data?.quota?.open === 'number' && typeof draft.data?.quota?.limit === 'number', JSON.stringify(draft.data?.quota));

  const sent = await api('POST', `/api/drafts/${draft.data.draft.id}/send`, { token: promoter.token, body: {} });
  check('dual delivery email sends with expiry', sent.status === 200 && !!sent.data.sentTo, sent.data?.sentTo);

  // The draft is NEVER a profile: it must be invisible in browse + direct fetch.
  const browse = await api('GET', '/api/profiles', { token: promoter.token });
  check('unclaimed drafts never appear in member search', Array.isArray(browse.data) && !browse.data.some((p) => p.displayName === 'Zoya Draft'), `count=${browse.data?.length}`);
  const noLeak = await api('GET', `/api/profiles/${draft.data.draft.id}`, { token: promoter.token });
  check('draft id is not fetchable as a profile', noLeak.status === 404, `${noLeak.status}`);

  const preview = await api('GET', `/api/drafts/claim/${draftToken}`, {});
  check('claim preview opens without an account', preview.status === 200, `${preview.status}`);
  check('preview carries bio + expectations for her review', preview.data?.draft?.bio?.includes('quiet') === true && preview.data?.draft?.expectations?.includes('practising') === true, 'bio+expectations present');
  check('preview never exposes her email or phone', !JSON.stringify(preview.data).includes('zoya-claim@example.com') && !JSON.stringify(preview.data).includes('90000'), 'no contact leak');

  const wrongEmail = await api('POST', `/api/drafts/claim/${draftToken}`, { body: { email: 'someone-else@example.com', password: 'ClaimSecret123' } });
  check('claim requires the invited email', wrongEmail.status === 400, `${wrongEmail.status}`);
  const claimed = await api('POST', `/api/drafts/claim/${draftToken}`, { body: { email: 'zoya-claim@example.com', password: 'ClaimSecret123', displayName: 'Zoya Claimed' } });
  check('fresh account claims the draft and gets signed in', claimed.status === 201 && claimed.data?.token && claimed.data?.user?.emailVerified === false, JSON.stringify(claimed.data?.user?.emailVerified));
  const zoya = claimed.data;
  const replayClaim = await api('POST', `/api/drafts/claim/${draftToken}`, { body: { email: 'zoya-claim@example.com', password: 'AnotherSecret789' } });
  check('claim token dies after one use', replayClaim.status === 404, `${replayClaim.status}`);

  const herProfile = await api('GET', `/api/profiles/${zoya.user.uid}`, { token: zoya.token });
  check('claim seeds a real profile she owns', herProfile.data?.displayName === 'Zoya Claimed' && herProfile.data?.bio?.includes('quiet') === true && herProfile.data?.expectations?.includes('practising') === true, herProfile.data?.displayName);

  const gdDraft = await api('POST', '/api/drafts', {
    token: dadbod.token,
    body: {
      gender: 'male', displayName: 'Ali Son', age: 27, contactEmail: 'ali-son@example.com',
      relationship: 'son', consentAttested: true,
    },
  });
  check('a guardian can draft a son’s profile', gdDraft.status === 201, `${gdDraft.status}`);
  const gdNoRel = await api('POST', '/api/drafts', {
    token: dadbod.token,
    body: { gender: 'male', displayName: 'No Rel', contactEmail: 'norel@example.com', consentAttested: true },
  });
  check('guardian drafts require the stated relationship', gdNoRel.status === 400, `${gdNoRel.status}`);

  const quick = await api('POST', '/api/drafts', {
    token: dadbod.token,
    body: { gender: 'female', displayName: 'Quick Decline', contactEmail: 'decline@example.com', relationship: 'sister', consentAttested: true },
  });
  if (quick.status !== 201) console.log('QUICK DRAFT RESPONSE:', quick.status, JSON.stringify(quick.data));
  const quickToken = quick.data.shareUrl.split('/claim/')[1];
  const decline = await api('POST', `/api/drafts/claim/${quickToken}/decline`, {});
  check('a subject can decline with no account and erase her data', decline.status === 200 && decline.data.ok === true, JSON.stringify(decline.data?.ok));
  const afterDecline = await api('GET', `/api/drafts/claim/${quickToken}`, {});
  check('a declined link is dead', afterDecline.status === 404 || afterDecline.status === 410, `${afterDecline.status}`);

  const resendMark = serverLog.length; // isolate Zoya's fresh mail from older ones
  const reverify = await api('POST', '/api/auth/resend-verification', { token: zoya.token });
  if (reverify.status !== 200) console.log('RESEND RESPONSE:', reverify.status, JSON.stringify(reverify.data));
  check('claimed accounts can request a fresh verification email', reverify.status === 200 && !!reverify.data.ok, JSON.stringify(reverify.data?.ok));
  const freshVerify = await waitForMail(/verify-email\?token=([a-f0-9]{64})/, 8000, resendMark);
  const freshOk = await api('GET', `/api/auth/verify-email?token=${freshVerify}`);
  check('resent verification link works', freshOk.status === 200 && freshOk.data.emailVerified === true, `${freshOk.status}`);


  // ── 8. Privacy + block still enforced end to end ──
  const setPrivate = await api('PUT', '/api/profiles/me', { token: b.token, body: { visibility: 'private', photos_visibility: 'private' } });
  check('member can set a private profile', setPrivate.status === 200, `${setPrivate.status}`);
  const hidden = await api('GET', `/api/profiles/${b.user.uid}`, { token: a.token });
  check('a private profile is hidden from other members', hidden.status === 404, `${hidden.status}`);
  await api('POST', '/api/reports/block', { token: a.token, body: { userId: b.user.uid } });
  const afterBlock = await api('GET', `/api/messages/${cid}`, { token: a.token });
  check('blocking cuts the existing conversation both ways', afterBlock.status === 403, `${afterBlock.status}`);

  // ── 9. PWA + shell assets are actually shipped ──
  check('manifest.webmanifest exists in build output', fs.existsSync(path.join(ROOT, 'public', 'manifest.webmanifest')));
  check('service worker exists and never caches /api', (() => {
    const sw = fs.readFileSync(path.join(ROOT, 'public', 'sw.js'), 'utf8');
    return sw.includes("pathname.startsWith('/api/')");
  })());
};

main()
  .catch((e) => { console.error('\nE2E CRASHED:', e.message); fail++; })
  .finally(async () => {
    if (child) child.kill();
    if (pg) { try { await pg.stop(); } catch { /* ignore */ } }
    fs.rmSync(path.join(ROOT, '.tmp-uploads-e2e'), { recursive: true, force: true });
    fs.rmSync(path.join(ROOT, '.pgdata-e2e'), { recursive: true, force: true });
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exitCode = fail === 0 ? 0 : 1;
  });
