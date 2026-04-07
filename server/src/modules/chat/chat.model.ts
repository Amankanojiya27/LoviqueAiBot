// File: server/src/modules/chat/chat.model.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { ChatMessage } from './chat.types';

export interface IChatSession extends Document {
  userId: Types.ObjectId;
  sessionId: string;
  title: string | null;
  history: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<ChatMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'model'],
      required: true,
    },
    parts: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: null,
      trim: true,
      maxlength: 80,
    },
    history: {
      type: [ChatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

ChatSessionSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

export const ChatSession: Model<IChatSession> =
  mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
