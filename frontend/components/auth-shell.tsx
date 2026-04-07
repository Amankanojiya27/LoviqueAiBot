// File: frontend/components/auth-shell.tsx
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useEffect, useState } from 'react';
import { extractErrorMessage, getServiceToastTitle, isServiceToastWorthyError } from '@/lib/error-helpers';
import type {
  AuthMode,
  CompanionPersonality,
  UserGender,
} from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';
import { showToast } from '@/stores/toast-store';
import AuthPanel from './auth-panel';
import DeveloperFooter from './developer-footer';
import ThemeToggle from './theme-toggle';

const parseMode = (value: string | null): AuthMode => {
  return value === 'register' || value === 'forgot' || value === 'reset' ? value : 'login';
};

const buildAuthHref = (mode: AuthMode, token?: string): string => {
  const params = new URLSearchParams();

  if (mode !== 'login') {
    params.set('mode', mode);
  }

  if (mode === 'reset' && token) {
    params.set('token', token);
  }

  const query = params.toString();
  return query ? `/auth?${query}` : '/auth';
};

const formatTimestamp = (value: string | null): string => {
  if (!value) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function AuthShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionBooting = useAuthStore((state) => state.sessionBooting);
  const activeRequest = useAuthStore((state) => state.activeRequest);
  const resetPreview = useAuthStore((state) => state.resetPreview);
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);
  const register = useAuthStore((state) => state.register);
  const login = useAuthStore((state) => state.login);
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const clearResetPreview = useAuthStore((state) => state.clearResetPreview);
  const mode = parseMode(searchParams.get('mode'));
  const requestedToken = searchParams.get('token') ?? '';

  const [notice, setNotice] = useState('Sign in or create an account to open your private workspace.');
  const [errorMessage, setErrorMessage] = useState('');

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    companionGender: 'female' as UserGender,
    companionPersonality: 'sweet' as CompanionPersonality,
    password: '',
    confirmPassword: '',
    isAdultConfirmed: false,
  });

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [forgotForm, setForgotForm] = useState({
    email: '',
  });

  const [resetForm, setResetForm] = useState({
    token: '',
    newPassword: '',
    confirmPassword: '',
  });
  const resolvedResetForm = {
    ...resetForm,
    token: resetForm.token || requestedToken,
  };

  const heroContent =
    mode === 'register'
      ? {
          eyebrow: 'Create account',
          title: 'Start your Lovique space.',
          description:
            'Create your account to save your place, return anytime, and keep your conversations connected to you. Lovique is currently available only to adults aged 18 or older.',
        }
      : mode === 'forgot'
        ? {
            eyebrow: 'Recover access',
            title: 'Get back into your account.',
            description:
              'Enter your email and we will help you reset your password so you can continue where you left off.',
          }
        : mode === 'reset'
          ? {
              eyebrow: 'Choose a new password',
              title: 'You are one step away.',
              description:
                'Set a fresh password, sign back in, and return to your private conversation space.',
            }
          : {
              eyebrow: 'Welcome back',
              title: 'Sign in and pick up where you left off.',
              description:
                'Your account keeps your space personal and ready whenever you want to return.',
            };

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const user = await loadCurrentUser();

        if (user && active) {
          router.replace('/dashboard');
          return;
        }
      } catch (error) {
        if (active && isServiceToastWorthyError(error)) {
          showToast({
            tone: 'error',
            title: getServiceToastTitle(error),
            message: extractErrorMessage(error),
          });
        }
      }
    };

    void checkSession();

    return () => {
      active = false;
    };
  }, [loadCurrentUser, router]);

  const changeMode = (nextMode: AuthMode) => {
    setErrorMessage('');
    setNotice(
      nextMode === 'forgot'
        ? 'Enter your email and we will prepare a password reset link.'
        : nextMode === 'reset'
          ? 'Choose a new password to get back into your account.'
          : nextMode === 'register'
            ? 'Create your account and head straight into your dashboard.'
            : 'Welcome back. Sign in to continue your conversation.',
    );
    router.replace(buildAuthHref(nextMode, nextMode === 'reset' ? resolvedResetForm.token : undefined));
  };

  const goToDashboard = () => {
    startTransition(() => {
      router.push('/dashboard');
    });
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!registerForm.isAdultConfirmed) {
      setErrorMessage('Please confirm that you are 18 or older to create a Lovique account.');
      return;
    }

    setNotice('Creating your account...');

    try {
      await register({
        name: registerForm.name,
        email: registerForm.email,
        companionGender: registerForm.companionGender,
        companionPersonality: registerForm.companionPersonality,
        password: registerForm.password,
        isAdultConfirmed: registerForm.isAdultConfirmed,
      });

      goToDashboard();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setNotice('We could not create your account yet.');

      if (isServiceToastWorthyError(error)) {
        showToast({
          tone: 'error',
          title: getServiceToastTitle(error),
          message: extractErrorMessage(error),
        });
      }
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setNotice('Signing you in...');

    try {
      await login(loginForm);
      goToDashboard();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setNotice('That sign-in attempt did not go through.');

      if (isServiceToastWorthyError(error)) {
        showToast({
          tone: 'error',
          title: getServiceToastTitle(error),
          message: extractErrorMessage(error),
        });
      }
    }
  };

  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setNotice('Preparing a reset link...');

    try {
      const preview = await forgotPassword(forgotForm.email);
      setResetForm((current) => ({
        ...current,
        token: preview?.resetToken ?? current.token,
      }));
      if (preview) {
        router.replace(buildAuthHref('reset', preview.resetToken));
        setNotice('Your local reset preview is ready below.');
      } else {
        router.replace(buildAuthHref('forgot'));
        setNotice(
          'If the account exists, a password reset email has been sent. Check your inbox and spam folder for the reset link.',
        );
      }
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setNotice('We could not prepare the reset flow.');

      if (isServiceToastWorthyError(error)) {
        showToast({
          tone: 'error',
          title: getServiceToastTitle(error),
          message: extractErrorMessage(error),
        });
      }
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setNotice('Updating your password...');

    try {
      await resetPassword({
        token: resolvedResetForm.token,
        newPassword: resolvedResetForm.newPassword,
      });

      clearResetPreview();
      setResetForm({
        token: '',
        newPassword: '',
        confirmPassword: '',
      });
      router.replace('/auth');
      setNotice('Password updated. You can sign in now.');
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setNotice('The reset token was invalid or expired.');

      if (isServiceToastWorthyError(error)) {
        showToast({
          tone: 'error',
          title: getServiceToastTitle(error),
          message: extractErrorMessage(error),
        });
      }
    }
  };

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
              href="/"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-center text-sm text-[var(--muted)] transition hover:bg-white/8"
            >
              Back to home
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-start gap-6 py-8 sm:gap-8 sm:py-12 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="order-1 rounded-[28px] border border-white/10 bg-[var(--surface-strong)] shadow-[var(--shadow)] backdrop-blur-xl sm:rounded-[32px] xl:order-2">
            <div className="rounded-[24px] border border-white/8 bg-black/12 p-4 sm:rounded-[28px] sm:p-6">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-white/45">Account access</p>
                  <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl text-white sm:text-3xl">
                    {sessionBooting ? 'Checking session' : heroContent.title}
                  </h2>
                </div>
                <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--muted)] sm:max-w-sm">
                  {sessionBooting ? 'Checking whether you are already signed in...' : notice}
                </div>
              </div>

              {errorMessage ? (
                <div className="mb-5 rounded-2xl border border-[rgba(255,139,148,0.25)] bg-[rgba(255,139,148,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
                  {errorMessage}
                </div>
              ) : null}

              {sessionBooting ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <SkeletonBlock className="h-44" />
                  <SkeletonBlock className="h-44" />
                </div>
              ) : (
                <AuthPanel
                  activeRequest={activeRequest}
                  forgotForm={forgotForm}
                  formatTimestamp={formatTimestamp}
                  loginForm={loginForm}
                  mode={mode}
                  onForgotChange={(value) => setForgotForm({ email: value })}
                  onForgotSubmit={handleForgotPassword}
                  onLoginChange={(field, value) =>
                    setLoginForm((current) => ({
                      ...current,
                      [field]: value,
                    }))
                  }
                  onLoginSubmit={handleLogin}
                  onModeChange={changeMode}
                  onRegisterChange={(field, value) =>
                    setRegisterForm((current) => ({
                      ...current,
                      [field]: field === 'isAdultConfirmed' ? value === 'true' : value,
                    }))
                  }
                  onRegisterSubmit={handleRegister}
                  onResetChange={(field, value) =>
                    setResetForm((current) => ({
                      ...current,
                      [field]: value,
                    }))
                  }
                  onResetSubmit={handleResetPassword}
                  registerForm={registerForm}
                  resetForm={resolvedResetForm}
                  resetPreview={resetPreview}
                />
              )}
            </div>
          </section>

          <div className="order-2 rounded-[28px] border border-white/10 bg-[var(--surface)] p-5 shadow-[var(--shadow)] backdrop-blur-xl sm:rounded-[32px] sm:p-8 xl:order-1">
            <span className="inline-flex w-fit rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[var(--eyebrow-text)]">
              {heroContent.eyebrow}
            </span>
            <h1 className="mt-6 font-[family-name:var(--font-heading)] text-4xl leading-none text-white sm:text-5xl">
              {heroContent.title}
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-[var(--muted)] sm:text-base sm:leading-8">
              {heroContent.description}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Stat value="Fast" label="Simple login and account creation" />
              <Stat value="Private" label="Personal sessions and account recovery" />
              <Stat value="18+" label="Adults-only access right now" />
            </div>
          </div>
        </section>

        <DeveloperFooter className="pb-2" />
      </div>
    </main>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[24px] bg-white/5 ${className}`} />;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="font-[family-name:var(--font-heading)] text-3xl text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{label}</p>
    </div>
  );
}
