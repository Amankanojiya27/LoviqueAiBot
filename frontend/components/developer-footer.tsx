// File: frontend/components/developer-footer.tsx
import Link from 'next/link';
import { publicInfoPages } from '@/lib/site-pages';

export default function DeveloperFooter({ className = '' }: { className?: string }) {
  const footerClassName = [
    'border-t border-white/10 pt-4 text-xs leading-6 text-[var(--muted)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <footer className={footerClassName}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {publicInfoPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="transition hover:text-[var(--foreground)]"
            >
              {page.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Developed by <span className="font-medium text-[var(--foreground)]">@Amankanojiya27</span>
          </p>
          <div className="flex flex-col gap-1 sm:items-end">
            <a
              href="https://github.com/Amankanojiya27"
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-2 text-[var(--accent-cool)] transition hover:text-[var(--foreground)]"
            >
              <GitHubIcon />
              github.com/Amankanojiya27
            </a>
            <a
              href="mailto:amankanojiya.dev@gmail.com"
              className="flex w-fit items-center gap-2 transition hover:text-[var(--foreground)]"
            >
              <MailIcon />
              amankanojiya.dev@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[14px] w-[14px]"
      fill="currentColor"
    >
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.72.08-.72 1.2.08 1.83 1.22 1.83 1.22 1.07 1.8 2.8 1.28 3.48.98.11-.76.42-1.28.76-1.58-2.67-.3-5.47-1.31-5.47-5.86 0-1.3.47-2.37 1.24-3.2-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.22A11.6 11.6 0 0 1 12 6.58c1.02 0 2.05.14 3.01.42 2.29-1.54 3.3-1.22 3.3-1.22.66 1.65.24 2.87.12 3.17.77.83 1.24 1.9 1.24 3.2 0 4.56-2.8 5.55-5.48 5.85.43.37.81 1.08.81 2.19v3.25c0 .32.22.69.83.58A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function MailIcon() {
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
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
