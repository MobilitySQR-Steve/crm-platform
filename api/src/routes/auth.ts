import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import type { User, UserRole } from '@prisma/client';
import { z } from 'zod';
import { db } from '../db.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { createSession, destroySession, SESSION_TTL_SECONDS } from '../lib/sessions.js';
import { SESSION_COOKIE, requireAdmin, requireAuth } from '../middleware/auth.js';
import { config } from '../config.js';

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'password must be at least 12 characters'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['ADMIN', 'USER']).optional(),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setSessionCookie(reply: FastifyReply, sessionId: string): void {
  reply.setCookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, { path: '/' });
}

function publicUser(user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role'>) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  // ── POST /auth/register ─────────────────────────────────────
  // First user (when DB is empty) bootstraps as ADMIN with no auth.
  // Every subsequent registration requires an authenticated ADMIN.
  app.post('/register', async (request, reply) => {
    const parse = RegisterBody.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'invalid_body', details: parse.error.flatten() });
    }
    const { email, password, firstName, lastName } = parse.data;

    const existingCount = await db.user.count();
    let role: UserRole = parse.data.role ?? 'USER';
    if (existingCount === 0) {
      role = 'ADMIN';
    } else {
      await requireAdmin(request, reply);
      if (reply.sent) return;
    }

    const dupe = await db.user.findUnique({ where: { email } });
    if (dupe) return reply.status(409).send({ error: 'email_taken' });

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: { email, passwordHash, firstName, lastName, role },
    });
    return reply.status(201).send({ user: publicUser(user) });
  });

  // ── POST /auth/login ────────────────────────────────────────
  app.post('/login', async (request, reply) => {
    const parse = LoginBody.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'invalid_body' });
    }
    const { email, password } = parse.data;
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      return reply.status(401).send({ error: 'invalid_credentials' });
    }
    const session = await createSession(user.id, {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    });
    setSessionCookie(reply, session.id);
    return reply.send({ user: publicUser(user) });
  });

  // ── POST /auth/logout ───────────────────────────────────────
  app.post('/logout', async (request, reply) => {
    const sid = request.cookies[SESSION_COOKIE];
    if (sid) await destroySession(sid);
    clearSessionCookie(reply);
    return reply.send({ ok: true });
  });

  // ── GET /auth/me ────────────────────────────────────────────
  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    return reply.send({ user: publicUser(request.user!) });
  });
};
