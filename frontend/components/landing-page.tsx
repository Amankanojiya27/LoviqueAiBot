// File: frontend/components/landing-page.tsx
import Link from 'next/link';
import { personalityOptions } from '@/lib/companion-preferences';
import DeveloperFooter from './developer-footer';
import ThemeToggle from './theme-toggle';

const highlights = [
  {
    title: 'Private personal space',
    copy: 'Your account keeps chats, settings, remembered notes, and sign-in sessions connected to you each time you return.',
  },
  {
    title: 'Companion your way',
    copy: 'Choose the companion personality that fits your mood and keep adjusting it later from your settings.',
  },
  {
    title: 'Easy to start',
    copy: 'Create an account, open your dashboard, and start chatting without learning a complicated setup.',
  },
];

const firstLook = [
  {
    eyebrow: 'What it is',
    title: 'An AI companion chat app',
    copy: 'Lovique is a private chat experience where you talk with an AI companion in your own account-based space.',
  },
  {
    eyebrow: 'How it works',
    title: 'Create an account and start talking',
    copy: 'Sign up, choose your companion vibe, and continue your conversations later from the same dashboard.',
  },
  {
    eyebrow: 'What you get',
    title: 'Saved chats, memory, and settings',
    copy: 'Your sessions, remembered notes, and companion preferences stay available whenever you come back.',
  },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-orb absolute left-[-8rem] top-[-7rem] h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(255,142,114,0.32),_transparent_68%)] blur-3xl" />
        <div className="ambient-orb-delayed absolute right-[-7rem] top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(130,202,220,0.26),_transparent_65%)] blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="font-[family-name:var(--font-heading)] text-3xl text-white">
            Lovique
          </Link>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <ThemeToggle />
            <Link
              href="/auth"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-center text-sm text-[var(--muted)] transition hover:bg-white/8"
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=register"
              className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-soft))] px-5 py-2 text-center text-sm font-semibold text-[#24171a] transition hover:brightness-105"
            >
              Get started
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center  gap-8 py-10 sm:py-14 lg:gap-10 lg:py-20 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-7">
            <span className="inline-flex w-fit rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[var(--eyebrow-text)]">
              Meet Lovique
            </span>
            <div className="space-y-5">
              <h1 className="max-w-3xl font-[family-name:var(--font-heading)] text-4xl leading-none text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                A private but free AI companion space for warm, personal conversation.
              </h1>
              <p className="max-w-2xl text-[15px] leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
                Lovique is a web app for people who want a calm, always-available AI companion.
                Create an account, choose your companion gender and personality, and chat in a
                private dashboard that keeps your sessions and remembered details together.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/auth?mode=register"
                className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-soft))] px-6 py-3 text-center text-sm font-semibold text-[#24171a] transition hover:brightness-105"
              >
                New here? Create account
              </Link>
              <Link
                href="/auth"
                className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-center text-sm text-[var(--foreground)] transition hover:bg-white/8"
              >
                I already have an account
              </Link>
            </div>
            <div className="grid gap-4 pt-4 sm:grid-cols-3">
              <Metric value="24/7" label="Access whenever you want to talk" />
              <Metric value="Private" label="Account-based chats, settings, and recovery" />
              <Metric value="Your pick" label="Choose companion gender and personality yourself" />
            </div>

            <div className="rounded-[24px] border border-[rgba(130,202,220,0.18)] bg-[rgba(130,202,220,0.08)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
              Lovique uses account sessions, stored chats, remembered notes, and a third-party AI
              provider to deliver the companion experience, while keeping your preferences and
              conversation flow connected to your account.
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[var(--surface)] p-4 shadow-[var(--shadow)] backdrop-blur-xl sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/35">
                    Personalities & preferences
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Choose the vibe that fits you
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--accent-cool)]">
                  Change anytime
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {personalityOptions.map((option) => (
                  <div
                    key={option.value}
                    className="rounded-[22px] border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-base font-semibold text-white">{option.label}</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                      {option.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[22px] border border-[rgba(255,190,122,0.16)] bg-[rgba(255,190,122,0.07)] p-4 text-sm leading-7 text-[var(--muted)]">
                During signup, users choose their companion gender and personality directly.
                Lovique keeps that setup connected to the account, and those choices can be
                updated later from settings whenever the vibe changes.
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[var(--surface)] shadow-[var(--shadow)] backdrop-blur-xl sm:rounded-[36px]">
            <div className="rounded-[24px] border border-white/8 bg-black/14 p-4 sm:rounded-[28px] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">Preview</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">A softer kind of chat</h2>
                </div>
                <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--accent-cool)]">
                  Live workspace
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <Bubble role="model" text="Hey, you are here. How did your day go?" />
                <Bubble role="user" text="A little busy, but better now that I can relax." />
                <Bubble
                  role="model"
                  text="Then stay for a minute. Tell me the one thing that made today worth it."
                />
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-[var(--muted)]">
                After signup, your companion can be sweet, playful, calm, or romantic, with a
                private dashboard that keeps your chats, memory, and settings in one place.
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-4 sm:grid-cols-2 xl:grid-cols-3">
          {firstLook.map((item) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-white/10 bg-[var(--surface)] p-5 shadow-[var(--shadow)] backdrop-blur-xl sm:rounded-[28px] sm:p-6"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-white/35">{item.eyebrow}</p>
              <h2 className="mt-3 text-xl font-semibold text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.copy}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 pb-8 sm:grid-cols-2 xl:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-white/10 bg-[var(--surface)] p-5 shadow-[var(--shadow)] backdrop-blur-xl sm:rounded-[28px] sm:p-6"
            >
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.copy}</p>
            </div>
          ))}
        </section>

        <DeveloperFooter className="pb-2" />
      </div>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="font-[family-name:var(--font-heading)] text-3xl text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{label}</p>
    </div>
  );
}

function Bubble({ role, text }: { role: 'user' | 'model'; text: string }) {
  return (
    <div
      className={`max-w-[92%] rounded-[24px] px-4 py-3 text-sm leading-7 shadow-lg sm:max-w-[85%] ${
        role === 'user'
          ? 'ml-auto bg-[linear-gradient(135deg,rgba(255,142,114,0.9),rgba(255,190,122,0.88))] text-[#24161a]'
          : 'border border-white/10 bg-[rgba(255,255,255,0.06)] text-[var(--foreground)]'
      }`}
    >
      {text}
    </div>
  );
}
