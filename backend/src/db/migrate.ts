import path from 'node:path';
import { db } from './connection';

async function migrate(): Promise<void> {
  try {
    await db.migrate.latest({
      directory: path.join(__dirname, 'migrations'),
      loadExtensions: [path.extname(__filename)],
    });
    console.log('Database migrations complete.');
  } finally {
    await db.destroy();
  }
}

migrate().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
