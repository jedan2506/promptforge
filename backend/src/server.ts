import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { env } from './env.js';
import { AppError } from './lib/errors.js';
import authPlugin from './plugins/auth.js';
import healthRoutes from './routes/health.js';
import projectRoutes from './routes/projects.js';
import promptRoutes from './routes/prompts.js';
import apiKeysRoutes from './routes/apiKeys.js';
import evalRoutes from './routes/evals.js';
import { closeDb } from './db/index.js';

export function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'production'
        ? { level: env.LOG_LEVEL }
        : {
            level: env.LOG_LEVEL,
            transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname' } },
          },
    disableRequestLogging: false,
    trustProxy: true,
  });

  app.register(helmet, { contentSecurityPolicy: false });
  app.register(cors, { origin: env.CORS_ORIGIN.split(','), credentials: false });
  app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.headers.authorization ?? req.ip,
  });
  app.register(authPlugin);

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof AppError) {
      return reply.code(err.status).send({
        error: { code: err.code, message: err.message, details: err.details },
      });
    }
    if (err instanceof ZodError) {
      return reply.code(400).send({
        error: { code: 'validation_error', message: 'invalid request', details: err.flatten() },
      });
    }
    if ((err as { statusCode?: number }).statusCode === 429) {
      const msg = err instanceof Error ? err.message : 'rate limited';
      return reply.code(429).send({ error: { code: 'rate_limited', message: msg } });
    }
    app.log.error(err);
    return reply.code(500).send({ error: { code: 'internal', message: 'internal server error' } });
  });

  app.register(healthRoutes, { prefix: '/api' });
  app.register(async (r) => {
    await r.register(projectRoutes);
    await r.register(promptRoutes);
    await r.register(apiKeysRoutes);
    await r.register(evalRoutes);
  }, { prefix: '/api' });

  app.get('/api', async () => ({ name: 'promptforge', version: '0.1.0' }));

  return app;
}

async function main() {
  const app = buildApp();
  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutting down');
    await app.close();
    await closeDb();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`PromptForge backend listening on http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
