'use client';

import { useToastStore } from '@/stores/toast-store';

const toneStyles = {
  info: 'border-[rgba(130,202,220,0.22)] bg-[rgba(18,24,34,0.92)]',
  success: 'border-[rgba(155,213,154,0.22)] bg-[rgba(18,28,24,0.92)]',
  error: 'border-[rgba(255,139,148,0.26)] bg-[rgba(35,18,24,0.94)]',
} as const;

const toneIconStyles = {
  info: 'bg-[rgba(130,202,220,0.14)] text-[var(--accent-cool)]',
  success: 'bg-[rgba(155,213,154,0.14)] text-[var(--success)]',
  error: 'bg-[rgba(255,139,148,0.14)] text-[var(--danger)]',
} as const;

export default function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex flex-col gap-3 px-4 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-6 sm:w-[380px] sm:px-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto mx-auto flex w-full max-w-sm items-start gap-3 rounded-[24px] border px-4 py-3 text-sm shadow-[var(--shadow)] backdrop-blur-xl motion-safe:animate-[page-enter_220ms_ease] sm:max-w-none ${toneStyles[toast.tone]}`}
        >
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${toneIconStyles[toast.tone]}`}
          >
            <ToastIcon tone={toast.tone} />
          </div>
          <div className="min-w-0 flex-1">
            {toast.title ? (
              <p className="font-semibold text-[var(--foreground)]">{toast.title}</p>
            ) : null}
            <p className={`${toast.title ? 'mt-1' : ''} leading-6 text-[var(--muted)]`}>
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[var(--muted)] transition hover:bg-white/10 hover:text-[var(--foreground)]"
            aria-label="Dismiss notification"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
}

function ToastIcon({ tone }: { tone: 'info' | 'success' | 'error' }) {
  if (tone === 'success') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m5 12.5 4.2 4.2L19 7.4" />
      </svg>
    );
  }

  if (tone === 'error') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 8v4.5" />
        <path d="M12 16h.01" />
        <path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8.25v4.5" />
      <path d="M12 16h.01" />
      <path d="M12 3.75a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[16px] w-[16px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
