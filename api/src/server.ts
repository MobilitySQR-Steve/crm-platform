import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { healthRoutes } from './routes/health.js';

export async function buildServer() {
  const app = Fastify({ loggerInstance: logger });

  await app.register(helmet);
  await app.register(cors, {
    origin: config.NODE_ENV === 'development' ? 'http://localhost:5173' : false,
    credentials: true,
  });
  await app.register(sensible);

  await app.register(healthRoutes, { prefix: '/health' });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error({ err: error }, 'request errored');
    if (reply.sent) return;
    const status = error.statusCode ?? 500;
    if (status < 500) {
      reply.status(status).send({ error: error.message });
      return;
    }
    reply.status(500).send({ error: 'internal_server_error' });
  });

  return app;
}
