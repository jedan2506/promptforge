import { and, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { db } from '../db/index.js';
import { environmentBindings } from '../db/schema.js';

export type EnvironmentBindingRow = typeof environmentBindings.$inferSelect;

export async function findByProjectEnvPrompt(
  projectId: string,
  environmentName: string,
  promptId: string,
): Promise<EnvironmentBindingRow | null> {
  const rows = await db
    .select()
    .from(environmentBindings)
    .where(
      and(
        eq(environmentBindings.projectId, projectId),
        eq(environmentBindings.environmentName, environmentName),
        eq(environmentBindings.promptId, promptId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export interface UpsertInput {
  projectId: string;
  environmentName: string;
  promptId: string;
  promptVersionId: string;
  updatedBy: string;
}

export async function upsert(input: UpsertInput): Promise<{ created: boolean }> {
  const existing = await findByProjectEnvPrompt(input.projectId, input.environmentName, input.promptId);
  if (existing) {
    await db
      .update(environmentBindings)
      .set({ promptVersionId: input.promptVersionId, updatedAt: new Date(), updatedBy: input.updatedBy })
      .where(eq(environmentBindings.id, existing.id));
    return { created: false };
  }
  await db.insert(environmentBindings).values({
    id: ulid(),
    projectId: input.projectId,
    environmentName: input.environmentName,
    promptId: input.promptId,
    promptVersionId: input.promptVersionId,
    updatedAt: new Date(),
    updatedBy: input.updatedBy,
  });
  return { created: true };
}
