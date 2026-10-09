/**
 * Safeguard for destructive test operations (`resetTestDatabase` TRUNCATEs every table).
 *
 * A test run may only ever touch a database that is unmistakably a disposable TEST database:
 * on this machine (localhost), never in production mode, and named `<something>_test`.
 * Anything else (the dev database `testflow`, the E2E database `testflow_e2e`, `postgres`,
 * any remote/managed host such as Neon) is refused before a single statement is sent.
 */

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const TEST_DATABASE_NAME = /^[a-z][a-z0-9_]*_test$/;

export const DEFAULT_TEST_DATABASE_URL = 'postgres://testflow:testflow@localhost:5432/testflow_test';

/** The one place that decides which database the suite uses: TEST_DATABASE_URL, else the default test DB. */
export function resolveTestDatabaseUrl(): string {
  return process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
}

export interface TestDatabaseTarget {
  host: string;
  databaseName: string;
}

export function assertSafeTestDatabase(connectionString: string | undefined): TestDatabaseTarget {
  if (!connectionString) {
    throw new Error('Refusing to run destructive test operations: no database URL is set.');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run destructive test operations: NODE_ENV is "production".');
  }

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error('Refusing to run destructive test operations: the database URL cannot be parsed.');
  }

  const host = url.hostname.toLowerCase();
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`Refusing to run destructive test operations against non-local host "${host}".`);
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!TEST_DATABASE_NAME.test(databaseName)) {
    throw new Error(
      `Refusing to run destructive test operations against database "${databaseName}": ` +
        'its name must end in "_test" (for example "testflow_test").',
    );
  }

  return { host, databaseName };
}
