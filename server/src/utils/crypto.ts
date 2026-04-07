// File: server/src/utils/crypto.ts
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export const createRandomToken = (size = 48): string => {
  return randomBytes(size).toString('hex');
};

export const hashToken = (value: string): string => {
  return createHash('sha256').update(value).digest('hex');
};

export const hashPassword = async (
  password: string,
): Promise<{
  hash: string;
  salt: string;
}> => {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
};

export const verifyPassword = async (
  password: string,
  expectedHash: string,
  salt: string,
): Promise<boolean> => {
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (expectedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, derivedKey);
};
