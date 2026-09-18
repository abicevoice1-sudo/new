// ─── Member-scoped storage helpers (onboarding profile, deck state) ──────────
const MY_PROFILE_KEY = 'shiarishta_my_profile';

// The onboarding draft is per-member: it follows the signed-in account, not the
// browser. A global key leaks one member's draft into another member's session
// after logout/login on a shared device.
function scopedKey(base) {
  try {
    const raw = localStorage.getItem('sh_session');
    const uid = raw ? JSON.parse(raw)?.uid : null;
    return uid ? `${base}::${uid}` : base;
  } catch {
    return base;
  }
}

export function getMyProfile() {
  try {
    const raw = localStorage.getItem(scopedKey(MY_PROFILE_KEY));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveMyProfile(profile) {
  try {
    localStorage.setItem(scopedKey(MY_PROFILE_KEY), JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

