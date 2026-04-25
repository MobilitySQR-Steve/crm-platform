import { PrismaClient } from '@prisma/client';
import { config } from './config.js';

export const db = new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function disconnectDb() {
  await db.$disconnect();
}
