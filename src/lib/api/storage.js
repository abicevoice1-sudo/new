// ─── Storage adapter — per-member namespaced keys ──────────────────────────
// Swap this file for an HTTP implementation to point the app at a real server.
// Browser keys are `sh_<key>::<uid>` while signed in, so two accounts sharing
// one browser never read each other's interests, messages, tickets or profiles.
// Signed-out callers fall back to the bare `sh_<key>` bucket. Values are JSON.
// Quota failures are silent.
const PREFIX = 'sh_';

function suffix() {
  try {
    const raw = localStorage.getItem('sh_session');
    const uid = raw ? JSON.parse(raw)?.uid : null;
    return uid ? `::${uid}` : '';
  } catch {
    return '';
  }
}

export function read(key, fallback = null) {
  try {
    const namespaced = localStorage.getItem(PREFIX + key + suffix());
    if (namespaced) return JSON.parse(namespaced);
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key + suffix(), JSON.stringify(value));
  } catch {
    /* quota exceeded — non-fatal */
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key + suffix());
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
