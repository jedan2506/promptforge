import { and, desc, eq, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { db } from '../db/index.js';
import { prompts, promptVersions } from '../db/schema.js';

export type PromptRow = typeof prompts.$inferSelect;
export type PromptVersionRow = typeof promptVersions.$inferSelect;

export async function listByProject(projectId: string): Promise<PromptRow[]> {
  return db.select().from(prompts).where(eq(prompts.projectId, projectId)).orderBy(desc(prompts.createdAt));
}

export async function findBySlug(projectId: string, slug: string): Promise<PromptRow | null> {
  const rows = await db
    .select()
    .from(prompts)
    .where(and(eq(prompts.projectId, projectId), eq(prompts.slug, slug)))
    .limit(1);
  return rows[0] ?? null;
}

export async function findById(id: string): Promise<PromptRow | null> {
  const rows = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface CreateInput {
  projectId: string;
  slug: string;
  name: string;
  description: string;
}

export async function deleteById(id: string): Promise<boolean> {
  const result = await db.delete(prompts).where(eq(prompts.id, id)).returning({ id: prompts.id });
  return result.length > 0;
}

export async function create(input: CreateInput): Promise<PromptRow> {
  const row = {
    id: ulid(),
    projectId: input.projectId,
    slug: input.slug,
    name: input.name,
    description: input.description,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(prompts).values(row);
  return row;
}

export async function latestVersionNumber(promptId: string): Promise<number | null> {
  const rows = await db
    .select({ n: promptVersions.versionNumber })
    .from(promptVersions)
    .where(eq(promptVersions.promptId, promptId))
    .orderBy(desc(promptVersions.versionNumber))
    .limit(1);
  return rows[0]?.n ?? null;
}

export async function listVersions(promptId: string): Promise<PromptVersionRow[]> {
  return db
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.promptId, promptId))
    .orderBy(desc(promptVersions.versionNumber));
}

export async function findVersionByNumber(promptId: string, versionNumber: number): Promise<PromptVersionRow | null> {
  const rows = await db
    .select()
    .from(promptVersions)
    .where(and(eq(promptVersions.promptId, promptId), eq(promptVersions.versionNumber, versionNumber)))
    .limit(1);
  return rows[0] ?? null;
}

export async function findVersionById(id: string): Promise<PromptVersionRow | null> {
  const rows = await db.select().from(promptVersions).where(eq(promptVersions.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface CreateVersionInput {
  promptId: string;
  system: string;
  user: string;
  paramsSchemaJson: Record<string, unknown> | null;
  tier: string;
  temperature: number;
  maxTokens: number;
  message: string;
  createdBy: string;
}

export async function createVersion(input: CreateVersionInput): Promise<PromptVersionRow> {
  const rows = await db
    .select({ next: sql<number>`coalesce(max(${promptVersions.versionNumber}), 0) + 1` })
    .from(promptVersions)
    .where(eq(promptVersions.promptId, input.promptId));
  const next = rows[0]?.next ?? 1;

  const row = {
    id: ulid(),
    promptId: input.promptId,
    versionNumber: next,
    system: input.system,
    user: input.user,
    paramsSchemaJson: input.paramsSchemaJson,
    tier: input.tier,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    message: input.message,
    createdBy: input.createdBy,
    createdAt: new Date(),
  };
  await db.insert(promptVersions).values(row);
  return row;
}
