import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

/**
 * Minimal, explicit SQL migration runner (Slice 0 foundation).
 *
 * Deliberately does NOT apply the full, future `docs/technical/schema.sql` blind —
 * that file describes the complete, eventually-approved schema for modules not yet
 * being implemented (Requirements, Test Cases, AI, QA Operating Model, ...). Slice 0
 * only migrates the tables this slice actually needs (users, organisations,
 * organisation membership, sessions), using the same entity names and shapes the
 * approved schema already defines, so later slices extend rather than rename them.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', '..', 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function appliedMigrations(): Promise<Set<string>> {
  const result = await pool.query<{ id: string }>('SELECT id FROM schema_migrations');
  return new Set(result.rows.map((row) => row.id));
}

export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await appliedMigrations();

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
      await client.query('COMMIT');
      // eslint-disable-next-line no-console
      console.log(`[migrate] applied ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`, { cause: error });
    } finally {
      client.release();
    }
  }
}

async function main(): Promise<void> {
  await runMigrations();
  await pool.end();
}

// Only run automatically when invoked directly (`npm run migrate`), not when imported by tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('[migrate] up to date');
      process.exit(0);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[migrate] failed:', error);
      process.exit(1);
    });
}
