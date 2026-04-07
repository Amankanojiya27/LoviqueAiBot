// File: frontend/components/workspace-panel.tsx
'use client';

import {
  getCompanionLabel,
  getGenderLabel,
  getPersonalityLabel,
} from '@/lib/companion-preferences';
import type { ChatMessage, SessionUser } from '@/lib/types';

interface WorkspacePanelProps {
  chatBusy: boolean;
  chatError: string;
  chatInput: string;
  deferredMessages: ChatMessage[];
  user: SessionUser;
  onChatInputChange: (value: string) => void;
  onSendMessage: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function WorkspacePanel({
  chatBusy,
  chatError,
  chatInput,
  deferredMessages,
  user,
  onChatInputChange,
  onSendMessage,
}: WorkspacePanelProps) {
  return (
    <section className="rounded-[22px] border border-white/10 bg-white/5 p-4 sm:rounded-[26px] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">Conversation</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Your chat space</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[var(--accent-cool)]">
          {chatBusy
            ? 'Thinking'
            : `${getGenderLabel(user.companionGender)} / ${getPersonalityLabel(user.companionPersonality)}`}
        </span>
      </div>

      <div className="message-scroll mt-5 flex max-h-[420px] min-h-[280px] flex-col gap-3 overflow-y-auto pr-1 sm:max-h-[520px] sm:min-h-[360px] sm:pr-2">
        {deferredMessages.length === 0 ? (
          <div className="flex h-full min-h-[240px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/14 p-5 text-center text-sm leading-7 text-[var(--muted)] sm:min-h-[320px] sm:p-8">
            Your {getCompanionLabel(user.companionGender).toLowerCase()} is ready. Start with a
            hello, share your day, or ease into a longer conversation whenever you want.
          </div>
        ) : (
          deferredMessages.map((entry, index) => (
            <div
              key={`${entry.role}-${index}`}
              className={`max-w-[92%] rounded-[24px] px-4 py-3 text-sm leading-7 shadow-lg sm:max-w-[85%] ${
                entry.role === 'user'
                  ? 'ml-auto bg-[linear-gradient(135deg,rgba(255,142,114,0.9),rgba(255,190,122,0.88))] text-[#24161a]'
                  : 'border border-white/10 bg-[rgba(255,255,255,0.06)] text-[var(--foreground)]'
              }`}
            >
              {entry.parts}
            </div>
          ))
        )}

        {chatBusy ? (
          <div className="max-w-[85%] rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-[var(--muted)]">
            Lovique is typing...
          </div>
        ) : null}
      </div>

      {chatError ? (
        <div className="mt-4 rounded-2xl border border-[rgba(255,139,148,0.25)] bg-[rgba(255,139,148,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {chatError}
        </div>
      ) : null}

      <form onSubmit={onSendMessage} className="mt-5 space-y-3">
        <label className="block text-sm text-[var(--muted)]">
          Message
          <textarea
            value={chatInput}
            onChange={(event) => onChatInputChange(event.target.value)}
            rows={4}
            placeholder={`Message your ${getPersonalityLabel(user.companionPersonality).toLowerCase()} companion...`}
            className="themed-control mt-2 w-full rounded-[24px] border px-4 py-3 text-[15px] outline-none transition"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs uppercase tracking-[0.22em] text-white/35">Private workspace</p>
          <button
            type="submit"
            disabled={chatBusy || !chatInput.trim()}
            className="w-full rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-soft))] px-5 py-3 text-sm font-semibold text-[#24171a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {chatBusy ? 'Sending...' : 'Send message'}
          </button>
        </div>
      </form>
    </section>
  );
}
