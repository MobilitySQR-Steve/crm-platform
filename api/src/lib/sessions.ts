import { db } from '../db.js';

const SESSION_TTL_DAYS = 30;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

export async function createSession(
  userId: string,
  opts?: { userAgent?: string | undefined; ipAddress?: string | undefined },
) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  return db.session.create({
    data: {
      userId,
      expiresAt,
      userAgent: opts?.userAgent ?? null,
      ipAddress: opts?.ipAddress ?? null,
    },
  });
}

export async function findValidSession(sessionId: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: sessionId } }).catch(() => {});
    return null;
  }
  return session;
}

export async function destroySession(sessionId: string) {
  await db.session.delete({ where: { id: sessionId } }).catch(() => {});
}
