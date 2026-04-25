import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ActivityType, Prisma } from '@prisma/client';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { PaginationQuery } from '../lib/pagination.js';

const ListQuery = PaginationQuery.extend({
  accountId: z.string().cuid().optional(),
  opportunityId: z.string().cuid().optional(),
});

const CreateBody = z.object({
  accountId: z.string().cuid(),
  opportunityId: z.string().cuid().optional().nullable(),
  type: z.nativeEnum(ActivityType),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().max(5000).optional().nullable(),
  occurredAt: z.coerce.date().optional(),
});

export const activityRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request, reply) => {
    const parse = ListQuery.safeParse(request.query);
    if (!parse.success) return reply.status(400).send({ error: 'invalid_query' });
    const { accountId, opportunityId, limit, offset } = parse.data;

    const where: Prisma.ActivityWhereInput = {
      ...(accountId ? { accountId } : {}),
      ...(opportunityId ? { opportunityId } : {}),
    };

    const [items, total] = await db.$transaction([
      db.activity.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: offset,
        take: limit,
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      }),
      db.activity.count({ where }),
    ]);
    return reply.send({ items, total, limit, offset });
  });

  app.post('/', async (request, reply) => {
    const parse = CreateBody.safeParse(request.body);
    if (!parse.success) return reply.status(400).send({ error: 'invalid_body', details: parse.error.flatten() });
    const account = await db.account.findUnique({ where: { id: parse.data.accountId }, select: { id: true } });
    if (!account) return reply.status(404).send({ error: 'account_not_found' });

    const activity = await db.activity.create({
      data: { ...parse.data, userId: request.user!.id },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    return reply.status(201).send(activity);
  });
};
