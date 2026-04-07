import Link from 'next/link';
import { publicInfoPages } from '@/lib/site-pages';
import DeveloperFooter from './developer-footer';
import ThemeToggle from './theme-toggle';

interface PublicPageSection {
  title: string;
  paragraphs: string[];
}

interface PublicPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  sections: PublicPageSection[];
}

export default function PublicPageShell({
  eyebrow,
  title,
  description,
  sections,
}: PublicPageShellProps) {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-orb absolute left-[-8rem] top-[-7rem] h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(255,142,114,0.32),_transparent_68%)] blur-3xl" />
        <div className="ambient-orb-delayed absolute right-[-7rem] top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(130,202,220,0.26),_transparent_65%)] blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="font-[family-name:var(--font-heading)] text-3xl text-white">
            Lovique
          </Link>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <ThemeToggle />
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-center text-sm text-[var(--muted)] transition hover:bg-white/8"
            >
              Back to home
            </Link>
          </div>
        </header>

        <section className="grid flex-1 gap-6 py-8 sm:gap-8 sm:py-12 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[28px] border border-white/10 bg-[var(--surface-strong)] p-4 shadow-[var(--shadow)] backdrop-blur-xl sm:rounded-[32px] sm:p-6">
            <div className="rounded-[24px] border border-white/8 bg-black/12 p-4 sm:rounded-[28px] sm:p-6">
              <span className="inline-flex w-fit rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[var(--eyebrow-text)]">
                {eyebrow}
              </span>
              <h1 className="mt-6 font-[family-name:var(--font-heading)] text-4xl leading-none text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-3xl text-[15px] leading-7 text-[var(--muted)] sm:text-base sm:leading-8">
                {description}
              </p>

              <div className="mt-8 space-y-5">
                {sections.map((section) => (
                  <section
                    key={section.title}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5"
                  >
                    <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                    <div className="mt-3 space-y-3">
                      {section.paragraphs.map((paragraph) => (
                        <p
                          key={paragraph}
                          className="text-sm leading-7 text-[var(--muted)] sm:text-[15px]"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </article>

          <aside className="rounded-[28px] border border-white/10 bg-[var(--surface)] p-5 shadow-[var(--shadow)] backdrop-blur-xl sm:rounded-[32px] sm:p-6">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/35">Explore</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">More about Lovique</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                These pages help first-time visitors and returning users understand how Lovique
                works, how information is handled, and how to reach the developer.
              </p>
              <div className="mt-5 grid gap-3">
                {publicInfoPages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="rounded-[20px] border border-white/10 bg-black/12 px-4 py-3 text-sm text-[var(--foreground)] transition hover:bg-white/6"
                  >
                    {page.label}
                  </Link>
                ))}
              </div>
              <div className="mt-5 rounded-[22px] border border-[rgba(130,202,220,0.18)] bg-[rgba(130,202,220,0.08)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
                Need something specific? The Contact page lists the current email and GitHub
                support channels for this project.
              </div>
            </div>
          </aside>
        </section>

        <DeveloperFooter className="pb-2" />
      </div>
    </main>
  );
}
