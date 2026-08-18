import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../env.js';
import { hashApiKey } from '../lib/apiKey.js';
import * as apiKeyRepo from '../repositories/apiKeyRepository.js';
import { unauthorized, forbidden } from '../lib/errors.js';

export interface AuthContext {
  keyId: string | 'admin-env';
  projectId: string | null;
  scope: 'read' | 'write' | 'admin';
  isAdmin: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

async function requireAuth(req: FastifyRequest): Promise<AuthContext> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) throw unauthorized('missing Bearer token');
  const key = header.slice(7).trim();
  if (!key) throw unauthorized('empty token');

  if (env.ADMIN_API_KEY && key === env.ADMIN_API_KEY) {
    return { keyId: 'admin-env', projectId: null, scope: 'admin', isAdmin: true };
  }

  const hash = hashApiKey(key);
  const found = await apiKeyRepo.findByHash(hash);
  if (!found) throw unauthorized('invalid api key');
  apiKeyRepo.touchLastUsed(found.id).catch(() => {});
  return {
    keyId: found.id,
    projectId: found.projectId ?? null,
    scope: (found.scope as 'read' | 'write' | 'admin') ?? 'read',
    isAdmin: false,
  };
}

export function requireScope(ctx: AuthContext, needed: 'read' | 'write' | 'admin'): void {
  const rank = { read: 1, write: 2, admin: 3 } as const;
  if (rank[ctx.scope] < rank[needed]) throw forbidden(`requires "${needed}" scope`);
}

export function requireProjectAccess(ctx: AuthContext, projectId: string): void {
  if (ctx.isAdmin) return;
  if (ctx.projectId === null) return;
  if (ctx.projectId !== projectId) throw forbidden('key not authorized for this project');
}

const authPlugin = fp(async (app: FastifyInstance) => {
  app.decorateRequest('auth', undefined);
  app.addHook('preHandler', async (req) => {
    if (req.url.startsWith('/api/health') || req.url === '/api' || req.url === '/api/') return;
    req.auth = await requireAuth(req);
  });
});

export default authPlugin;
