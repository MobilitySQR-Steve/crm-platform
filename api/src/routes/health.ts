import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db.js';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => ({ status: 'ok', uptime: process.uptime() }));

  app.get('/db', async () => {
    await db.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'reachable' };
  });
};
