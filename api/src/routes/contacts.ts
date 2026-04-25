import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ContactPersona, Prisma } from '@prisma/client';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const ListQuery = z.object({ accountId: z.string().cuid() });

const CreateBody = z.object({
  accountId: z.string().cuid(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  title: z.string().trim().max(200).optional().nullable(),
  linkedinUrl: z.string().trim().url().max(500).optional().nullable(),
  persona: z.nativeEnum(ContactPersona).optional(),
  isPrimary: z.boolean().optional(),
});

const PatchBody = CreateBody.partial().omit({ accountId: true });
const IdParam = z.object({ id: z.string().cuid() });

export const contactRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request, reply) => {
    const parse = ListQuery.safeParse(request.query);
    if (!parse.success) return reply.status(400).send({ error: 'invalid_query' });
    const items = await db.contact.findMany({
      where: { accountId: parse.data.accountId },
      orderBy: [{ isPrimary: 'desc' }, { lastName: 'asc' }],
    });
    return reply.send({ items });
  });

  app.post('/', async (request, reply) => {
    const parse = CreateBody.safeParse(request.body);
    if (!parse.success) return reply.status(400).send({ error: 'invalid_body', details: parse.error.flatten() });
    const account = await db.account.findUnique({ where: { id: parse.data.accountId }, select: { id: true } });
    if (!account) return reply.status(404).send({ error: 'account_not_found' });
    const contact = await db.contact.create({ data: parse.data });
    return reply.status(201).send(contact);
  });

  app.patch('/:id', async (request, reply) => {
    const idParse = IdParam.safeParse(request.params);
    if (!idParse.success) return reply.status(400).send({ error: 'invalid_id' });
    const bodyParse = PatchBody.safeParse(request.body);
    if (!bodyParse.success) return reply.status(400).send({ error: 'invalid_body', details: bodyParse.error.flatten() });
    try {
      const contact = await db.contact.update({ where: { id: idParse.data.id }, data: bodyParse.data });
      return reply.send(contact);
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
      await db.contact.delete({ where: { id: parse.data.id } });
      return reply.status(204).send();
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return reply.status(404).send({ error: 'not_found' });
      }
      throw e;
    }
  });
};
