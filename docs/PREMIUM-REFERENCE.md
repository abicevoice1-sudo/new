# Premium Design Reference — "Heirloom"

> Extracted from the flagship reference project at `../` (Next.js app, `styles/globals.css`).
> This is the design language now powering the app's **default (light) theme**.
> The dark theme ("Noir" — deep slate + emerald) remains available via the theme toggle.

## 1. Color Palette (exact reference values)

| Token | Hex | Reference var | Role |
|---|---|---|---|
| `--bg` | `#fffaf4` | `--paper` | Cream canvas — the entire page breathes on this |
| `--bg-surface` | `#fffdf8` | — | Panels between canvas and cards |
| `--bg-elevated` | `#ffffff` | card `#fff` | Raised cards: pure white on cream = crisp hierarchy |
| `--bg-hover` | `#f7ecdf` | — | Warm hover |
| `--bg-inverse` | `#211b17` | `--charcoal` | Charcoal — solid buttons, always-dark fog |
| `--border` | `#eadfd4` | `--line` | **Sand hairline — the signature.** Solid, warm, never gray |
| `--text` | `#17130f` | `--ink` | Charcoal-brown ink, not black |
| `--text-secondary` | `#5c5348` | between | Body secondary |
| `--text-tertiary` | `#746c63` | `--muted` | Muted captions |
| `--primary` | `#416b5b` | `--sage` | Sage green — calm, organic brand core |
| `--primary-hover` | `#21483b` | `--sage-dark` | Deep forest sage |
| `--primary-subtle` | `#e5f0e8` | `--mint` | Mint tint fills |
| `--accent` / `--gold` | `#b98334` | `--gold` | Burnished gold — eyebrows, dots, links |
| `--rose` | `#f3d8d2` | `--rose` | Soft rose (top wash, accents) |
| `--cream` | `#fff6ea` | `--cream` | Warm fill |

### Signature gradient
```
--gradient-cta: linear-gradient(135deg, #1a1714 0%, #2c433e 52%, #b98334 100%);
```
Charcoal → deep sage → gold, with a white-glass sheen overlay (`.btn-gradient-cta`).
Used on the reference's header CTA — the single most "premium" element on screen.

## 2. Typography

- **Display:** `Cormorant Garamond` (serif) — high-contrast, editorial. Now the
  display font of the light theme (dark keeps `Fraunces`).
- **Body/UI:** `Manrope` in the reference; we keep `Inter` (same spirit, already loaded).
- **Hero scale (reference):** `clamp(3.6rem, 9vw, 7.4rem)`, `line-height: 0.9` — *huge*.
- **Section scale:** `clamp(2rem, 4vw, 3.4rem)`, `line-height: 1.05`.
- **Eyebrow pattern:** gold, `0.78rem`, `font-weight: 800`, uppercase, 12px bottom margin.
  Every section starts with it → instant editorial rhythm.

## 3. Layout Patterns (the premium "moves")

1. **Glass sticky header** — `rgba(255,250,244,0.88)` + `backdrop-filter: blur(18px)`,
   sand hairline bottom border, 3-column grid.
2. **Pill navigation** — nav links live in a white translucent capsule
   (`border-radius: 999px`, 4px padding); active/hover link fills charcoal with white text.
   Segmented-control feel = instantly premium.
3. **Gradient CTA pill** — header CTA uses the signature gradient + white hairline border
   + `0 16px 34px` shadow + diagonal glass sheen (`::before`).
4. **Editorial hero** — 2-col grid `minmax(0,0.92fr) / minmax(320px,1.08fr)`,
   full viewport height (`calc(100vh - 86px)`), eyebrow → giant serif headline →
   lede (`max-width: 650px`, 1.65 line-height) → actions → trust chips.
5. **Trust chips** — small pills: `rgba(255,255,255,0.78)` bg, sand border, radius 8,
   muted bold 0.92rem. Perfect social-proof row.
6. **4:5 hero visual** — `aspect-ratio: 4/5`, radius 8, `var(--shadow)` (22px 70px!),
   optional **floating glass card** anchored bottom-left (`rgba(255,255,255,0.94)`,
   gold status dot) — depth without clutter.
7. **Card language** — white bg, 1px sand border, radius 18,
   `0 18px 54px rgba(33,27,23,0.11)` shadow, 180ms hover lift.
8. **Shadows are warm** — always tinted with `rgba(33,27,23,…)` (charcoal-brown),
   never pure black. This is half the "expensive" feel.
9. **Rose top-wash** — body gradient `rgba(243,216,210,0.26) → transparent` over 420px.
   Soft sunrise warmth behind everything. (Ported into `.light body/.app-layout/.app-content`.)
10. **Generous gutters** — section padding `clamp(18px, 5vw, 72px)` horizontal,
    `clamp(34px, 6vw, 72px)` vertical.

## 4. Where it lives in this codebase

| Concern | File |
|---|---|
| Light theme tokens (exact values) | `src/styles/globals.css` → `.light` block |
| Body wash + gradient CTA utility | `src/styles/globals.css` → `.light body…`, `.light .btn-gradient-cta` |
| Display serif (light) | `.light { --font-display: 'Cormorant Garamond', … }` |
| Token mirror for tooling | `src/designTokens.js` |
| Theme default + versioned storage key | `MainLayout.jsx`, `LandingLayout.jsx` → `shiarishta_theme:v2` |
| Font loading | `index.html` (Cormorant Garamond 400–700 added) |

## 5. Dark theme ("Noir") — unchanged

`:root` still defines the deep-slate palette (`#0b0f17`, emerald `#10b981`, gold `#d4af69`).
Users who toggle dark keep the exact previous experience.
