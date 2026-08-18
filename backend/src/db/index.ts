import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '../env.js';
import * as schema from './schema.js';

const queryClient = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === 'test' ? 1 : 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });
export { schema };
export const sql = queryClient;

export async function closeDb(): Promise<void> {
  await queryClient.end({ timeout: 5 });
}
