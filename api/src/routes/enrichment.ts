import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  EnrichmentDisabledError,
  enrichAccount,
  sourceAccounts,
} from '../lib/enrichment/index.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const EnrichBody = z.object({ force: z.boolean().optional() }).optional();
const SourceBody = z.object({
  count: z.number().int().min(1).max(20).default(10),
  hint: z.string().max(500).optional(),
});

export const enrichmentRoutes: FastifyPluginAsync = async (app) => {
  // ── POST /enrichment/account/:id ────────────────────────────
  // Trigger enrichment for one account. Any authenticated user.
  // Long-running (30-60s typical with web search).
  app.post('/account/:id', { preHandler: requireAuth }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const bodyParse = EnrichBody.safeParse(request.body);
    if (!bodyParse.success) {
      return reply.status(400).send({ error: 'invalid_body' });
    }
    try {
      const result = await enrichAccount(id, {
        force: bodyParse.data?.force,
        triggeredBy: `user:${request.user!.id}`,
      });
      return reply.send(result);
    } catch (err) {
      if (err instanceof EnrichmentDisabledError) {
        return reply.status(503).send({ error: 'enrichment_disabled', message: err.message });
      }
      const message = err instanceof Error ? err.message : 'unknown';
      if (message.includes('not found')) {
        return reply.status(404).send({ error: 'not_found' });
      }
      request.log.error({ err: message, accountId: id }, 'enrichment failed');
      return reply.status(500).send({ error: 'enrichment_failed', message });
    }
  });

  // ── POST /enrichment/source ─────────────────────────────────
  // Source N new ICP-matching accounts. Admin only — creates rows.
  app.post('/source', { preHandler: requireAdmin }, async (request, reply) => {
    const parse = SourceBody.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'invalid_body', details: parse.error.flatten() });
    }
    try {
      const result = await sourceAccounts({
        count: parse.data.count,
        hint: parse.data.hint,
        triggeredBy: `user:${request.user!.id}`,
      });
      return reply.send(result);
    } catch (err) {
      if (err instanceof EnrichmentDisabledError) {
        return reply.status(503).send({ error: 'enrichment_disabled', message: err.message });
      }
      const message = err instanceof Error ? err.message : 'unknown';
      request.log.error({ err: message }, 'sourcing failed');
      return reply.status(500).send({ error: 'sourcing_failed', message });
    }
  });
};
