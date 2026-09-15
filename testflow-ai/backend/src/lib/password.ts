import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/** AD-006: standard, well-established credential-handling library — no custom crypto. */
export function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
