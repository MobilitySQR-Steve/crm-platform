import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  draftOutreach,
  NoTriggerNoteError,
  OutreachDisabledError,
} from '../lib/outreach/index.js';
import { requireAuth } from '../middleware/auth.js';

const IdParam = z.object({ id: z.string().cuid() });

export const outreachRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth);

  // ── POST /outreach/account/:id/draft ────────────────────────
  // Generate a first-touch outreach email for the given account.
  // Requires the account to have a triggerNote (set by enrichment or
  // manual edit). ~10-30s typical. ~$0.02 per draft (no web search).
  app.post('/account/:id/draft', async (request, reply) => {
    const idParse = IdParam.safeParse(request.params);
    if (!idParse.success) return reply.status(400).send({ error: 'invalid_id' });

    try {
      const draft = await draftOutreach(idParse.data.id, {
        triggeredBy: `user:${request.user!.id}`,
      });
      return reply.send(draft);
    } catch (err) {
      if (err instanceof OutreachDisabledError) {
        return reply.status(503).send({ error: 'outreach_disabled', message: err.message });
      }
      if (err instanceof NoTriggerNoteError) {
        return reply.status(400).send({ error: 'no_trigger_note', message: err.message });
      }
      const message = err instanceof Error ? err.message : 'unknown';
      if (message.includes('not found')) {
        return reply.status(404).send({ error: 'not_found' });
      }
      request.log.error({ err: message, accountId: idParse.data.id }, 'draft failed');
      return reply.status(500).send({ error: 'draft_failed', message });
    }
  });
};
