import { and, desc, eq, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { db } from '../db/index.js';
import { evalSets, evalItems, evalRuns, evalResults } from '../db/schema.js';

export type EvalSetRow = typeof evalSets.$inferSelect;
export type EvalItemRow = typeof evalItems.$inferSelect;
export type EvalRunRow = typeof evalRuns.$inferSelect;
export type EvalResultRow = typeof evalResults.$inferSelect;

// --- Sets ---

export async function listSetsByPrompt(promptId: string): Promise<Array<EvalSetRow & { itemCount: number }>> {
  const rows = await db
    .select({
      set: evalSets,
      itemCount: sql<number>`coalesce(count(${evalItems.id}), 0)::int`,
    })
    .from(evalSets)
    .leftJoin(evalItems, eq(evalItems.evalSetId, evalSets.id))
    .where(eq(evalSets.promptId, promptId))
    .groupBy(evalSets.id)
    .orderBy(desc(evalSets.createdAt));
  return rows.map((r) => ({ ...r.set, itemCount: r.itemCount ?? 0 }));
}

export async function findSetBySlug(promptId: string, slug: string): Promise<EvalSetRow | null> {
  const rows = await db
    .select()
    .from(evalSets)
    .where(and(eq(evalSets.promptId, promptId), eq(evalSets.slug, slug)))
    .limit(1);
  return rows[0] ?? null;
}

export async function findSetById(id: string): Promise<EvalSetRow | null> {
  const rows = await db.select().from(evalSets).where(eq(evalSets.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface CreateSetInput {
  projectId: string;
  promptId: string;
  slug: string;
  name: string;
  description: string;
}

export async function createSet(input: CreateSetInput): Promise<EvalSetRow> {
  const row = {
    id: ulid(),
    projectId: input.projectId,
    promptId: input.promptId,
    slug: input.slug,
    name: input.name,
    description: input.description,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(evalSets).values(row);
  return row;
}

export async function deleteSetById(id: string): Promise<boolean> {
  const result = await db.delete(evalSets).where(eq(evalSets.id, id)).returning({ id: evalSets.id });
  return result.length > 0;
}

// --- Items ---

export async function listItems(evalSetId: string): Promise<EvalItemRow[]> {
  return db.select().from(evalItems).where(eq(evalItems.evalSetId, evalSetId)).orderBy(evalItems.createdAt);
}

export interface CreateItemInput {
  evalSetId: string;
  name: string;
  inputVarsJson: Record<string, string>;
  grader: string;
  expected: string;
  judgePrompt: string | null;
}

export async function createItem(input: CreateItemInput): Promise<EvalItemRow> {
  const row = {
    id: ulid(),
    evalSetId: input.evalSetId,
    name: input.name,
    inputVarsJson: input.inputVarsJson,
    grader: input.grader,
    expected: input.expected,
    judgePrompt: input.judgePrompt,
    createdAt: new Date(),
  };
  await db.insert(evalItems).values(row);
  return row;
}

export async function deleteItemById(id: string): Promise<boolean> {
  const result = await db.delete(evalItems).where(eq(evalItems.id, id)).returning({ id: evalItems.id });
  return result.length > 0;
}

// --- Runs ---

export async function listRuns(evalSetId: string): Promise<EvalRunRow[]> {
  return db
    .select()
    .from(evalRuns)
    .where(eq(evalRuns.evalSetId, evalSetId))
    .orderBy(desc(evalRuns.startedAt));
}

export async function findRunById(id: string): Promise<EvalRunRow | null> {
  const rows = await db.select().from(evalRuns).where(eq(evalRuns.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface CreateRunInput {
  evalSetId: string;
  promptVersionId: string;
  totalItems: number;
  triggeredBy: string;
}

export async function createRun(input: CreateRunInput): Promise<EvalRunRow> {
  const row = {
    id: ulid(),
    evalSetId: input.evalSetId,
    promptVersionId: input.promptVersionId,
    status: 'running' as const,
    totalItems: input.totalItems,
    passedItems: 0,
    failedItems: 0,
    errorItems: 0,
    totalCostUsd: 0,
    totalTokensIn: 0,
    totalTokensOut: 0,
    triggeredBy: input.triggeredBy,
    startedAt: new Date(),
    completedAt: null,
    errorMessage: null,
  };
  await db.insert(evalRuns).values(row);
  return row;
}

export interface UpdateRunInput {
  status: 'running' | 'done' | 'error';
  passedItems: number;
  failedItems: number;
  errorItems: number;
  totalCostUsd: number;
  totalTokensIn: number;
  totalTokensOut: number;
  completedAt: Date | null;
  errorMessage: string | null;
}

export async function updateRun(id: string, input: UpdateRunInput): Promise<void> {
  await db.update(evalRuns).set(input).where(eq(evalRuns.id, id));
}

// --- Results ---

export interface CreateResultInput {
  evalRunId: string;
  evalItemId: string;
  passed: boolean;
  actual: string;
  grader: string;
  reason: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  errorMessage: string | null;
}

export async function createResult(input: CreateResultInput): Promise<EvalResultRow> {
  const row = {
    id: ulid(),
    evalRunId: input.evalRunId,
    evalItemId: input.evalItemId,
    passed: input.passed,
    actual: input.actual,
    grader: input.grader,
    reason: input.reason,
    latencyMs: input.latencyMs,
    tokensIn: input.tokensIn,
    tokensOut: input.tokensOut,
    costUsd: input.costUsd,
    errorMessage: input.errorMessage,
    createdAt: new Date(),
  };
  await db.insert(evalResults).values(row);
  return row;
}

export async function listResults(evalRunId: string): Promise<EvalResultRow[]> {
  return db.select().from(evalResults).where(eq(evalResults.evalRunId, evalRunId)).orderBy(evalResults.createdAt);
}
