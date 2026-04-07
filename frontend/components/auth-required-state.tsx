// File: frontend/components/auth-required-state.tsx
import Link from 'next/link';

interface AuthRequiredStateProps {
  description: string;
  label: string;
  title: string;
}

export default function AuthRequiredState({
  description,
  label,
  title,
}: AuthRequiredStateProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
      <div className="w-full rounded-[28px] border border-white/10 bg-[var(--surface)] p-5 text-center shadow-[var(--shadow)] backdrop-blur-xl sm:rounded-[32px] sm:p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-white/45">{label}</p>
        <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl leading-none text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-[15px] leading-7 text-[var(--muted)] sm:text-base sm:leading-8">
          {description}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/auth"
            className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-soft))] px-6 py-3 text-center text-sm font-semibold text-[#24171a] transition hover:brightness-105"
          >
            Go to sign in
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-center text-sm text-[var(--foreground)] transition hover:bg-white/8"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
