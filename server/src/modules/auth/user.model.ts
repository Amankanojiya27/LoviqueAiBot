// File: server/src/modules/auth/user.model.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  COMPANION_PERSONALITY_KEYS,
  CompanionPersonality,
  DEFAULT_COMPANION_GENDER,
  DEFAULT_COMPANION_PERSONALITY,
  USER_GENDERS,
  UserGender,
} from './profile.constants';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  gender?: UserGender;
  companionGender: UserGender;
  companionPersonality: CompanionPersonality;
  memoryFacts: IUserMemoryEntry[];
  passwordHash: string;
  passwordSalt: string;
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMemoryEntry {
  id: string;
  fact: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserMemorySchema = new Schema<IUserMemoryEntry>(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    fact: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: USER_GENDERS,
      required: false,
    },
    companionGender: {
      type: String,
      enum: USER_GENDERS,
      required: true,
      default: DEFAULT_COMPANION_GENDER,
    },
    companionPersonality: {
      type: String,
      enum: COMPANION_PERSONALITY_KEYS,
      required: true,
      default: DEFAULT_COMPANION_PERSONALITY,
    },
    memoryFacts: {
      type: [UserMemorySchema],
      default: [],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    passwordSalt: {
      type: String,
      required: true,
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
