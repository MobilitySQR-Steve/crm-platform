import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  AccountSource,
  CrossBorderMovesBand,
  EmployeeBand,
  Prisma,
  PursuitStatus,
  TriggerEvent,
} from '@prisma/client';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { PaginationQuery } from '../lib/pagination.js';

// ── Schemas ───────────────────────────────────────────────────────

const ListQuery = PaginationQuery.extend({
  q: z.string().trim().min(1).optional(),
  ownerId: z.string().cuid().optional(),
  pursuit: z.nativeEnum(PursuitStatus).optional(),
  source: z.nativeEnum(AccountSource).optional(),
});

const CreateBody = z.object({
  name: z.string().trim().min(1).max(200),
  domain: z.string().trim().max(255).optional().nullable(),
  website: z.string().trim().url().max(500).optional().nullable(),
  linkedinUrl: z.string().trim().url().max(500).optional().nullable(),
  hqCountry: z.string().trim().length(2).optional().nullable(), // ISO-3166-1 alpha-2
  hqCity: z.string().trim().max(120).optional().nullable(),
  industry: z.string().trim().max(120).optional().nullable(),
  employeeBand: z.nativeEnum(EmployeeBand).optional(),
  crossBorderMovesBand: z.nativeEnum(CrossBorderMovesBand).optional(),
  countriesWithEmployees: z.array(z.string().trim().length(2)).optional(),
  currentToolingTags: z.array(z.string().trim().min(1).max(60)).optional(),
  triggerEvent: z.nativeEnum(TriggerEvent).optional(),
  triggerNote: z.string().trim().max(1000).optional().nullable(),
  pursuitStatus: z.nativeEnum(PursuitStatus).optional(),
  source: z.nativeEnum(AccountSource).optional(),
  ownerId: z.string().cuid().optional().nullable(),
});

const PatchBody = CreateBody.partial();

const IdParam = z.object({ id: z.string().cuid() });

// ── Routes ────────────────────────────────────────────────────────

export const accountRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth);

  // ── GET /accounts ──────────────────────────────────────────────
  app.get('/', async (request, reply) => {
    const parse = ListQuery.safeParse(request.query);
    if (!parse.success) return reply.status(400).send({ error: 'invalid_query', details: parse.error.flatten() });
    const { q, ownerId, pursuit, source, limit, offset } = parse.data;

    const where: Prisma.AccountWhereInput = {
      ...(ownerId ? { ownerId } : {}),
      ...(pursuit ? { pursuitStatus: pursuit } : {}),
      ...(source ? { source } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { domain: { contains: q, mode: 'insensitive' } },
              { industry: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await db.$transaction([
      db.account.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: offset,
        take: limit,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { opportunities: true, contacts: true, activities: true } },
        },
      }),
      db.account.count({ where }),
    ]);

    return reply.send({ items, total, limit, offset });
  });

  // ── GET /accounts/:id ──────────────────────────────────────────
  app.get('/:id', async (request, reply) => {
    const parse = IdParam.safeParse(request.params);
    if (!parse.success) return reply.status(400).send({ error: 'invalid_id' });

    const account = await db.account.findUnique({
      where: { id: parse.data.id },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        contacts: { orderBy: [{ isPrimary: 'desc' }, { lastName: 'asc' }] },
        opportunities: { orderBy: { updatedAt: 'desc' } },
        activities: {
          orderBy: { occurredAt: 'desc' },
          take: 25,
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        enrichmentRuns: {
          orderBy: { startedAt: 'desc' },
          take: 10,
          select: { id: true, kind: true, status: true, startedAt: true, finishedAt: true, fieldsUpdated: true, confidence: true, modelUsed: true, errorMessage: true },
        },
      },
    });
    if (!account) return reply.status(404).send({ error: 'not_found' });
    return reply.send(account);
  });

  // ── POST /accounts ─────────────────────────────────────────────
  app.post('/', async (request, reply) => {
    const parse = CreateBody.safeParse(request.body);
    if (!parse.success) return reply.status(400).send({ error: 'invalid_body', details: parse.error.flatten() });

    const account = await db.account.create({
      data: {
        ...parse.data,
        ownerId: parse.data.ownerId ?? request.user!.id,
        source: parse.data.source ?? AccountSource.MANUAL,
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { opportunities: true, contacts: true, activities: true } },
      },
    });
    return reply.status(201).send(account);
  });

  // ── PATCH /accounts/:id ────────────────────────────────────────
  app.patch('/:id', async (request, reply) => {
    const idParse = IdParam.safeParse(request.params);
    if (!idParse.success) return reply.status(400).send({ error: 'invalid_id' });
    const bodyParse = PatchBody.safeParse(request.body);
    if (!bodyParse.success) return reply.status(400).send({ error: 'invalid_body', details: bodyParse.error.flatten() });

    try {
      const account = await db.account.update({
        where: { id: idParse.data.id },
        data: bodyParse.data,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { opportunities: true, contacts: true, activities: true } },
        },
      });
      return reply.send(account);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return reply.status(404).send({ error: 'not_found' });
      }
      throw e;
    }
  });

  // ── DELETE /accounts/:id ───────────────────────────────────────
  app.delete('/:id', async (request, reply) => {
    const parse = IdParam.safeParse(request.params);
    if (!parse.success) return reply.status(400).send({ error: 'invalid_id' });
    try {
      await db.account.delete({ where: { id: parse.data.id } });
      return reply.status(204).send();
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return reply.status(404).send({ error: 'not_found' });
      }
      throw e;
    }
  });
};
