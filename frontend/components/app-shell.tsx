// File: frontend/components/app-shell.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api';
import { extractErrorMessage, getServiceToastTitle, isServiceToastWorthyError } from '@/lib/error-helpers';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';
import { showToast } from '@/stores/toast-store';
import AuthRequiredState from './auth-required-state';
import DeveloperFooter from './developer-footer';
import ThemeToggle from './theme-toggle';

interface AppShellProps {
  children: React.ReactNode;
}

const navigation = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'Chats and sessions',
    icon: MessageIcon,
  },
  {
    href: '/settings',
    label: 'Settings',
    description: 'Account and memory',
    icon: SettingsIcon,
  },
];

const sidebarPanelClass =
  'rounded-[28px] border border-white/10 shadow-[var(--shadow)] backdrop-blur-xl';
const sidebarSurfacePanelClass = `${sidebarPanelClass} bg-[var(--surface)] p-4 sm:p-5`;
const sidebarStrongPanelClass = `${sidebarPanelClass} bg-[var(--surface-strong)] p-3 sm:p-4`;

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const sessionBooting = useAuthStore((state) => state.sessionBooting);
  const authActiveRequest = useAuthStore((state) => state.activeRequest);
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);
  const logout = useAuthStore((state) => state.logout);
  const chatActiveRequest = useChatStore((state) => state.activeRequest);
  const sessionId = useChatStore((state) => state.sessionId);
  const sessions = useChatStore((state) => state.sessions);
  const sessionsLoading = useChatStore((state) => state.sessionsLoading);
  const loadSessions = useChatStore((state) => state.loadSessions);
  const openSession = useChatStore((state) => state.openSession);
  const renameSession = useChatStore((state) => state.renameSession);
  const deleteSession = useChatStore((state) => state.deleteSession);
  const startFreshChat = useChatStore((state) => state.startFreshChat);
  const resetChatState = useChatStore((state) => state.resetState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [sidebarError, setSidebarError] = useState('');
  const [bootError, setBootError] = useState('');

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      setBootError('');

      try {
        const currentUser = await loadCurrentUser();

        if (!active) {
          return;
        }

        if (!currentUser) {
          resetChatState();
        }
      } catch (error) {
        if (active) {
          const message =
            error instanceof ApiRequestError || error instanceof Error
              ? error.message
              : 'Lovique is waking up right now. Please try again in a few seconds.';
          setBootError(message);

          if (isServiceToastWorthyError(error)) {
            showToast({
              tone: 'error',
              title: getServiceToastTitle(error),
              message: extractErrorMessage(error),
            });
          }
        }
      }
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, [loadCurrentUser, resetChatState]);

  useEffect(() => {
    let active = true;

    const hydrateSessions = async () => {
      if (!user) {
        return;
      }

      try {
        await loadSessions();
      } catch {
        if (!active) {
          return;
        }
      }
    };

    void hydrateSessions();

    return () => {
      active = false;
    };
  }, [loadSessions, user]);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const clearConversationEditors = () => {
    setEditingSessionId(null);
    setEditingTitle('');
    setDeletingSessionId(null);
  };

  const startRenaming = (targetSessionId: string, currentTitle: string) => {
    setSidebarError('');
    setDeletingSessionId(null);
    setEditingSessionId(targetSessionId);
    setEditingTitle(currentTitle);
  };

  const cancelRenaming = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const startDeleting = (targetSessionId: string) => {
    setSidebarError('');
    cancelRenaming();
    setDeletingSessionId(targetSessionId);
  };

  const cancelDeleting = () => {
    setDeletingSessionId(null);
  };

  const submitRename = async (targetSessionId: string) => {
    const nextTitle = editingTitle.trim();

    if (!nextTitle) {
      return;
    }

    setSidebarError('');

    try {
      await renameSession(targetSessionId, nextTitle);
      cancelRenaming();
    } catch (error) {
      setSidebarError(error instanceof Error ? error.message : 'We could not rename that chat.');

      if (isServiceToastWorthyError(error)) {
        showToast({
          tone: 'error',
          title: getServiceToastTitle(error),
          message: extractErrorMessage(error),
        });
      }
    }
  };

  const confirmDelete = async (targetSessionId: string) => {
    setSidebarError('');

    try {
      await deleteSession(targetSessionId);
      cancelDeleting();
    } catch (error) {
      setSidebarError(error instanceof Error ? error.message : 'We could not delete that chat.');

      if (isServiceToastWorthyError(error)) {
        showToast({
          tone: 'error',
          title: getServiceToastTitle(error),
          message: extractErrorMessage(error),
        });
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      resetChatState();
      router.push('/');
    } catch {
      // Keep the current screen; page-level notices stay on the child views.
    }
  };

  const retryBoot = async () => {
    setBootError('');

    try {
      const currentUser = await loadCurrentUser();

      if (!currentUser) {
        resetChatState();
      }
    } catch (error) {
      const message =
        error instanceof ApiRequestError || error instanceof Error
          ? error.message
          : 'Lovique is waking up right now. Please try again in a few seconds.';
      setBootError(message);

      if (isServiceToastWorthyError(error)) {
        showToast({
          tone: 'error',
          title: getServiceToastTitle(error),
          message: extractErrorMessage(error),
        });
      }
    }
  };

  if (sessionBooting) {
    return (
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="ambient-orb absolute left-[-8rem] top-[-7rem] h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(255,142,114,0.32),_transparent_68%)] blur-3xl" />
          <div className="ambient-orb-delayed absolute right-[-7rem] top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(130,202,220,0.26),_transparent_65%)] blur-3xl" />
        </div>

        <div className="mx-auto flex min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="grid w-full gap-4 md:grid-cols-2">
            <SkeletonBlock className="h-56" />
            <SkeletonBlock className="h-56" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    if (bootError) {
      return (
        <main className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="ambient-orb absolute left-[-8rem] top-[-7rem] h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(255,142,114,0.32),_transparent_68%)] blur-3xl" />
            <div className="ambient-orb-delayed absolute right-[-7rem] top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(130,202,220,0.26),_transparent_65%)] blur-3xl" />
          </div>

          <div className="mx-auto flex min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <ServiceWakeState description={bootError} onRetry={retryBoot} />
          </div>
        </main>
      );
    }

    return (
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="ambient-orb absolute left-[-8rem] top-[-7rem] h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(255,142,114,0.32),_transparent_68%)] blur-3xl" />
          <div className="ambient-orb-delayed absolute right-[-7rem] top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(130,202,220,0.26),_transparent_65%)] blur-3xl" />
        </div>

        <div className="mx-auto flex min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <AuthRequiredState
            label="Private area"
            title="Sign in to continue."
            description="This part of Lovique is available after login. Head to the auth page and come right back."
          />
        </div>
      </main>
    );
  }

  const currentViewLabel =
    navigation.find((entry) => pathname === entry.href)?.label ?? 'Workspace';
  const recentSessions = sessions.slice(0, 5);

  const handleOpenConversation = (targetSessionId: string) => {
    setSidebarError('');
    clearConversationEditors();
    openSession(targetSessionId);
    closeSidebar();

    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  };

  const handleStartNewChat = () => {
    setSidebarError('');
    clearConversationEditors();
    startFreshChat();
    closeSidebar();

    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  };

  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col gap-4 sm:gap-5">
      <div className={sidebarSurfacePanelClass}>
        <div className="flex items-center justify-between gap-3 lg:block">
          <div>
            <Link
              href="/dashboard"
              onClick={closeSidebar}
              className="font-[family-name:var(--font-heading)] text-[1.75rem] text-white sm:text-3xl"
            >
              Lovique
            </Link>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Move through chat and settings without losing the app frame.
            </p>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--foreground)] transition hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-4 rounded-[22px] border border-white/10 bg-black/12 p-3 sm:mt-5 sm:rounded-[24px] sm:p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-soft))] text-sm font-semibold text-[#22151a] sm:h-12 sm:w-12">
              {user.name
                .split(' ')
                .map((part) => part.charAt(0))
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">{user.name}</p>
              <p className="truncate text-xs uppercase tracking-[0.2em] text-white/35">
                {currentViewLabel}
              </p>
            </div>
          </div>
          <p className="mt-3 break-words text-sm leading-7 text-[var(--muted)] sm:mt-4">
            {user.email}
          </p>
        </div>
      </div>

      <div className="message-scroll min-h-0 space-y-4 overflow-y-auto pr-0.5 sm:space-y-5 sm:pr-1">
        <nav className={sidebarStrongPanelClass}>
          <p className="px-1 text-xs uppercase tracking-[0.24em] text-white/35 sm:px-2">
            Navigation
          </p>
          <div className="mt-3 space-y-2 sm:mt-4">
            {navigation.map((entry) => {
              const isActive = pathname === entry.href;
              const Icon = entry.icon;

              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 rounded-[20px] border px-3 py-2.5 transition sm:rounded-[22px] sm:px-4 sm:py-3 ${
                    isActive
                      ? 'border-[rgba(255,190,122,0.35)] bg-[rgba(255,190,122,0.08)]'
                      : 'border-white/8 bg-black/12 hover:bg-white/6'
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--foreground)] sm:h-11 sm:w-11">
                    <Icon />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--foreground)]">
                      {entry.label}
                    </span>
                    <span className="block text-xs leading-6 text-[var(--muted)]">
                      {entry.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className={sidebarStrongPanelClass}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="px-1 text-xs uppercase tracking-[0.24em] text-white/35 sm:px-2">
                Conversations
              </p>
              <h3 className="mt-2 px-1 text-lg font-semibold text-white sm:px-2">
                Recent
              </h3>
            </div>
            <button
              type="button"
              onClick={handleStartNewChat}
              aria-label="Start new chat"
              title="New chat"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white transition hover:bg-white/10"
            >
              <PlusIcon />
            </button>
          </div>

          {sessionsLoading ? (
            <div className="mt-4 space-y-3">
              <ConversationSkeleton />
              <ConversationSkeleton />
              <ConversationSkeleton />
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="mt-4 rounded-[20px] border border-dashed border-white/10 bg-black/12 px-3 py-2.5 text-sm leading-7 text-[var(--muted)] sm:rounded-[22px] sm:px-4 sm:py-3">
              Your recent chats will show up here after your first conversation.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {recentSessions.map((session) => {
                const isActive = session.sessionId === sessionId;
                const isEditing = editingSessionId === session.sessionId;
                const isDeleting = deletingSessionId === session.sessionId;

                return (
                  <div
                    key={session.sessionId}
                    className={`w-full rounded-[18px] border px-3 py-2 text-left transition sm:rounded-[20px] sm:px-3.5 sm:py-2.5 ${
                      isActive
                        ? 'border-[rgba(255,190,122,0.35)] bg-[rgba(255,190,122,0.08)]'
                        : 'border-white/8 bg-black/12 hover:bg-white/6'
                    }`}
                  >
                    {isEditing ? (
                      <div>
                        <label className="block text-[11px] uppercase tracking-[0.2em] text-white/35">
                          Rename chat
                          <input
                            value={editingTitle}
                            onChange={(event) => setEditingTitle(event.target.value)}
                            className="themed-control mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
                            maxLength={80}
                            autoFocus
                          />
                        </label>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void submitRename(session.sessionId)}
                            disabled={chatActiveRequest === 'rename-session' || !editingTitle.trim()}
                            className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-medium tracking-[0.03em] text-[var(--foreground)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {chatActiveRequest === 'rename-session' ? 'Saving' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelRenaming}
                            disabled={chatActiveRequest === 'rename-session'}
                            className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-medium tracking-[0.03em] text-[var(--muted)] transition hover:bg-white/10 hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : isDeleting ? (
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          Delete this conversation?
                        </p>
                        <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                          This will permanently remove{' '}
                          <span className="font-semibold text-[var(--foreground)]">
                            {session.title}
                          </span>
                          .
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void confirmDelete(session.sessionId)}
                            disabled={chatActiveRequest === 'delete-session'}
                            className="rounded-full border border-[rgba(255,139,148,0.18)] bg-[rgba(255,139,148,0.08)] px-2 py-0.5 text-[8px] font-medium tracking-[0.03em] text-[var(--danger)] transition hover:bg-[rgba(255,139,148,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {chatActiveRequest === 'delete-session' ? 'Deleting' : 'Delete'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelDeleting}
                            disabled={chatActiveRequest === 'delete-session'}
                            className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-medium tracking-[0.03em] text-[var(--muted)] transition hover:bg-white/10 hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenConversation(session.sessionId)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                              {session.title}
                            </p>
                            <p className="mt-1 truncate text-[11px] leading-5 text-[var(--muted)]">
                              {session.lastMessage ?? 'No messages yet'}
                            </p>
                          </button>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => startRenaming(session.sessionId, session.title)}
                              disabled={
                                chatActiveRequest === 'rename-session' ||
                                chatActiveRequest === 'delete-session'
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[var(--muted)] transition hover:bg-white/10 hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Rename ${session.title}`}
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => startDeleting(session.sessionId)}
                              disabled={
                                chatActiveRequest === 'rename-session' ||
                                chatActiveRequest === 'delete-session'
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-xl border border-[rgba(255,139,148,0.18)] bg-[rgba(255,139,148,0.08)] text-[var(--danger)] transition hover:bg-[rgba(255,139,148,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Delete ${session.title}`}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {sidebarError ? (
            <div className="mt-4 rounded-2xl border border-[rgba(255,139,148,0.25)] bg-[rgba(255,139,148,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
              {sidebarError}
            </div>
          ) : null}
        </div>
      </div>

      <div className={`${sidebarSurfacePanelClass} mt-auto`}>
        <div className="space-y-3">
          <Link
            href="/"
            onClick={closeSidebar}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-white/10 sm:px-4 sm:py-3"
          >
            <HomeIcon />
            Home
          </Link>
          <button
            type="button"
            onClick={() => {
              closeSidebar();
              void handleLogout();
            }}
            disabled={authActiveRequest === 'logout'}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-soft))] px-3 py-2.5 text-sm font-semibold text-[#24171a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-3"
          >
            <LogoutIcon />
            {authActiveRequest === 'logout' ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-orb absolute left-[-8rem] top-[-7rem] h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(255,142,114,0.32),_transparent_68%)] blur-3xl" />
        <div className="ambient-orb-delayed absolute right-[-7rem] top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(130,202,220,0.26),_transparent_65%)] blur-3xl" />
      </div>

      <div className="fixed inset-0 z-40 pointer-events-none lg:hidden">
        <button
          type="button"
          onClick={closeSidebar}
          aria-label="Close navigation overlay"
          className={`absolute inset-0 bg-[rgba(11,8,14,0.62)] transition duration-300 ${
            sidebarOpen ? 'pointer-events-auto opacity-100' : 'opacity-0'
          }`}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[280px] max-w-[82vw] border-r border-white/10 bg-[rgba(17,14,24,0.94)] px-3 py-3.5 shadow-[var(--shadow)] backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[290px] sm:max-w-[84vw] sm:p-4 ${
            sidebarOpen ? 'pointer-events-auto translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-5 px-3 py-4 sm:gap-6 sm:px-6 sm:py-7 lg:px-8 lg:py-9">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[290px] shrink-0 lg:block">
          {sidebarContent}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-3 flex items-center justify-between gap-2.5 sm:mb-4 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-expanded={sidebarOpen}
                aria-label="Open navigation menu"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--foreground)] transition hover:bg-white/10 sm:h-11 sm:w-11"
              >
                <MenuIcon />
              </button>
              <Link
                href="/dashboard"
                className="font-[family-name:var(--font-heading)] text-[1.7rem] text-white sm:text-3xl"
              >
                Lovique
              </Link>
            </div>

            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            <div key={pathname} className="motion-safe:animate-[page-enter_320ms_ease]">
              {children}
            </div>
            <DeveloperFooter className="mt-5 px-1 pb-1" />
          </div>
        </div>
      </div>
    </main>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[24px] bg-white/5 ${className}`} />;
}

function ServiceWakeState({
  description,
  onRetry,
}: {
  description: string;
  onRetry: () => Promise<void>;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
      <div className="w-full rounded-[28px] border border-white/10 bg-[var(--surface)] p-5 text-center shadow-[var(--shadow)] backdrop-blur-xl sm:rounded-[32px] sm:p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-white/45">Waking up</p>
        <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl leading-none text-white sm:text-5xl">
          Lovique is getting ready.
        </h1>
        <p className="mt-5 text-[15px] leading-7 text-[var(--muted)] sm:text-base sm:leading-8">
          {description}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void onRetry()}
            className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-soft))] px-6 py-3 text-center text-sm font-semibold text-[#24171a] transition hover:brightness-105"
          >
            Try again
          </button>
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

function ConversationSkeleton() {
  return <div className="h-16 animate-pulse rounded-[20px] border border-white/8 bg-black/12" />;
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function MessageIcon() {
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
      <path d="M6 17.5 3.8 20l.5-4A7.5 7.5 0 1 1 12 19.5h-1.5" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  );
}

function SettingsIcon() {
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
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
    </svg>
  );
}

function HomeIcon() {
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
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 9.5V20h11V9.5" />
    </svg>
  );
}

function LogoutIcon() {
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
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H4" />
      <path d="M20 4v16" />
    </svg>
  );
}

function EditIcon() {
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
      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path d="m12.5 7.5 4 4" />
    </svg>
  );
}

function TrashIcon() {
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
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[12px] w-[12px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
