// File: frontend/components/settings-shell.tsx
'use client';

import { useEffect, useState } from 'react';
import { extractErrorMessage, getServiceToastTitle, isServiceToastWorthyError } from '@/lib/error-helpers';
import type { CompanionPersonality, UserGender } from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';
import { showToast } from '@/stores/toast-store';
import SettingsPanel from './settings-panel';

const formatTimestamp = (value: string | null): string => {
  if (!value) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function SettingsShell() {
  const user = useAuthStore((state) => state.user);
  const authActiveRequest = useAuthStore((state) => state.activeRequest);
  const changePassword = useAuthStore((state) => state.changePassword);
  const updatePreferences = useAuthStore((state) => state.updatePreferences);
  const memories = useChatStore((state) => state.memories);
  const chatActiveRequest = useChatStore((state) => state.activeRequest);
  const loadPersistentMemories = useChatStore((state) => state.loadMemories);
  const clearMemories = useChatStore((state) => state.clearMemories);
  const [notice, setNotice] = useState(
    'Manage your account, companion preferences, and memory here.',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [preferencesForm, setPreferencesForm] = useState<{
    companionGender: UserGender;
    companionPersonality: CompanionPersonality;
  } | null>(null);
  const resolvedPreferencesForm = preferencesForm ?? {
    companionGender: user?.companionGender ?? ('female' as UserGender),
    companionPersonality: user?.companionPersonality ?? ('sweet' as CompanionPersonality),
  };

  useEffect(() => {
    let active = true;

    const hydrateMemories = async () => {
      if (!user) {
        return;
      }

      try {
        await loadPersistentMemories();
      } catch (error) {
        if (active) {
          setErrorMessage(extractErrorMessage(error));

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

    void hydrateMemories();

    return () => {
      active = false;
    };
  }, [loadPersistentMemories, user]);

  const handleClearMemories = async () => {
    setErrorMessage('');
    setNotice('Clearing long-term memory...');

    try {
      await clearMemories();
      setNotice('Long-term memory cleared.');
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setNotice('We could not clear the remembered notes.');

      if (isServiceToastWorthyError(error)) {
        showToast({
          tone: 'error',
          title: getServiceToastTitle(error),
          message: extractErrorMessage(error),
        });
      }
    }
  };

  const handlePreferencesSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setNotice('Saving companion preferences...');

    try {
      const refreshedUser = await updatePreferences(resolvedPreferencesForm);
      setPreferencesForm({
        companionGender: refreshedUser.companionGender,
        companionPersonality: refreshedUser.companionPersonality,
      });
      setNotice('Companion preferences saved.');
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setNotice('We could not save your companion preferences.');

      if (isServiceToastWorthyError(error)) {
        showToast({
          tone: 'error',
          title: getServiceToastTitle(error),
          message: extractErrorMessage(error),
        });
      }
    }
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setNotice('Saving your new password...');

    try {
      await changePassword({
        currentPassword: changePasswordForm.currentPassword,
        newPassword: changePasswordForm.newPassword,
      });

      setChangePasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setNotice('Password changed successfully.');
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setNotice('The password change could not be completed.');

      if (isServiceToastWorthyError(error)) {
        showToast({
          tone: 'error',
          title: getServiceToastTitle(error),
          message: extractErrorMessage(error),
        });
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-[var(--surface-strong)] shadow-[var(--shadow)] backdrop-blur-xl sm:rounded-[32px] sm:p-6">
      <div className="rounded-[24px] border border-white/8 bg-black/12 p-4 sm:rounded-[28px] sm:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-white/45">Settings</p>
            <h1 className="mt-2 font-[family-name:var(--font-heading)] text-2xl text-white sm:text-3xl">
              Your settings space
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-[15px]">
              Update your account details, fine-tune your companion, and manage the memory
              Lovique keeps for future conversations.
            </p>
          </div>
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--muted)] sm:max-w-sm">
            {notice}
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-5 rounded-2xl border border-[rgba(255,139,148,0.25)] bg-[rgba(255,139,148,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {errorMessage}
          </div>
        ) : null}

        <SettingsPanel
          activeRequest={authActiveRequest ?? chatActiveRequest}
          changePasswordForm={changePasswordForm}
          formatTimestamp={formatTimestamp}
          memories={memories}
          preferencesForm={resolvedPreferencesForm}
          user={user}
          onChangePasswordChange={(field, value) =>
            setChangePasswordForm((current) => ({
              ...current,
              [field]: value,
            }))
          }
          onChangePasswordSubmit={handleChangePassword}
          onClearMemories={handleClearMemories}
          onPreferenceChange={(field, value) =>
            setPreferencesForm((current) => ({
              ...(current ?? resolvedPreferencesForm),
              [field]: value,
            }))
          }
          onPreferencesSubmit={handlePreferencesSubmit}
        />
      </div>
    </section>
  );
}
