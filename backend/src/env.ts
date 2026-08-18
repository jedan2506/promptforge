import { config as dotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';

const here = dirname(fileURLToPath(import.meta.url));
dotenv({ path: resolve(here, '../../.env') });
dotenv();

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4400),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default('http://localhost:4300'),
  ADMIN_API_KEY: z.string().min(16).optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  DAILY_SPEND_CAP_USD: z.coerce.number().nonnegative().default(5),
  MONTHLY_SPEND_CAP_USD: z.coerce.number().nonnegative().default(50),
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error('[env] invalid environment configuration');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
