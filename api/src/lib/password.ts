import argon2 from 'argon2';

// OWASP 2026 recommended argon2id parameters for interactive auth.
const HASH_OPTS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

const PLACEHOLDER = '__set_in_auth_step__';

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, HASH_OPTS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  if (!hash || hash === PLACEHOLDER) return false;
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

export const PASSWORD_PLACEHOLDER = PLACEHOLDER;
