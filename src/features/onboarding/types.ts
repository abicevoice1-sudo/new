// ── Onboarding domain model ──────────────────────────────────────────────────
// Single source of truth for the draft shape. Everything downstream (validation,
// persistence, publish) is derived from these types — no stringly-typed fields.

export type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ProfileDraft {
  // Step 1 — About you
  displayName: string;
  gender: string;
  seekingGender: string;
  age: string; // string in the form, coerced on publish
  city: string;
  country: string;
  height: string;
  maritalStatus: string;
  // Step 2 — Faith & practice
  sect: string;
  religiosity: string;
  prayer: string;
  marja: string;
  modesty: string;
  diet: string;
  // Step 3 — Background & lineage
  syedStatus: string;
  ethnicity: string;
  languages: string[];
  citizenships: string[];
  // Step 4 — Education & career
  educationLevel: string;
  profession: string;
  incomeRange: string;
  // Step 5 — Marriage intentions
  timeline: string;
  relocation: string;
  familyInvolvement: string;
  childrenStatus: string;
  childrenPlans: string;
  // Step 6 — Privacy & photos
  photoAccess: string;
  profileVisibility: string;
  incognito: boolean;
  managementMode: string;
  guardianName: string;
  guardianEmail: string;
  // Step 7 — Story
  bio: string;
  lookingFor: string;
}

export type DraftField = keyof ProfileDraft;
export type OnboardingErrors = Partial<Record<DraftField, string>>;

export interface PublishedProfile extends Omit<ProfileDraft, 'age'> {
  age: number;
  uid: string;
  completeness: number;
  publishedAt: string;
}

export const EMPTY_DRAFT: ProfileDraft = {
  displayName: '',
  gender: '',
  seekingGender: '',
  age: '',
  city: '',
  country: '',
  height: '',
  maritalStatus: '',
  sect: '',
  religiosity: '',
  prayer: '',
  marja: '',
  modesty: '',
  diet: '',
  syedStatus: '',
  ethnicity: '',
  languages: [],
  citizenships: [],
  educationLevel: '',
  profession: '',
  incomeRange: '',
  timeline: '',
  relocation: '',
  familyInvolvement: '',
  childrenStatus: '',
  childrenPlans: '',
  photoAccess: 'match',
  profileVisibility: 'public',
  incognito: false,
  managementMode: '',
  guardianName: '',
  guardianEmail: '',
  bio: '',
  lookingFor: '',
};
