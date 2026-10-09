import { defineConfig } from 'vitest/config';
import { resolveTestDatabaseUrl } from './tests/testDatabaseGuard';

export default defineConfig({
  test: {
    environment: 'node',
    // Tests ALWAYS run against a dedicated `*_test` database. Only TEST_DATABASE_URL is honoured —
    // a developer's DATABASE_URL (the dev database) is deliberately overridden, and
    // tests/testDatabaseGuard.ts refuses anything that is not a local `*_test` database.
    env: { DATABASE_URL: resolveTestDatabaseUrl() },
    globalSetup: ['./tests/globalSetup.ts'],
    globals: false,
    include: ['tests/**/*.test.ts'],
    // These are integration tests sharing one PostgreSQL database (truncated between
    // tests, not per-file) — run test files sequentially, not in parallel workers,
    // to avoid cross-file races against the same tables.
    fileParallelism: false,
    // The first request in a file pays the app's cold-start cost (module loading, DB
    // pool warm-up), which exceeds Vitest's 5s default on slower machines/CI runners.
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
