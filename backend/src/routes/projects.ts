import type { FastifyInstance } from 'fastify';
import { ProjectCreate, type ProjectDTO } from '@promptforge/shared';
import * as projectRepo from '../repositories/projectRepository.js';
import { conflict, notFound } from '../lib/errors.js';
import { requireScope } from '../plugins/auth.js';

function toDTO(row: projectRepo.ProjectRow): ProjectDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

export default async function projectRoutes(app: FastifyInstance) {
  app.get('/projects', async (req) => {
    requireScope(req.auth!, 'read');
    const rows = await projectRepo.list();
    return { items: rows.map(toDTO) };
  });

  app.post('/projects', async (req, reply) => {
    requireScope(req.auth!, 'admin');
    const body = ProjectCreate.parse(req.body);
    if (await projectRepo.findBySlug(body.slug)) {
      throw conflict(`project slug "${body.slug}" already exists`);
    }
    const row = await projectRepo.create({
      slug: body.slug,
      name: body.name,
      description: body.description ?? '',
    });
    reply.code(201);
    return toDTO(row);
  });

  app.get('/projects/:slug', async (req) => {
    requireScope(req.auth!, 'read');
    const { slug } = req.params as { slug: string };
    const row = await projectRepo.findBySlug(slug);
    if (!row) throw notFound(`project "${slug}" not found`);
    return toDTO(row);
  });

  app.delete('/projects/:slug', async (req, reply) => {
    requireScope(req.auth!, 'admin');
    const { slug } = req.params as { slug: string };
    const row = await projectRepo.findBySlug(slug);
    if (!row) throw notFound(`project "${slug}" not found`);
    await projectRepo.deleteById(row.id);
    reply.code(204);
    return;
  });
}
