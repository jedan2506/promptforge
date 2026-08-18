import { desc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import { db } from '../db/index.js';
import { projects } from '../db/schema.js';

export type ProjectRow = typeof projects.$inferSelect;

export async function list(): Promise<ProjectRow[]> {
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function findBySlug(slug: string): Promise<ProjectRow | null> {
  const rows = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function findById(id: string): Promise<ProjectRow | null> {
  const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface CreateInput {
  slug: string;
  name: string;
  description: string;
}

export async function deleteById(id: string): Promise<boolean> {
  const result = await db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id });
  return result.length > 0;
}

export async function create(input: CreateInput): Promise<ProjectRow> {
  const row = {
    id: ulid(),
    slug: input.slug,
    name: input.name,
    description: input.description,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(projects).values(row);
  return row;
}
