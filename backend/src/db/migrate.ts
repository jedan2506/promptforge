import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, closeDb } from './index.js';

async function main() {
  console.log('[migrate] applying migrations…');
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('[migrate] done');
  await closeDb();
}

main().catch(async (err) => {
  console.error('[migrate] failed', err);
  await closeDb();
  process.exit(1);
});
