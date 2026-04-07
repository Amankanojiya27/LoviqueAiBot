// File: server/src/modules/chat/chat.types.ts
export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export interface ChatSessionSummary {
  sessionId: string;
  title: string;
  messageCount: number;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
