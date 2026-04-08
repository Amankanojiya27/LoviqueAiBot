// File: frontend/components/auth-panel.tsx
import Link from 'next/link';
import { useState } from 'react';
import {
  getCompanionLabel,
  getPersonalityDescription,
  getPersonalityLabel,
  companionGenderOptions,
  personalityOptions,
} from '@/lib/companion-preferences';
import type {
  AuthMode,
  CompanionPersonality,
  PasswordResetPreview,
  UserGender,
} from '@/lib/types';

interface AuthPanelProps {
  activeRequest: string | null;
  mode: AuthMode;
  resetPreview: PasswordResetPreview | null;
  registerForm: {
    name: string;
    email: string;
    companionGender: UserGender;
    companionPersonality: CompanionPersonality;
    password: string;
    confirmPassword: string;
    isAdultConfirmed: boolean;
  };
  loginForm: {
    email: string;
    password: string;
  };
  forgotForm: {
    email: string;
  };
  resetForm: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  };
  onModeChange: (mode: AuthMode) => void;
  onRegisterChange: (
    field:
      | 'name'
      | 'email'
      | 'companionGender'
      | 'companionPersonality'
      | 'password'
      | 'confirmPassword'
      | 'isAdultConfirmed',
    value: string,
  ) => void;
  onLoginChange: (field: 'email' | 'password', value: string) => void;
  onForgotChange: (value: string) => void;
  onResetChange: (field: 'token' | 'newPassword' | 'confirmPassword', value: string) => void;
  onRegisterSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onLoginSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onForgotSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onResetSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  formatTimestamp: (value: string | null) => string;
}

export default function AuthPanel({
  activeRequest,
  forgotForm,
  formatTimestamp,
  loginForm,
  mode,
  onForgotChange,
  onForgotSubmit,
  onLoginChange,
  onLoginSubmit,
  onModeChange,
  onRegisterChange,
  onRegisterSubmit,
  onResetChange,
  onResetSubmit,
  registerForm,
  resetForm,
  resetPreview,
}: AuthPanelProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-[22px] border border-white/10 bg-white/5 p-4 sm:rounded-[26px] sm:p-5">
        <div className="mb-5 grid grid-cols-2 gap-2">
          {(['login', 'register'] as AuthMode[]).map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => onModeChange(entry)}
              className={`rounded-full px-4 py-2 text-center text-sm transition ${
                mode === entry
                  ? 'bg-[linear-gradient(135deg,var(--accent),var(--accent-soft))] font-semibold text-[#25181b]'
                  : 'border border-white/10 bg-white/5 text-[var(--muted)] hover:bg-white/8'
              }`}
            >
              {entry === 'login'
                ? 'Login'
                : entry === 'register'
                  ? 'Register'
                  : entry === 'forgot'
                    ? 'Forgot password'
                    : 'Reset password'}
            </button>
          ))}
        </div>

        {mode === 'login' ? (
          <form onSubmit={onLoginSubmit} className="space-y-4">
            <Field
              label="Email address"
              type="email"
              value={loginForm.email}
              onChange={(value) => onLoginChange('email', value)}
            />
            <Field
              label="Password"
              type="password"
              value={loginForm.password}
              onChange={(value) => onLoginChange('password', value)}
            />
            <SubmitButton
              busy={activeRequest === 'login'}
              label="Login"
              pendingLabel="Signing in..."
            />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm text-[var(--muted)]">
              <button
                type="button"
                onClick={() => onModeChange('forgot')}
                className="transition hover:text-[var(--foreground)]"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => onModeChange('register')}
                className="transition hover:text-[var(--foreground)]"
              >
                Need an account?
              </button>
            </div>
          </form>
        ) : null}

        {mode === 'register' ? (
          <form onSubmit={onRegisterSubmit} className="space-y-4">
            <Field
              label="Full name"
              value={registerForm.name}
              onChange={(value) => onRegisterChange('name', value)}
            />
            <Field
              label="Email address"
              type="email"
              value={registerForm.email}
              onChange={(value) => onRegisterChange('email', value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Companion gender"
                value={registerForm.companionGender}
                onChange={(value) => onRegisterChange('companionGender', value)}
                options={companionGenderOptions}
              />
              <SelectField
                label="Companion personality"
                value={registerForm.companionPersonality}
                onChange={(value) => onRegisterChange('companionPersonality', value)}
                options={personalityOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
            </div>
            <div className="rounded-[22px] border border-white/10 bg-black/12 px-4 py-3 text-sm leading-6 text-[var(--muted)]">
              You are choosing a{' '}
              <span className="font-semibold text-[var(--foreground)]">
                {getCompanionLabel(registerForm.companionGender).toLowerCase()}
              </span>{' '}
              using the{' '}
              <span className="font-semibold text-[var(--foreground)]">
                {getPersonalityLabel(registerForm.companionPersonality).toLowerCase()}
              </span>{' '}
              vibe.
              <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                {getPersonalityDescription(registerForm.companionPersonality)}
              </p>
            </div>
            <Field
              label="Password"
              type="password"
              value={registerForm.password}
              onChange={(value) => onRegisterChange('password', value)}
            />
            <Field
              label="Confirm password"
              type="password"
              value={registerForm.confirmPassword}
              onChange={(value) => onRegisterChange('confirmPassword', value)}
            />
            <label className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-black/12 px-4 py-3 text-sm leading-6 text-[var(--muted)]">
              <input
                type="checkbox"
                checked={registerForm.isAdultConfirmed}
                onChange={(event) =>
                  onRegisterChange('isAdultConfirmed', event.target.checked ? 'true' : '')
                }
                className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-[var(--accent)]"
              />
              <span>
                I confirm that I am 18 or older, and I agree to the{' '}
                <Link
                  href="/terms"
                  className="text-[var(--foreground)] underline underline-offset-4"
                >
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="text-[var(--foreground)] underline underline-offset-4"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            <SubmitButton
              busy={activeRequest === 'register'}
              label="Create account"
              pendingLabel="Creating account..."
            />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm text-[var(--muted)]">
              <button
                type="button"
                onClick={() => onModeChange('login')}
                className="transition hover:text-[var(--foreground)]"
              >
                Already have an account?
              </button>
              <button
                type="button"
                onClick={() => onModeChange('forgot')}
                className="transition hover:text-[var(--foreground)]"
              >
                Need help signing in?
              </button>
            </div>
          </form>
        ) : null}

        {mode === 'forgot' ? (
          <form onSubmit={onForgotSubmit} className="space-y-4">
            <Field
              label="Email address"
              type="email"
              value={forgotForm.email}
              onChange={onForgotChange}
            />
            <SubmitButton
              busy={activeRequest === 'forgot-password'}
              label="Generate reset link"
              pendingLabel="Generating..."
            />
            <button
              type="button"
              onClick={() => onModeChange('login')}
              className="text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              Back to sign in
            </button>
          </form>
        ) : null}

        {mode === 'reset' ? (
          <form onSubmit={onResetSubmit} className="space-y-4">
            <Field
              label="Reset token"
              value={resetForm.token}
              onChange={(value) => onResetChange('token', value)}
            />
            <Field
              label="New password"
              type="password"
              value={resetForm.newPassword}
              onChange={(value) => onResetChange('newPassword', value)}
            />
            <Field
              label="Confirm new password"
              type="password"
              value={resetForm.confirmPassword}
              onChange={(value) => onResetChange('confirmPassword', value)}
            />
            <SubmitButton
              busy={activeRequest === 'reset-password'}
              label="Reset password"
              pendingLabel="Updating..."
            />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm text-[var(--muted)]">
              <button
                type="button"
                onClick={() => onModeChange('login')}
                className="transition hover:text-[var(--foreground)]"
              >
                Back to sign in
              </button>
              <button
                type="button"
                onClick={() => onModeChange('forgot')}
                className="transition hover:text-[var(--foreground)]"
              >
                Request a new reset link
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <aside className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 sm:rounded-[26px] sm:p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">What you can do</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
            <li>Create an account and start chatting in your own workspace.</li>
            <li>Sign back in anytime and continue from your private dashboard.</li>
            <li>Recover access if you forget your password.</li>
            <li>Manage your account and change your password after login.</li>
            <li>Lovique is intended for adults aged 18 or older.</li>
          </ul>
        </div>

        {resetPreview ? (
          <div className="rounded-[22px] border border-[rgba(130,202,220,0.25)] bg-[rgba(130,202,220,0.08)] p-4 sm:rounded-[26px] sm:p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent-cool)]">
              Reset link preview
            </p>
            <div className="mt-4 space-y-3 text-sm text-[var(--foreground)]">
              <InfoRow label="Token" value={resetPreview.resetToken} />
              <InfoRow label="Expires" value={formatTimestamp(resetPreview.expiresAt)} />
              <InfoRow label="Link" value={resetPreview.resetUrl} />
            </div>
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-white/12 bg-black/12 p-4 text-sm leading-7 text-[var(--muted)] sm:rounded-[26px] sm:p-5">
            Enter the email for your account and Lovique will prepare the password reset flow. On
            live deployments, the reset link is sent by email instead of being shown on this page.
          </div>
        )}
      </aside>
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

function SubmitButton({
  busy,
  label,
  pendingLabel,
}: {
  busy: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-soft))] px-4 py-3 text-sm font-semibold text-[#24171a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? pendingLabel : label}
    </button>
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
