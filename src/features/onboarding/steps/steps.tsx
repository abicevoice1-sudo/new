// ── Wizard steps ─────────────────────────────────────────────────────────────
// Each step is a pure presentational component: it receives draft data and
// change handlers and owns zero business logic. Steps can be tested and
// reordered without touching the wizard shell.

import { memo } from 'react';
import type { ComponentType } from 'react';
import { Check, Globe, KeyRound, Lock, Shield, UserRound } from 'lucide-react';
import type { DraftField, OnboardingErrors, ProfileDraft } from '../types';
import {
  SECTS, MARJA_OPTIONS, RELIGIOSITY_LEVELS, PRAYER_OPTIONS,
  MODESTY_OPTIONS_FEMALE, MODESTY_OPTIONS_MALE, DIET_OPTIONS, SYED_OPTIONS,
  MARITAL_STATUS_OPTIONS, TIMELINE_OPTIONS, RELOCATION_OPTIONS,
  FAMILY_INVOLVEMENT_OPTIONS, CHILDREN_OPTIONS, CHILDREN_PLANS_OPTIONS,
  PHOTO_ACCESS_OPTIONS, PROFILE_VISIBILITY_OPTIONS, MANAGEMENT_MODES,
  EDUCATION_OPTIONS, LANGUAGES, ETHNICITIES, COUNTRIES, HEIGHT_OPTIONS,
} from '../../../lib/onboardingData';
import { Field, OptionCards, SelectInput, TextInput, Toggle } from '../ui';

export interface StepProps {
  data: ProfileDraft;
  errors: OnboardingErrors;
  update: (field: DraftField, value: ProfileDraft[DraftField]) => void;
  toggleIn: (field: 'languages' | 'citizenships', value: string) => void;
}

interface LabeledOption {
  value: string;
  label: string;
  desc?: string;
}

// Radio-card group for options that carry a { value, label, desc? } shape.
const ChoiceCards = memo(function ChoiceCards({
  value, onChange, options, ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly LabeledOption[];
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid gap-2.5">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
              active
                ? 'border-primary bg-primary/5 text-primary shadow-[0_0_0_4px_var(--primary-subtle)]'
                : 'border-line/20 bg-elevated text-ink hover:border-line/50'
            }`}
          >
            <span className="flex-1">
              <span className="block text-sm font-semibold">{opt.label}</span>
              {opt.desc && <span className="mt-0.5 block text-xs text-muted">{opt.desc}</span>}
            </span>
            {active && <Check className="h-5 w-5 flex-shrink-0" strokeWidth={3} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
});

const GENDER_OPTIONS = ['Male', 'Female'] as const;

export const StepAbout = memo(function StepAbout({ data, errors, update }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Display name" required error={errors.displayName}>
          <TextInput
            value={data.displayName}
            onChange={(e) => update('displayName', e.target.value)}
            placeholder="How should members address you?"
            invalid={!!errors.displayName}
            autoComplete="nickname"
          />
        </Field>
        <Field label="Age" required error={errors.age}>
          <TextInput
            type="number"
            inputMode="numeric"
            min={18}
            max={100}
            value={data.age}
            onChange={(e) => update('age', e.target.value)}
            placeholder="e.g. 27"
            invalid={!!errors.age}
          />
        </Field>
        <Field label="I identify as" required error={errors.gender}>
          <OptionCards
            ariaLabel="How you identify"
            value={data.gender}
            onChange={(v) => update('gender', v)}
            options={GENDER_OPTIONS}
          />
        </Field>
        <Field label="Looking for" required error={errors.seekingGender}>
          <OptionCards
            ariaLabel="Who you are looking for"
            value={data.seekingGender}
            onChange={(v) => update('seekingGender', v)}
            options={GENDER_OPTIONS}
          />
        </Field>
        <Field label="City" required error={errors.city}>
          <TextInput
            value={data.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder="e.g. Dearborn"
            invalid={!!errors.city}
          />
        </Field>
        <Field label="Country" required error={errors.country}>
          <SelectInput
            value={data.country}
            onChange={(e) => update('country', e.target.value)}
            options={COUNTRIES}
            placeholder="Select country"
            invalid={!!errors.country}
          />
        </Field>
        <Field label="Height">
          <SelectInput
            value={data.height}
            onChange={(e) => update('height', e.target.value)}
            options={HEIGHT_OPTIONS}
            placeholder="Select height"
          />
        </Field>
        <Field label="Marital status">
          <SelectInput
            value={data.maritalStatus}
            onChange={(e) => update('maritalStatus', e.target.value)}
            options={MARITAL_STATUS_OPTIONS}
            placeholder="Select"
          />
        </Field>
      </div>
    </div>
  );
});

export const StepFaith = memo(function StepFaith({ data, errors, update }: StepProps) {
  const modestyOptions = data.gender === 'Male' ? MODESTY_OPTIONS_MALE : MODESTY_OPTIONS_FEMALE;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Faith &amp; practice</h2>
        <p className="mt-1 text-sm text-muted">Shared values are the foundation of a lasting nikah.</p>
      </div>
      <Field label="Sect / community" required error={errors.sect}>
        <OptionCards
          ariaLabel="Sect or community"
          value={data.sect}
          onChange={(v) => update('sect', v)}
          options={SECTS}
        />
      </Field>
      <Field label="Religiosity level" required error={errors.religiosity}>
        <ChoiceCards
          ariaLabel="Religiosity level"
          value={data.religiosity}
          onChange={(v) => update('religiosity', v)}
          options={RELIGIOSITY_LEVELS}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prayer practice" required error={errors.prayer}>
          <SelectInput
            value={data.prayer}
            onChange={(e) => update('prayer', e.target.value)}
            options={PRAYER_OPTIONS}
            placeholder="Select"
            invalid={!!errors.prayer}
          />
        </Field>
        <Field label="Marja al-Taqlid">
          <SelectInput
            value={data.marja}
            onChange={(e) => update('marja', e.target.value)}
            options={MARJA_OPTIONS}
            placeholder="Select"
          />
        </Field>
        <Field label="Modesty">
          <SelectInput
            value={data.modesty}
            onChange={(e) => update('modesty', e.target.value)}
            options={modestyOptions}
            placeholder="Select"
          />
        </Field>
        <Field label="Diet">
          <SelectInput
            value={data.diet}
            onChange={(e) => update('diet', e.target.value)}
            options={DIET_OPTIONS}
            placeholder="Select"
          />
        </Field>
      </div>
    </div>
  );
});

export const StepBackground = memo(function StepBackground({ data, errors, update, toggleIn }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Background &amp; lineage</h2>
        <p className="mt-1 text-sm text-muted">Heritage and identity — shared with discretion.</p>
      </div>
      <Field label="Syed / Sadat lineage">
        <ChoiceCards
          ariaLabel="Syed lineage"
          value={data.syedStatus}
          onChange={(v) => update('syedStatus', v)}
          options={SYED_OPTIONS}
        />
      </Field>
      <Field label="Ethnicity / heritage" required error={errors.ethnicity}>
        <SelectInput
          value={data.ethnicity}
          onChange={(e) => update('ethnicity', e.target.value)}
          options={ETHNICITIES}
          placeholder="Select heritage"
          invalid={!!errors.ethnicity}
        />
      </Field>
      <Field label="Languages you speak" required error={errors.languages}>
        <OptionCards
          ariaLabel="Languages"
          value=""
          onChange={(v) => toggleIn('languages', v)}
          options={LANGUAGES}
        />
      </Field>
      <Field label="Citizenships" hint="Select all that apply.">
        <OptionCards
          ariaLabel="Citizenships"
          value=""
          onChange={(v) => toggleIn('citizenships', v)}
          options={COUNTRIES}
        />
      </Field>
    </div>
  );
});

export const StepEducation = memo(function StepEducation({ data, errors, update }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Education &amp; career</h2>
        <p className="mt-1 text-sm text-muted">A picture of your daily life and ambitions.</p>
      </div>
      <Field label="Education level" required error={errors.educationLevel}>
        <SelectInput
          value={data.educationLevel}
          onChange={(e) => update('educationLevel', e.target.value)}
          options={EDUCATION_OPTIONS}
          placeholder="Select education level"
          invalid={!!errors.educationLevel}
        />
      </Field>
      <Field label="Profession" required error={errors.profession}>
        <TextInput
          value={data.profession}
          onChange={(e) => update('profession', e.target.value)}
          placeholder="e.g. Software engineer"
          invalid={!!errors.profession}
        />
      </Field>
      <Field label="Income range" hint="Optional — shown only to matches you approve.">
        <TextInput
          value={data.incomeRange}
          onChange={(e) => update('incomeRange', e.target.value)}
          placeholder="e.g. $80k–$110k"
        />
      </Field>
    </div>
  );
});

export const StepIntentions = memo(function StepIntentions({ data, errors, update }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Marriage intentions</h2>
        <p className="mt-1 text-sm text-muted">Aligned timelines prevent heartbreak — be clear about where you stand.</p>
      </div>
      <Field label="Nikah timeline" required error={errors.timeline}>
        <ChoiceCards
          ariaLabel="Nikah timeline"
          value={data.timeline}
          onChange={(v) => update('timeline', v)}
          options={TIMELINE_OPTIONS}
        />
      </Field>
      <Field label="Relocation openness">
        <ChoiceCards
          ariaLabel="Relocation openness"
          value={data.relocation}
          onChange={(v) => update('relocation', v)}
          options={RELOCATION_OPTIONS}
        />
      </Field>
      <Field label="Family involvement" required error={errors.familyInvolvement}>
        <ChoiceCards
          ariaLabel="Family involvement"
          value={data.familyInvolvement}
          onChange={(v) => update('familyInvolvement', v)}
          options={FAMILY_INVOLVEMENT_OPTIONS}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Current children status">
          <SelectInput
            value={data.childrenStatus}
            onChange={(e) => update('childrenStatus', e.target.value)}
            options={CHILDREN_OPTIONS}
            placeholder="Select"
          />
        </Field>
        <Field label="Views on children">
          <SelectInput
            value={data.childrenPlans}
            onChange={(e) => update('childrenPlans', e.target.value)}
            options={CHILDREN_PLANS_OPTIONS}
            placeholder="Select"
          />
        </Field>
      </div>
    </div>
  );
});

// Photo privacy — the platform's signature control.
const PHOTO_ICONS = { globe: Globe, key: KeyRound, lock: Lock } as const;

export const StepPrivacy = memo(function StepPrivacy({ data, errors, update }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">You control everything</h2>
        <p className="mt-1 text-sm text-muted">Privacy is a right, not a premium feature. These settings can be changed anytime.</p>
      </div>

      <Field
        label="Photo visibility"
        hint="Your photos, your rules — every mode includes automatic screenshot-deterrent watermarking."
      >
        <div role="radiogroup" aria-label="Photo visibility" className="grid gap-2.5">
          {PHOTO_ACCESS_OPTIONS.map((opt) => {
            const Icon = PHOTO_ICONS[opt.icon as keyof typeof PHOTO_ICONS];
            const active = data.photoAccess === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update('photoAccess', opt.value)}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  active
                    ? 'border-primary bg-primary/5 shadow-[0_0_0_4px_var(--primary-subtle)]'
                    : 'border-line/20 bg-elevated hover:border-line/50'
                }`}
              >
                <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${active ? 'bg-primary text-white' : 'bg-line/15 text-muted'}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className={`block text-sm font-semibold ${active ? 'text-primary' : 'text-ink'}`}>{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{opt.desc}</span>
                </span>
                {active && <Check className="h-5 w-5 flex-shrink-0 text-primary" strokeWidth={3} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Profile visibility">
        <ChoiceCards
          ariaLabel="Profile visibility"
          value={data.profileVisibility}
          onChange={(v) => update('profileVisibility', v)}
          options={PROFILE_VISIBILITY_OPTIONS}
        />
      </Field>

      <Toggle
        checked={data.incognito}
        onChange={(v) => update('incognito', v)}
        label="Discreet browsing (Incognito)"
        desc="View profiles without appearing in anyone's visitor list or online status."
      />

      <Field label="Who manages this profile?" required error={errors.managementMode}>
        <div role="radiogroup" aria-label="Profile management mode" className="grid gap-2.5 sm:grid-cols-2">
          {MANAGEMENT_MODES.map((mode) => {
            const active = data.managementMode === mode.value;
            const Icon = mode.icon === 'shield' ? Shield : UserRound;
            return (
              <button
                key={mode.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update('managementMode', mode.value)}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  active ? 'border-primary bg-primary/5' : 'border-line/20 bg-elevated hover:border-line/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted'}`} aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-ink">{mode.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{mode.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      {data.managementMode === 'guardian' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Guardian name" required error={errors.guardianName}>
            <TextInput
              value={data.guardianName}
              onChange={(e) => update('guardianName', e.target.value)}
              placeholder="e.g. Hassan N."
              invalid={!!errors.guardianName}
              autoComplete="name"
            />
          </Field>
          <Field label="Guardian email" required error={errors.guardianEmail}>
            <TextInput
              type="email"
              value={data.guardianEmail}
              onChange={(e) => update('guardianEmail', e.target.value)}
              placeholder="guardian@email.com"
              invalid={!!errors.guardianEmail}
              autoComplete="email"
            />
          </Field>
        </div>
      )}
    </div>
  );
});

export const StepStory = memo(function StepStory({ data, update }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Your story</h2>
        <p className="mt-1 text-sm text-muted">The part no dropdown can capture — write like you speak.</p>
      </div>
      <Field label="About you" hint={`${data.bio.length}/600 characters`}>
        <textarea
          value={data.bio}
          maxLength={600}
          rows={5}
          onChange={(e) => update('bio', e.target.value)}
          placeholder="Your values, your journey, what matters most…"
          className="w-full rounded-xl border border-line/30 bg-elevated px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Field>
      <Field label="What you're looking for" hint={`${data.lookingFor.length}/300 characters`}>
        <textarea
          value={data.lookingFor}
          maxLength={300}
          rows={4}
          onChange={(e) => update('lookingFor', e.target.value)}
          placeholder="Describe the partnership you're hoping to build…"
          className="w-full rounded-xl border border-line/30 bg-elevated px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Field>
    </div>
  );
});

// Registry — the wizard shell stays generic over this map.
export const STEP_COMPONENTS: Record<number, ComponentType<StepProps>> = {
  1: StepAbout,
  2: StepFaith,
  3: StepBackground,
  4: StepEducation,
  5: StepIntentions,
  6: StepPrivacy,
  7: StepStory,
};
