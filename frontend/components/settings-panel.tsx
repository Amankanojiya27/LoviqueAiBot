// File: frontend/components/settings-panel.tsx
import { useState } from 'react';
import {
  getCompanionLabel,
  getPersonalityDescription,
  getPersonalityLabel,
  companionGenderOptions,
  personalityOptions,
} from '@/lib/companion-preferences';
import type {
  CompanionPersonality,
  PersistentMemory,
  SessionUser,
  UserGender,
} from '@/lib/types';

interface SettingsPanelProps {
  activeRequest: string | null;
  changePasswordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  formatTimestamp: (value: string | null) => string;
  memories: PersistentMemory[];
  preferencesForm: {
    companionGender: UserGender;
    companionPersonality: CompanionPersonality;
  };
  user: SessionUser;
  onChangePasswordChange: (
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
    value: string,
  ) => void;
  onChangePasswordSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClearMemories: () => void;
  onPreferenceChange: (
    field: 'companionGender' | 'companionPersonality',
    value: string,
  ) => void;
  onPreferencesSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function SettingsPanel({
  activeRequest,
  changePasswordForm,
  formatTimestamp,
  memories,
  preferencesForm,
  user,
  onChangePasswordChange,
  onChangePasswordSubmit,
  onClearMemories,
  onPreferenceChange,
  onPreferencesSubmit,
}: SettingsPanelProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-5">
        <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 sm:rounded-[26px] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Account</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">{user.name}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-soft))] text-sm font-semibold text-[#22151a]">
              {user.name
                .split(' ')
                .map((part) => part.charAt(0))
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm text-[var(--muted)]">
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Companion gender" value={getCompanionLabel(user.companionGender)} />
            <InfoRow
              label="Personality"
              value={getPersonalityLabel(user.companionPersonality)}
            />
            <InfoRow label="Member since" value={formatTimestamp(user.createdAt)} />
            <InfoRow label="Last login" value={formatTimestamp(user.lastLoginAt)} />
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 sm:rounded-[26px] sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Memory</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Remembered notes</h3>
            </div>
            <button
              type="button"
              onClick={onClearMemories}
              disabled={activeRequest === 'clear-memories' || memories.length === 0}
              className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeRequest === 'clear-memories' ? 'Clearing' : 'Clear'}
            </button>
          </div>

          {memories.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-black/12 px-4 py-3 text-sm leading-7 text-[var(--muted)]">
              Lovique will keep important facts across chats. Say something like{' '}
              <span className="font-semibold text-[var(--foreground)]">
                remember that I love chai
              </span>{' '}
              or share details like your favorite color, city, or hobbies.
            </div>
          ) : (
            <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="rounded-2xl border border-white/8 bg-black/12 px-4 py-3"
                >
                  <p className="text-sm leading-6 text-[var(--foreground)]">{memory.fact}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/35">
                    Updated {formatTimestamp(memory.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <form
          onSubmit={onPreferencesSubmit}
          className="rounded-[22px] border border-white/10 bg-white/5 p-4 sm:rounded-[26px] sm:p-5"
        >
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.28em] text-white/45">Companion</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Match and personality</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Companion gender"
              value={preferencesForm.companionGender}
              onChange={(value) => onPreferenceChange('companionGender', value)}
              options={companionGenderOptions}
            />
            <SelectField
              label="Companion personality"
              value={preferencesForm.companionPersonality}
              onChange={(value) => onPreferenceChange('companionPersonality', value)}
              options={personalityOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </div>

          <div className="mt-4 rounded-[22px] border border-white/10 bg-black/12 px-4 py-3 text-sm leading-6 text-[var(--muted)]">
            Lovique will talk as a{' '}
            <span className="font-semibold text-[var(--foreground)]">
              {getCompanionLabel(preferencesForm.companionGender).toLowerCase()}
            </span>{' '}
            with a{' '}
            <span className="font-semibold text-[var(--foreground)]">
              {getPersonalityLabel(preferencesForm.companionPersonality).toLowerCase()}
            </span>{' '}
            vibe.
            <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
              {getPersonalityDescription(preferencesForm.companionPersonality)}
            </p>
          </div>

          <button
            type="submit"
            disabled={activeRequest === 'preferences'}
            className="mt-4 w-full rounded-2xl border border-white/12 bg-white/7 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {activeRequest === 'preferences' ? 'Saving...' : 'Save preferences'}
          </button>
        </form>

        <form
          onSubmit={onChangePasswordSubmit}
          className="rounded-[22px] border border-white/10 bg-white/5 p-4 sm:rounded-[26px] sm:p-5"
        >
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.28em] text-white/45">Password</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Change password</h3>
          </div>

          <div className="space-y-3">
            <Field
              label="Current password"
              type="password"
              value={changePasswordForm.currentPassword}
              onChange={(value) => onChangePasswordChange('currentPassword', value)}
            />
            <Field
              label="New password"
              type="password"
              value={changePasswordForm.newPassword}
              onChange={(value) => onChangePasswordChange('newPassword', value)}
            />
            <Field
              label="Confirm new password"
              type="password"
              value={changePasswordForm.confirmPassword}
              onChange={(value) => onChangePasswordChange('confirmPassword', value)}
            />
          </div>

          <button
            type="submit"
            disabled={activeRequest === 'change-password'}
            className="mt-4 w-full rounded-2xl border border-white/12 bg-white/7 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {activeRequest === 'change-password' ? 'Saving...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const supportsReveal = type === 'password';
  const resolvedType = supportsReveal && showPassword ? 'text' : type;

  return (
    <label className="block text-sm text-[var(--muted)]">
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        {supportsReveal ? (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)] transition hover:text-[var(--foreground)]"
            aria-label={showPassword ? `Hide ${label}` : `Show ${label}`}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            {showPassword ? 'Hide' : 'Show'}
          </button>
        ) : null}
      </div>
      <input
        type={resolvedType}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="themed-control mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition"
      />
      {supportsReveal && showPassword ? (
        <p className="mt-2 text-xs leading-6 text-[var(--danger)]">
          Caution: your password is visible on screen. Use this only on a trusted device.
        </p>
      ) : null}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/12 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">{label}</p>
      <p className="mt-1 break-words text-sm text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-[var(--muted)]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="themed-control themed-select mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[14px] w-[14px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[14px] w-[14px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4" />
      <path d="M9.4 5.5A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-4.1 4.8" />
      <path d="M6.2 6.2A16.1 16.1 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4-.8" />
    </svg>
  );
}
