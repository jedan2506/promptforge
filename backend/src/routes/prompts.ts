import type { FastifyInstance } from 'fastify';
import {
  PromptCreate,
  PromptVersionCreate,
  EnvironmentBinding,
  type PromptDTO,
  type PromptVersionDTO,
} from '@promptforge/shared';
import * as projectRepo from '../repositories/projectRepository.js';
import * as promptRepo from '../repositories/promptRepository.js';
import * as bindingRepo from '../repositories/environmentBindingRepository.js';
import { conflict, notFound } from '../lib/errors.js';
import { requireProjectAccess, requireScope } from '../plugins/auth.js';

async function projectBySlugOrThrow(slug: string) {
  const p = await projectRepo.findBySlug(slug);
  if (!p) throw notFound(`project "${slug}" not found`);
  return p;
}

async function promptBySlugOrThrow(projectId: string, slug: string) {
  const p = await promptRepo.findBySlug(projectId, slug);
  if (!p) throw notFound(`prompt "${slug}" not found`);
  return p;
}

async function toPromptDTO(row: promptRepo.PromptRow): Promise<PromptDTO> {
  const latest = await promptRepo.latestVersionNumber(row.id);
  return {
    id: row.id,
    projectId: row.projectId,
    slug: row.slug,
    name: row.name,
    description: row.description,
    latestVersionNumber: latest,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

function toVersionDTO(row: promptRepo.PromptVersionRow): PromptVersionDTO {
  return {
    id: row.id,
    promptId: row.promptId,
    versionNumber: row.versionNumber,
    system: row.system,
    user: row.user,
    paramsSchemaJson: (row.paramsSchemaJson as Record<string, unknown> | null) ?? null,
    tier: row.tier as PromptVersionDTO['tier'],
    temperature: row.temperature,
    maxTokens: row.maxTokens,
    message: row.message,
    createdBy: row.createdBy,
    createdAt: row.createdAt.getTime(),
  };
}

export default async function promptRoutes(app: FastifyInstance) {
  app.get('/projects/:projectSlug/prompts', async (req) => {
    requireScope(req.auth!, 'read');
    const { projectSlug } = req.params as { projectSlug: string };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const rows = await promptRepo.listByProject(project.id);
    return { items: await Promise.all(rows.map(toPromptDTO)) };
  });

  app.post('/projects/:projectSlug/prompts', async (req, reply) => {
    requireScope(req.auth!, 'write');
    const { projectSlug } = req.params as { projectSlug: string };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const body = PromptCreate.parse(req.body);
    if (await promptRepo.findBySlug(project.id, body.slug)) {
      throw conflict(`prompt slug "${body.slug}" already exists in project`);
    }
    const row = await promptRepo.create({
      projectId: project.id,
      slug: body.slug,
      name: body.name,
      description: body.description ?? '',
    });
    reply.code(201);
    return await toPromptDTO(row);
  });

  app.get('/projects/:projectSlug/prompts/:promptSlug', async (req) => {
    requireScope(req.auth!, 'read');
    const { projectSlug, promptSlug } = req.params as { projectSlug: string; promptSlug: string };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    return await toPromptDTO(prompt);
  });

  app.delete('/projects/:projectSlug/prompts/:promptSlug', async (req, reply) => {
    requireScope(req.auth!, 'write');
    const { projectSlug, promptSlug } = req.params as { projectSlug: string; promptSlug: string };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    await promptRepo.deleteById(prompt.id);
    reply.code(204);
    return;
  });

  app.get('/projects/:projectSlug/prompts/:promptSlug/versions', async (req) => {
    requireScope(req.auth!, 'read');
    const { projectSlug, promptSlug } = req.params as { projectSlug: string; promptSlug: string };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    const rows = await promptRepo.listVersions(prompt.id);
    return { items: rows.map(toVersionDTO) };
  });

  app.post('/projects/:projectSlug/prompts/:promptSlug/versions', async (req, reply) => {
    requireScope(req.auth!, 'write');
    const { projectSlug, promptSlug } = req.params as { projectSlug: string; promptSlug: string };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    const body = PromptVersionCreate.parse(req.body);
    const row = await promptRepo.createVersion({
      promptId: prompt.id,
      system: body.system,
      user: body.user,
      paramsSchemaJson: body.paramsSchemaJson ?? null,
      tier: body.tier,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      message: body.message ?? '',
      createdBy: req.auth!.keyId,
    });
    reply.code(201);
    return toVersionDTO(row);
  });

  app.get('/projects/:projectSlug/environments/:env/prompts/:promptSlug', async (req) => {
    requireScope(req.auth!, 'read');
    const { projectSlug, env: environmentName, promptSlug } = req.params as {
      projectSlug: string;
      env: string;
      promptSlug: string;
    };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    const binding = await bindingRepo.findByProjectEnvPrompt(project.id, environmentName, prompt.id);
    if (!binding) throw notFound(`no binding for "${promptSlug}" in environment "${environmentName}"`);
    const version = await promptRepo.findVersionById(binding.promptVersionId);
    if (!version) throw notFound('bound version missing');
    return toVersionDTO(version);
  });

  app.post('/projects/:projectSlug/environments/:env/bindings', async (req, reply) => {
    requireScope(req.auth!, 'write');
    const { projectSlug, env: environmentName } = req.params as { projectSlug: string; env: string };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const body = EnvironmentBinding.parse({ ...(req.body as object), environmentName });
    const prompt = await promptBySlugOrThrow(project.id, body.promptSlug);
    const version = await promptRepo.findVersionByNumber(prompt.id, body.versionNumber);
    if (!version) throw notFound(`version ${body.versionNumber} of "${body.promptSlug}" not found`);
    const { created } = await bindingRepo.upsert({
      projectId: project.id,
      environmentName: body.environmentName,
      promptId: prompt.id,
      promptVersionId: version.id,
      updatedBy: req.auth!.keyId,
    });
    reply.code(created ? 201 : 200);
    return { environmentName, promptSlug: body.promptSlug, versionNumber: body.versionNumber };
  });
}
