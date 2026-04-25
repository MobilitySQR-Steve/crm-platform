import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth);

  // Minimal user list — for owner-picker dropdowns. No passwords / sessions.
  app.get('/', async (_request, reply) => {
    const items = await db.user.findMany({
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
    return reply.send({ items });
  });
};
