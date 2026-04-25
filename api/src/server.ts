import Fastify, { type FastifyError } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { accountRoutes } from './routes/accounts.js';
import { opportunityRoutes } from './routes/opportunities.js';
import { contactRoutes } from './routes/contacts.js';
import { activityRoutes } from './routes/activities.js';
import { userRoutes } from './routes/users.js';

export async function buildServer() {
  const app = Fastify({ loggerInstance: logger });

  await app.register(helmet);
  await app.register(cors, {
    origin: config.NODE_ENV === 'development' ? 'http://localhost:5173' : false,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(sensible);

  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(accountRoutes, { prefix: '/accounts' });
  await app.register(opportunityRoutes, { prefix: '/opportunities' });
  await app.register(contactRoutes, { prefix: '/contacts' });
  await app.register(activityRoutes, { prefix: '/activities' });
  await app.register(userRoutes, { prefix: '/users' });

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
