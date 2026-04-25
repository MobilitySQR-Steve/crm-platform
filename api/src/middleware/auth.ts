import type { FastifyRequest, FastifyReply } from 'fastify';
import type { User } from '@prisma/client';
import { findValidSession } from '../lib/sessions.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    sessionId?: string;
  }
}

export const SESSION_COOKIE = 'crm_session';

/** Populates request.user / request.sessionId if a valid cookie is present. Never throws. */
export async function loadUser(request: FastifyRequest): Promise<void> {
  const sid = request.cookies[SESSION_COOKIE];
  if (!sid) return;
  const session = await findValidSession(sid);
  if (!session) return;
  request.user = session.user;
  request.sessionId = session.id;
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await loadUser(request);
  if (!request.user) {
    reply.status(401).send({ error: 'unauthorized' });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await loadUser(request);
  if (!request.user) {
    reply.status(401).send({ error: 'unauthorized' });
    return;
  }
  if (request.user.role !== 'ADMIN') {
    reply.status(403).send({ error: 'forbidden' });
  }
}
