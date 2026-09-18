// ── Appearance menu ──────────────────────────────────────────────────────────
// Tiny settings-gear trigger with a Dark / Light ("regular") popover.
// Presentational only — owns open/close state, theme state comes from the layout.

import { useEffect, useRef, useState } from 'react';
import { Check, Moon, Settings, Sun } from 'lucide-react';

const OPTIONS = [
  { value: false, label: 'Light', hint: 'Regular', icon: Sun },
  { value: true, label: 'Dark', hint: 'Noir', icon: Moon },
];

export default function ThemeMenu({ dark, setDark, direction = 'up' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="theme-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Appearance settings"
        onClick={() => setOpen((o) => !o)}
      >
        <Settings className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Choose theme"
          className={`theme-menu-popover ${direction === 'down' ? 'down' : 'up'}`}
        >
          <p className="theme-menu-title">Appearance</p>
          {OPTIONS.map((opt) => {
            const active = dark === opt.value;
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.label}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className="theme-menu-item"
                onClick={() => {
                  setDark(opt.value);
                  setOpen(false);
                }}
              >
                <OptIcon className="h-4 w-4" aria-hidden="true" />
                <span className="flex-1 text-left">
                  {opt.label}
                  <span className="theme-menu-hint">{opt.hint}</span>
                </span>
                {active && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
