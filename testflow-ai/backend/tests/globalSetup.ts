import pg from 'pg';
import { assertSafeTestDatabase, resolveTestDatabaseUrl } from './testDatabaseGuard.js';

/**
 * Runs once before the backend suite: validates the target is a disposable test database and
 * creates it when missing (migrations are applied per test file by `setupTestDatabase`).
 * The guard runs first, so a misconfigured URL fails here before anything is created or changed.
 */
// Arbitrary constant identifying "a TestFlow backend test run owns this database".
const TEST_RUN_LOCK_KEY = 7_424_001;

export default async function setup(): Promise<() => Promise<void>> {
  const testDatabaseUrl = resolveTestDatabaseUrl();
  const { databaseName } = assertSafeTestDatabase(testDatabaseUrl);

  const adminUrl = new URL(testDatabaseUrl);
  adminUrl.pathname = '/postgres';
  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
    if (exists.rowCount === 0) {
      // The name is validated against /^[a-z][a-z0-9_]*_test$/, so quoting it is safe.
      await client.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await client.end();
  }

  // One run at a time per test database: the suite TRUNCATEs every table between tests, so two
  // concurrent runs corrupt each other (signup 500s / lost rows that look like flaky tests).
  // A session-level advisory lock, held on a dedicated connection until teardown, makes the second
  // run fail immediately with a clear message instead.
  const lockClient = new pg.Client({ connectionString: testDatabaseUrl });
  await lockClient.connect();
  const lock = await lockClient.query<{ locked: boolean }>('SELECT pg_try_advisory_lock($1) AS locked', [TEST_RUN_LOCK_KEY]);
  if (!lock.rows[0]?.locked) {
    await lockClient.end();
    throw new Error(
      `Another backend test run is already using database "${databaseName}". ` +
        'Wait for it to finish, or point TEST_DATABASE_URL at a different *_test database.',
    );
  }

  return async () => {
    await lockClient.end(); // closing the session releases the advisory lock
  };
}
