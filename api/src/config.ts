import 'dotenv/config';
import { z } from 'zod';

const Schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),

  // Optional — enrichment service is disabled when missing.
  // Empty string treated as missing so .env.example with `ANTHROPIC_API_KEY=`
  // doesn't fail validation.
  ANTHROPIC_API_KEY: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().min(1).optional(),
  ),
  ENRICHMENT_MODEL: z.string().default('claude-sonnet-4-6'),
});

const parsed = Schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
