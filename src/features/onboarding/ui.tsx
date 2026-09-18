// ── Onboarding form primitives ───────────────────────────────────────────────
// Accessible, memoized, data-driven. Used by every step — zero duplication.

import { memo, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

interface FieldProps {
  label: string;
  required?: boolean | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
}

export const Field = memo(function Field({ label, required, error, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1 text-sm font-semibold text-ink">
        {label}
        {required && <span aria-hidden="true" className="text-danger">*</span>}
      </span>
      {children}
      {error ? (
        <span role="alert" className="mt-1.5 block text-xs font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
});

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const TextInput = memo(function TextInput({ invalid, className, ...rest }: TextInputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-ink bg-elevated placeholder:text-muted/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        invalid ? 'border-danger/60' : 'border-line/30 hover:border-line/50 focus:border-primary/50'
      } ${className ?? ''}`}
      {...rest}
    />
  );
});

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: readonly string[];
  placeholder?: string;
  invalid?: boolean;
}

export const SelectInput = memo(function SelectInput({ options, placeholder, invalid, ...rest }: SelectInputProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-ink bg-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        invalid ? 'border-danger/60' : 'border-line/30 hover:border-line/50 focus:border-primary/50'
      }`}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
});

interface OptionCardsProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  ariaLabel: string;
}

export const OptionCards = memo(function OptionCards({ value, onChange, options, ariaLabel }: OptionCardsProps) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
              active
                ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                : 'border-line/20 bg-elevated text-ink hover:border-line/50'
            }`}
          >
            {active && <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
});

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  desc?: string | undefined;
}

export const Toggle = memo(function Toggle({ checked, onChange, label, desc }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-line/20 bg-elevated p-4 text-left transition-all hover:border-line/40"
    >
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {desc && <span className="mt-0.5 block text-xs text-muted">{desc}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`relative flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-line/40'}`}
      >
        <span
          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(1.25rem)' : 'translateX(0)' }}
        />
      </span>
    </button>
  );
});
