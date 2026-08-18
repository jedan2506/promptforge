import { and, desc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { db } from '../db/index.js';
import { apiKeys } from '../db/schema.js';

export type ApiKeyRow = typeof apiKeys.$inferSelect;

export async function findByHash(hash: string): Promise<ApiKeyRow | null> {
  const rows = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, hash), eq(apiKeys.revoked, false)))
    .limit(1);
  return rows[0] ?? null;
}

export async function findById(id: string): Promise<ApiKeyRow | null> {
  const rows = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function list(): Promise<ApiKeyRow[]> {
  return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
}

export async function touchLastUsed(id: string): Promise<void> {
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
}

export interface CreateInput {
  name: string;
  scope: 'read' | 'write' | 'admin';
  projectId: string | null;
  keyHash: string;
  keyPreview: string;
}

export async function create(input: CreateInput): Promise<ApiKeyRow> {
  const row = {
    id: ulid(),
    projectId: input.projectId,
    name: input.name,
    scope: input.scope,
    keyHash: input.keyHash,
    keyPreview: input.keyPreview,
    lastUsedAt: null,
    revoked: false,
    createdAt: new Date(),
  };
  await db.insert(apiKeys).values(row);
  return row;
}

export async function revoke(id: string): Promise<boolean> {
  const result = await db
    .update(apiKeys)
    .set({ revoked: true })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.revoked, false)))
    .returning({ id: apiKeys.id });
  return result.length > 0;
}
