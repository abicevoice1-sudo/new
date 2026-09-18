// ── Per-step validation ──────────────────────────────────────────────────────
// Pure functions, fully unit-testable. When the schema grows complex enough to
// warrant it, this module is the seam where zod/valibot gets introduced —
// call sites never change.

import type { DraftField, OnboardingErrors, ProfileDraft, StepId } from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Validator = (d: ProfileDraft) => OnboardingErrors;

const stepValidators: Record<StepId, Validator> = {
  1: (d) => {
    const e: OnboardingErrors = {};
    if (d.displayName.trim().length < 2) e.displayName = 'Please enter your display name (min 2 characters).';
    if (!d.gender) e.gender = 'Please select how you identify.';
    if (!d.seekingGender) e.seekingGender = 'Please select who you are looking for.';
    const age = Number.parseInt(d.age, 10);
    if (!d.age || Number.isNaN(age) || age < 18 || age > 100) e.age = 'Age must be between 18 and 100.';
    if (!d.city.trim()) e.city = 'City is required.';
    if (!d.country) e.country = 'Country is required.';
    return e;
  },
  2: (d) => {
    const e: OnboardingErrors = {};
    if (!d.sect) e.sect = 'Please select your sect / community.';
    if (!d.religiosity) e.religiosity = 'Please select your religiosity level.';
    if (!d.prayer) e.prayer = 'Please select your prayer practice.';
    return e;
  },
  3: (d) => {
    const e: OnboardingErrors = {};
    if (!d.ethnicity) e.ethnicity = 'Please select your ethnicity / heritage.';
    if (d.languages.length === 0) e.languages = 'Select at least one language you speak.';
    return e;
  },
  4: (d) => {
    const e: OnboardingErrors = {};
    if (!d.educationLevel) e.educationLevel = 'Please select your education level.';
    if (!d.profession.trim()) e.profession = 'Profession is required.';
    return e;
  },
  5: (d) => {
    const e: OnboardingErrors = {};
    if (!d.timeline) e.timeline = 'Please select your nikah timeline.';
    if (!d.familyInvolvement) e.familyInvolvement = 'Please select your family involvement preference.';
    return e;
  },
  6: (d) => {
    const e: OnboardingErrors = {};
    if (!d.managementMode) e.managementMode = 'Please choose who manages this profile.';
    if (d.managementMode === 'guardian') {
      if (!d.guardianName.trim()) e.guardianName = 'Guardian name is required.';
      if (!EMAIL_RE.test(d.guardianEmail.trim())) e.guardianEmail = 'A valid guardian email is required.';
    }
    return e;
  },
  7: () => ({}), // story is optional
};

export function validateStep(step: StepId, data: ProfileDraft): OnboardingErrors {
  return stepValidators[step]?.(data) ?? {};
}

export function hasErrors(errors: OnboardingErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function clearError(errors: OnboardingErrors, field: DraftField): OnboardingErrors {
  if (!errors[field]) return errors; // avoid identity churn on every keystroke
  return { ...errors, [field]: undefined };
}
