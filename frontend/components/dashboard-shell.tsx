// File: frontend/components/dashboard-shell.tsx
'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';
import WorkspacePanel from './workspace-panel';

export default function DashboardShell() {
  const user = useAuthStore((state) => state.user);
  const messages = useChatStore((state) => state.messages);
  const chatBusy = useChatStore((state) => state.chatBusy);
  const chatError = useChatStore((state) => state.chatError);
  const sessionId = useChatStore((state) => state.sessionId);
  const loadChatHistory = useChatStore((state) => state.loadHistory);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const [chatInput, setChatInput] = useState('');

  const deferredMessages = useDeferredValue(messages);

  useEffect(() => {
    const hydrateHistory = async () => {
      if (!user) {
        return;
      }

      try {
        await loadChatHistory();
      } catch {
        // Chat store keeps its own error state.
      }
    };

    void hydrateHistory();
  }, [loadChatHistory, sessionId, user]);

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = chatInput.trim();

    if (!message || !user) {
      return;
    }

    setChatInput('');

    try {
      await sendMessage(message);
    } catch {
      setChatInput(message);
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
            <p className="text-sm uppercase tracking-[0.28em] text-white/45">Dashboard</p>
            <h1 className="mt-2 font-[family-name:var(--font-heading)] text-2xl text-white sm:text-3xl">
              Welcome back, {user.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-[15px]">
              Keep chatting here, and use the left sidebar to jump between recent conversations
              or start a fresh one anytime.
            </p>
          </div>
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--muted)] sm:max-w-sm">
            Your private workspace is ready.
          </div>
        </div>

        <WorkspacePanel
          chatBusy={chatBusy}
          chatError={chatError}
          chatInput={chatInput}
          deferredMessages={deferredMessages}
          user={user}
          onChatInputChange={setChatInput}
          onSendMessage={handleSendMessage}
        />
      </div>
    </section>
  );
}
