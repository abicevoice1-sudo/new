// ─── Introductions — matchmaker & guardian drafts, claim links ──────────────
// Server-only by design: a draft is a private, consent-backed invitation that
// only the real backend can hold (tokens, quota, attestation, audit). In demo
// mode every call returns an honest "backend required" error instead of
// pretending — the same rule as password reset.
import { http, useRemote } from './transport';

const needRemote = () => {
  if (!useRemote) throw new Error('Introductions need the live platform — set VITE_API_URL.');
};

export const introductions = {
  // What this signed-in member may do (drives the UI; server enforces anyway).
  async capabilities() {
    needRemote();
    return http.get('/api/drafts/capabilities');
  },

  // Create a private draft. Returns { draft, shareUrl, whatsappUrl, quota }.
  async create(payload) {
    needRemote();
    return http.post('/api/drafts', payload);
  },

  // My drafts with status + fresh share URLs for unclaimed ones.
  async mine() {
    needRemote();
    return http.get('/api/drafts/mine');
  },

  // Platform email delivery of the invitation (WhatsApp is the matchmaker's own copy-paste).
  async sendInvite(id) {
    needRemote();
    return http.post(`/api/drafts/${encodeURIComponent(id)}/send`, {});
  },

  // One-tap extension for busy people (fresh window from today).
  async extend(id) {
    needRemote();
    return http.post(`/api/drafts/${encodeURIComponent(id)}/extend`, {});
  },

  // Creator withdraws an unresolved draft — personal fields are scrubbed.
  async withdraw(id) {
    needRemote();
    return http.del(`/api/drafts/${encodeURIComponent(id)}`);
  },

  // ── Public claim surface (no account needed; the token is the credential) ──
  async preview(token) {
    needRemote();
    return http.get(`/api/drafts/claim/${encodeURIComponent(token)}`);
  },
  async claim(token, { email, password, displayName }) {
    needRemote();
    return http.post(`/api/drafts/claim/${encodeURIComponent(token)}`, { email, password, displayName });
  },
  async decline(token) {
    needRemote();
    return http.post(`/api/drafts/claim/${encodeURIComponent(token)}/decline`, {});
  },

  // Manual entry when the link is lost: short code → fresh claim URL.
  async lookupShortCode(code) {
    needRemote();
    return http.get(`/api/drafts/by-short-code/${encodeURIComponent(code.trim().toUpperCase())}`);
  },
};

export default introductions;
