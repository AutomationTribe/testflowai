import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts'],
    // These are integration tests sharing one PostgreSQL database (truncated between
    // tests, not per-file) — run test files sequentially, not in parallel workers,
    // to avoid cross-file races against the same tables.
    fileParallelism: false,
  },
});
