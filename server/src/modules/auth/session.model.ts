// File: server/src/modules/auth/session.model.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ISession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: {
        expires: 0,
      },
    },
    userAgent: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

SessionSchema.index({ userId: 1, expiresAt: 1 });

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
