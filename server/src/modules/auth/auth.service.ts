// File: server/src/modules/auth/auth.service.ts
import { env } from '../../config/env';
import { PASSWORD_RESET_TTL_MS, SESSION_TTL_MS } from '../../constants/auth';
import { ApiError } from '../../utils/apiError';
import { createRandomToken, hashPassword, hashToken, verifyPassword } from '../../utils/crypto';
import { AuthRequestContext, PersistentMemory, PublicUser } from './auth.types';
import {
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UpdatePreferencesPayload,
} from './auth.validation';
import {
  COMPANION_PERSONALITY_KEYS,
  CompanionPersonality,
  DEFAULT_COMPANION_GENDER,
  DEFAULT_COMPANION_PERSONALITY,
  getCompanionGenderForUser,
  USER_GENDERS,
  UserGender,
} from './profile.constants';
import { normalizeUserMemories, serializePersistentMemories } from './user.memory';
import { ISession, Session } from './session.model';
import { IUser, User } from './user.model';

const isLocalDevelopmentResetPreviewEnabled =
  env.nodeEnv === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(env.appUrl);
const isPasswordResetEmailBridgeConfigured = Boolean(
  env.passwordResetEmailBridgeUrl && env.passwordResetEmailSecret,
);

const sendPasswordResetEmail = async ({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> => {
  if (!isPasswordResetEmailBridgeConfigured) {
    return;
  }

  try {
    const response = await fetch(env.passwordResetEmailBridgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: env.passwordResetEmailSecret,
        to,
        name,
        resetUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Password reset email bridge failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('Password reset email bridge request failed:', error);
  }
};

const normalizeLegacyGender = (value: unknown): UserGender | null => {
  return typeof value === 'string' && USER_GENDERS.includes(value as UserGender)
    ? (value as UserGender)
    : null;
};

const normalizeCompanionGender = (value: unknown): UserGender => {
  return typeof value === 'string' && USER_GENDERS.includes(value as UserGender)
    ? (value as UserGender)
    : DEFAULT_COMPANION_GENDER;
};

const normalizeCompanionPersonality = (value: unknown): CompanionPersonality => {
  return typeof value === 'string' &&
    COMPANION_PERSONALITY_KEYS.includes(value as CompanionPersonality)
    ? (value as CompanionPersonality)
    : DEFAULT_COMPANION_PERSONALITY;
};

const applyProfileDefaults = (user: IUser): void => {
  const legacyGender = normalizeLegacyGender((user as Partial<IUser>).gender);
  user.companionGender = normalizeCompanionGender(
    (user as Partial<IUser>).companionGender ??
      (legacyGender ? getCompanionGenderForUser(legacyGender) : undefined),
  );
  user.companionPersonality = normalizeCompanionPersonality(
    (user as Partial<IUser>).companionPersonality,
  );
  user.memoryFacts = normalizeUserMemories((user as Partial<IUser>).memoryFacts);
};

const serializeUser = (user: IUser): PublicUser => {
  applyProfileDefaults(user);

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    companionGender: user.companionGender,
    companionPersonality: user.companionPersonality,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
};

const createSession = async (
  user: IUser,
  meta: { userAgent?: string | null; ipAddress?: string | null },
): Promise<{ token: string; session: ISession }> => {
  const token = createRandomToken();
  const session = await Session.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    userAgent: meta.userAgent ?? null,
    ipAddress: meta.ipAddress ?? null,
  });

  return { token, session };
};

const loadUserByEmail = async (email: string): Promise<IUser | null> => {
  return User.findOne({ email });
};

export const getPublicUserById = async (userId: string): Promise<PublicUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return serializeUser(user);
};

export const registerUser = async (
  payload: RegisterPayload,
  meta: { userAgent?: string | null; ipAddress?: string | null },
): Promise<{ token: string; user: PublicUser }> => {
  const existingUser = await loadUserByEmail(payload.email);

  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const { hash, salt } = await hashPassword(payload.password);
  const user = await User.create({
    name: payload.name,
    email: payload.email,
    companionGender: payload.companionGender,
    companionPersonality: payload.companionPersonality,
    passwordHash: hash,
    passwordSalt: salt,
    lastLoginAt: new Date(),
  });

  const { token } = await createSession(user, meta);

  return {
    token,
    user: serializeUser(user),
  };
};

export const loginUser = async (
  payload: LoginPayload,
  meta: { userAgent?: string | null; ipAddress?: string | null },
): Promise<{ token: string; user: PublicUser }> => {
  const user = await loadUserByEmail(payload.email);

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isPasswordValid = await verifyPassword(payload.password, user.passwordHash, user.passwordSalt);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  applyProfileDefaults(user);
  user.lastLoginAt = new Date();
  await user.save();

  const { token } = await createSession(user, meta);

  return {
    token,
    user: serializeUser(user),
  };
};

export const logoutUser = async (token: string): Promise<void> => {
  await Session.deleteOne({ tokenHash: hashToken(token) });
};

export const getSessionContextFromToken = async (token: string): Promise<AuthRequestContext | null> => {
  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return null;
  }

  const user = await User.findById(session.userId);

  if (!user) {
    await Session.findByIdAndDelete(session._id);
    return null;
  }

  return {
    user: serializeUser(user),
    sessionId: session._id.toString(),
  };
};

export const initiatePasswordReset = async (
  email: string,
): Promise<{
  message: string;
  preview?: {
    resetToken: string;
    resetUrl: string;
    expiresAt: string;
  };
}> => {
  if (!isLocalDevelopmentResetPreviewEnabled && !isPasswordResetEmailBridgeConfigured) {
    throw new ApiError(
      503,
      'Password recovery is temporarily unavailable right now. Please try again later or contact support.',
      { code: 'password-reset-unavailable' },
    );
  }

  const user = await loadUserByEmail(email);
  const message = 'If an account exists for that email, a reset link has been generated.';

  if (!user) {
    return { message };
  }

  const resetToken = createRandomToken(24);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  const resetUrl = `${env.appUrl.replace(/\/$/, '')}/auth?mode=reset&token=${resetToken}`;

  applyProfileDefaults(user);
  user.passwordResetTokenHash = hashToken(resetToken);
  user.passwordResetExpiresAt = expiresAt;
  await user.save();

  if (isLocalDevelopmentResetPreviewEnabled) {
    console.log(`Password reset link for ${user.email}: ${resetUrl}`);
  }

  if (!isLocalDevelopmentResetPreviewEnabled) {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });
  }

  return isLocalDevelopmentResetPreviewEnabled
    ? {
        message,
        preview: {
          resetToken,
          resetUrl,
          expiresAt: expiresAt.toISOString(),
        },
      }
    : { message };
};

export const resetPassword = async (payload: ResetPasswordPayload): Promise<void> => {
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(payload.token),
    passwordResetExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(400, 'This reset link is invalid or has expired.');
  }

  const { hash, salt } = await hashPassword(payload.newPassword);

  applyProfileDefaults(user);
  user.passwordHash = hash;
  user.passwordSalt = salt;
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;

  await user.save();
  await Session.deleteMany({ userId: user._id });
};

export const changePasswordForUser = async (
  userId: string,
  currentSessionId: string,
  payload: ChangePasswordPayload,
): Promise<void> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  applyProfileDefaults(user);
  const isPasswordValid = await verifyPassword(
    payload.currentPassword,
    user.passwordHash,
    user.passwordSalt,
  );

  if (!isPasswordValid) {
    throw new ApiError(401, 'Your current password is incorrect.');
  }

  const { hash, salt } = await hashPassword(payload.newPassword);

  user.passwordHash = hash;
  user.passwordSalt = salt;
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;

  await user.save();
  await Session.deleteMany({ userId: user._id, _id: { $ne: currentSessionId } });
};

export const updateUserPreferences = async (
  userId: string,
  payload: UpdatePreferencesPayload,
): Promise<PublicUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  user.companionGender = payload.companionGender;
  user.companionPersonality = payload.companionPersonality;
  await user.save();

  return serializeUser(user);
};

export const getUserMemoriesById = async (userId: string): Promise<PersistentMemory[]> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return serializePersistentMemories((user as Partial<IUser>).memoryFacts);
};

export const clearUserMemoriesById = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  applyProfileDefaults(user);
  user.memoryFacts = [];
  await user.save();
};
