import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Override parent-process env vars with .env values. Without this, an
// empty `ANTHROPIC_API_KEY=` exported in the user's shell silently
// shadows the real key in api/.env (default dotenv behavior is "first
// definition wins"). In production env vars come from the host, not
// .env, so this is dev-only behavior.
loadEnv({ override: true });

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

  // Production CORS allowlist. In dev we hardcode http://localhost:5173.
  // In prod set this to the deployed frontend origin (e.g. the Vercel URL).
  // Comma-separated to allow multiple origins.
  ALLOWED_ORIGIN: z.string().optional(),
});

const parsed = Schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
