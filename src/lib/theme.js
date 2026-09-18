// ─── Theme — single source of truth for dark/light ──────────────────────────
// Versioned key: a stale `dark` from an older build can never resurrect.
// Settings Appearance writes through these helpers; layouts only read them.
const THEME_KEY = 'shiarishta_theme_v1';

export function readIsDark() {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'dark') return true;
    if (raw === 'light') return false;
  } catch { /* private mode — fall through to light default */ }
  return false;
}

export function writeIsDark(dark) {
  try {
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  } catch { /* quota/private mode — non-fatal */ }
}

export function applyIsDark(dark) {
  try {
    document.documentElement.classList.toggle('dark', dark === true);
    document.body.style.backgroundColor =
      dark === true ? 'var(--color-canvas)' : '';
  } catch { /* SSR — ignore */ }
}
