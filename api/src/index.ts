import { buildServer } from './server.js';
import { config } from './config.js';
import { disconnectDb } from './db.js';
import { logger } from './lib/logger.js';

async function main() {
  const app = await buildServer();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    await app.close();
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
  } catch (err) {
    logger.error({ err }, 'failed to start');
    process.exit(1);
  }
}

void main();
