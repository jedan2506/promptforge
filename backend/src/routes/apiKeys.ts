import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ApiKeyCreate, type ApiKeyDTO } from '@promptforge/shared';
import * as apiKeyRepo from '../repositories/apiKeyRepository.js';
import * as projectRepo from '../repositories/projectRepository.js';
import { generateApiKey } from '../lib/apiKey.js';
import { badRequest, notFound } from '../lib/errors.js';
import { requireScope } from '../plugins/auth.js';

function toDTO(row: apiKeyRepo.ApiKeyRow): ApiKeyDTO {
  return {
    id: row.id,
    projectId: row.projectId ?? null,
    name: row.name,
    scope: row.scope as ApiKeyDTO['scope'],
    keyPreview: row.keyPreview,
    lastUsedAt: row.lastUsedAt ? row.lastUsedAt.getTime() : null,
    createdAt: row.createdAt.getTime(),
  };
}

const CreateBody = ApiKeyCreate.extend({
  projectSlug: z.string().optional(),
});

export default async function apiKeysRoutes(app: FastifyInstance) {
  app.get('/keys', async (req) => {
    requireScope(req.auth!, 'admin');
    const rows = await apiKeyRepo.list();
    const visible = rows.filter((r) => !r.revoked);
    return { items: visible.map(toDTO) };
  });

  app.post('/keys', async (req, reply) => {
    requireScope(req.auth!, 'admin');
    const body = CreateBody.parse(req.body);
    let projectId: string | null = null;
    if (body.projectSlug) {
      const p = await projectRepo.findBySlug(body.projectSlug);
      if (!p) throw badRequest(`project "${body.projectSlug}" not found`);
      projectId = p.id;
    }
    const { plaintext, hash, preview } = generateApiKey();
    const row = await apiKeyRepo.create({
      name: body.name,
      scope: body.scope,
      projectId,
      keyHash: hash,
      keyPreview: preview,
    });
    reply.code(201);
    return { ...toDTO(row), plaintextKey: plaintext };
  });

  app.delete('/keys/:id', async (req, reply) => {
    requireScope(req.auth!, 'admin');
    const { id } = req.params as { id: string };
    const row = await apiKeyRepo.findById(id);
    if (!row) throw notFound('key not found');
    await apiKeyRepo.revoke(id);
    reply.code(204);
    return;
  });
}
