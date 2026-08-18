import type { FastifyInstance } from 'fastify';
import {
  EvalSetCreate,
  EvalItemCreate,
  EvalRunTrigger,
  type EvalSetDTO,
  type EvalItemDTO,
  type EvalResultDTO,
  type EvalRunDTO,
} from '@promptforge/shared';
import * as projectRepo from '../repositories/projectRepository.js';
import * as promptRepo from '../repositories/promptRepository.js';
import * as evalRepo from '../repositories/evalRepository.js';
import { runEvalSet } from '../services/evalRunner.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
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
async function setBySlugOrThrow(promptId: string, slug: string) {
  const s = await evalRepo.findSetBySlug(promptId, slug);
  if (!s) throw notFound(`eval set "${slug}" not found`);
  return s;
}

function toSetDTO(row: evalRepo.EvalSetRow & { itemCount?: number }): EvalSetDTO {
  return {
    id: row.id,
    projectId: row.projectId,
    promptId: row.promptId,
    slug: row.slug,
    name: row.name,
    description: row.description,
    itemCount: row.itemCount ?? 0,
    createdAt: row.createdAt.getTime(),
  };
}
function toItemDTO(row: evalRepo.EvalItemRow): EvalItemDTO {
  return {
    id: row.id,
    evalSetId: row.evalSetId,
    name: row.name,
    inputVarsJson: (row.inputVarsJson as Record<string, string>) ?? {},
    grader: row.grader as EvalItemDTO['grader'],
    expected: row.expected,
    judgePrompt: row.judgePrompt ?? null,
    createdAt: row.createdAt.getTime(),
  };
}
function toResultDTO(row: evalRepo.EvalResultRow, itemNameByItemId: Record<string, string>): EvalResultDTO {
  return {
    id: row.id,
    evalItemId: row.evalItemId,
    itemName: itemNameByItemId[row.evalItemId] ?? '(unknown)',
    grader: row.grader as EvalResultDTO['grader'],
    passed: row.passed,
    actual: row.actual,
    reason: row.reason,
    latencyMs: row.latencyMs,
    tokensIn: row.tokensIn,
    tokensOut: row.tokensOut,
    costUsd: row.costUsd,
    errorMessage: row.errorMessage ?? null,
  };
}
async function toRunDTO(row: evalRepo.EvalRunRow, includeResults: boolean): Promise<EvalRunDTO> {
  const version = await promptRepo.findVersionById(row.promptVersionId);
  let results: EvalResultDTO[] | undefined;
  if (includeResults) {
    const items = await evalRepo.listItems(row.evalSetId);
    const nameMap: Record<string, string> = Object.fromEntries(items.map((i) => [i.id, i.name]));
    const rs = await evalRepo.listResults(row.id);
    results = rs.map((r) => toResultDTO(r, nameMap));
  }
  return {
    id: row.id,
    evalSetId: row.evalSetId,
    promptVersionId: row.promptVersionId,
    versionNumber: version?.versionNumber ?? 0,
    status: row.status as EvalRunDTO['status'],
    totalItems: row.totalItems,
    passedItems: row.passedItems,
    failedItems: row.failedItems,
    errorItems: row.errorItems,
    totalCostUsd: row.totalCostUsd,
    totalTokensIn: row.totalTokensIn,
    totalTokensOut: row.totalTokensOut,
    triggeredBy: row.triggeredBy,
    startedAt: row.startedAt.getTime(),
    completedAt: row.completedAt ? row.completedAt.getTime() : null,
    errorMessage: row.errorMessage ?? null,
    results,
  };
}

export default async function evalRoutes(app: FastifyInstance) {
  // Sets
  app.get('/projects/:projectSlug/prompts/:promptSlug/evals', async (req) => {
    requireScope(req.auth!, 'read');
    const { projectSlug, promptSlug } = req.params as { projectSlug: string; promptSlug: string };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    const sets = await evalRepo.listSetsByPrompt(prompt.id);
    return { items: sets.map(toSetDTO) };
  });

  app.post('/projects/:projectSlug/prompts/:promptSlug/evals', async (req, reply) => {
    requireScope(req.auth!, 'write');
    const { projectSlug, promptSlug } = req.params as { projectSlug: string; promptSlug: string };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    const body = EvalSetCreate.parse(req.body);
    if (await evalRepo.findSetBySlug(prompt.id, body.slug)) {
      throw conflict(`eval set slug "${body.slug}" already exists`);
    }
    const row = await evalRepo.createSet({
      projectId: project.id,
      promptId: prompt.id,
      slug: body.slug,
      name: body.name,
      description: body.description ?? '',
    });
    reply.code(201);
    return toSetDTO({ ...row, itemCount: 0 });
  });

  app.delete('/projects/:projectSlug/prompts/:promptSlug/evals/:setSlug', async (req, reply) => {
    requireScope(req.auth!, 'write');
    const { projectSlug, promptSlug, setSlug } = req.params as {
      projectSlug: string;
      promptSlug: string;
      setSlug: string;
    };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    const set = await setBySlugOrThrow(prompt.id, setSlug);
    await evalRepo.deleteSetById(set.id);
    reply.code(204);
    return;
  });

  // Items
  app.get('/projects/:projectSlug/prompts/:promptSlug/evals/:setSlug/items', async (req) => {
    requireScope(req.auth!, 'read');
    const { projectSlug, promptSlug, setSlug } = req.params as {
      projectSlug: string;
      promptSlug: string;
      setSlug: string;
    };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    const set = await setBySlugOrThrow(prompt.id, setSlug);
    const items = await evalRepo.listItems(set.id);
    return { items: items.map(toItemDTO) };
  });

  app.post('/projects/:projectSlug/prompts/:promptSlug/evals/:setSlug/items', async (req, reply) => {
    requireScope(req.auth!, 'write');
    const { projectSlug, promptSlug, setSlug } = req.params as {
      projectSlug: string;
      promptSlug: string;
      setSlug: string;
    };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    const set = await setBySlugOrThrow(prompt.id, setSlug);
    const body = EvalItemCreate.parse(req.body);
    const row = await evalRepo.createItem({
      evalSetId: set.id,
      name: body.name,
      inputVarsJson: body.inputVarsJson,
      grader: body.grader,
      expected: body.expected,
      judgePrompt: body.judgePrompt ?? null,
    });
    reply.code(201);
    return toItemDTO(row);
  });

  app.delete('/projects/:projectSlug/prompts/:promptSlug/evals/:setSlug/items/:itemId', async (req, reply) => {
    requireScope(req.auth!, 'write');
    const { projectSlug, promptSlug, setSlug, itemId } = req.params as {
      projectSlug: string;
      promptSlug: string;
      setSlug: string;
      itemId: string;
    };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    await setBySlugOrThrow(prompt.id, setSlug);
    await evalRepo.deleteItemById(itemId);
    reply.code(204);
    return;
  });

  // Runs
  app.post('/projects/:projectSlug/prompts/:promptSlug/evals/:setSlug/runs', async (req, reply) => {
    requireScope(req.auth!, 'write');
    const { projectSlug, promptSlug, setSlug } = req.params as {
      projectSlug: string;
      promptSlug: string;
      setSlug: string;
    };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    const set = await setBySlugOrThrow(prompt.id, setSlug);
    const body = EvalRunTrigger.parse(req.body);
    const version = await promptRepo.findVersionByNumber(prompt.id, body.versionNumber);
    if (!version) throw notFound(`version ${body.versionNumber} not found`);
    const items = await evalRepo.listItems(set.id);
    if (items.length === 0) throw badRequest('eval set has no items');
    const run = await runEvalSet({
      setId: set.id,
      version,
      triggeredBy: req.auth!.keyId,
      items,
    });
    reply.code(201);
    return await toRunDTO(run, true);
  });

  app.get('/projects/:projectSlug/prompts/:promptSlug/evals/:setSlug/runs', async (req) => {
    requireScope(req.auth!, 'read');
    const { projectSlug, promptSlug, setSlug } = req.params as {
      projectSlug: string;
      promptSlug: string;
      setSlug: string;
    };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    const set = await setBySlugOrThrow(prompt.id, setSlug);
    const runs = await evalRepo.listRuns(set.id);
    return { items: await Promise.all(runs.map((r) => toRunDTO(r, false))) };
  });

  app.get('/projects/:projectSlug/prompts/:promptSlug/evals/:setSlug/runs/:runId', async (req) => {
    requireScope(req.auth!, 'read');
    const { projectSlug, promptSlug, setSlug, runId } = req.params as {
      projectSlug: string;
      promptSlug: string;
      setSlug: string;
      runId: string;
    };
    const project = await projectBySlugOrThrow(projectSlug);
    requireProjectAccess(req.auth!, project.id);
    const prompt = await promptBySlugOrThrow(project.id, promptSlug);
    await setBySlugOrThrow(prompt.id, setSlug);
    const run = await evalRepo.findRunById(runId);
    if (!run) throw notFound(`run ${runId} not found`);
    return await toRunDTO(run, true);
  });
}
