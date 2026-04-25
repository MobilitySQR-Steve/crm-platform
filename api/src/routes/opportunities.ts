import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { OpportunityStage, Prisma } from '@prisma/client';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { PaginationQuery } from '../lib/pagination.js';

const ListQuery = PaginationQuery.extend({
  accountId: z.string().cuid().optional(),
  ownerId: z.string().cuid().optional(),
  stage: z.nativeEnum(OpportunityStage).optional(),
});

const CreateBody = z.object({
  accountId: z.string().cuid(),
  name: z.string().trim().min(1).max(200),
  stage: z.nativeEnum(OpportunityStage).optional(),
  amountUsd: z.number().nonnegative().optional().nullable(),
  expectedCloseDate: z.coerce.date().optional().nullable(),
  ownerId: z.string().cuid().optional().nullable(),
});

const PatchBody = CreateBody.partial().omit({ accountId: true });
const IdParam = z.object({ id: z.string().cuid() });

export const opportunityRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request, reply) => {
    const parse = ListQuery.safeParse(request.query);
    if (!parse.success) return reply.status(400).send({ error: 'invalid_query', details: parse.error.flatten() });
    const { accountId, ownerId, stage, limit, offset } = parse.data;

    const where: Prisma.OpportunityWhereInput = {
      ...(accountId ? { accountId } : {}),
      ...(ownerId ? { ownerId } : {}),
      ...(stage ? { stage } : {}),
    };

    const [items, total] = await db.$transaction([
      db.opportunity.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: offset,
        take: limit,
        include: {
          account: { select: { id: true, name: true, domain: true, hqCountry: true, industry: true } },
          owner: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      db.opportunity.count({ where }),
    ]);

    return reply.send({ items, total, limit, offset });
  });

  app.post('/', async (request, reply) => {
    const parse = CreateBody.safeParse(request.body);
    if (!parse.success) return reply.status(400).send({ error: 'invalid_body', details: parse.error.flatten() });

    const account = await db.account.findUnique({ where: { id: parse.data.accountId }, select: { id: true } });
    if (!account) return reply.status(404).send({ error: 'account_not_found' });

    const opp = await db.opportunity.create({
      data: { ...parse.data, ownerId: parse.data.ownerId ?? request.user!.id },
      include: {
        account: { select: { id: true, name: true, domain: true, hqCountry: true, industry: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return reply.status(201).send(opp);
  });

  app.patch('/:id', async (request, reply) => {
    const idParse = IdParam.safeParse(request.params);
    if (!idParse.success) return reply.status(400).send({ error: 'invalid_id' });
    const bodyParse = PatchBody.safeParse(request.body);
    if (!bodyParse.success) return reply.status(400).send({ error: 'invalid_body', details: bodyParse.error.flatten() });

    try {
      const opp = await db.opportunity.update({
        where: { id: idParse.data.id },
        data: bodyParse.data,
        include: {
          account: { select: { id: true, name: true, domain: true, hqCountry: true, industry: true } },
          owner: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      return reply.send(opp);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return reply.status(404).send({ error: 'not_found' });
      }
      throw e;
    }
  });

  app.delete('/:id', async (request, reply) => {
    const parse = IdParam.safeParse(request.params);
    if (!parse.success) return reply.status(400).send({ error: 'invalid_id' });
    try {
      await db.opportunity.delete({ where: { id: parse.data.id } });
      return reply.status(204).send();
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return reply.status(404).send({ error: 'not_found' });
      }
      throw e;
    }
  });
};
