import type { FastifyInstance } from 'fastify';
import { sql } from '../db/index.js';

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/health/live', async () => ({ ok: true }));

  app.get('/health/ready', async (_req, reply) => {
    try {
      await sql`select 1`;
      return { ok: true, checks: { db: 'ok' } };
    } catch (err) {
      reply.code(503);
      return { ok: false, checks: { db: err instanceof Error ? err.message : String(err) } };
    }
  });
}
