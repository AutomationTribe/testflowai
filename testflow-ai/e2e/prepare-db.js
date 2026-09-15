#!/usr/bin/env node
/**
 * Prepares a clean, dedicated `testflow_e2e` database and applies migrations
 * BEFORE Playwright starts (Slice 1 E2E closure). This deliberately runs as a
 * separate step ahead of `playwright test`, not as Playwright's own
 * `globalSetup` — the backend's `webServer` entry needs this database to already
 * exist the moment it boots (it checks DB connectivity at startup), and
 * Playwright starts `webServer` processes before running `globalSetup`, which
 * is too late for infrastructure the web server itself depends on.
 */
const { execSync } = require('node:child_process');
const { Client } = require('pg');

const E2E_DATABASE_NAME = 'testflow_e2e';
const ADMIN_CONNECTION_STRING = 'postgres://testflow:testflow@localhost:5432/postgres';

async function main() {
  const client = new Client({ connectionString: ADMIN_CONNECTION_STRING });
  await client.connect();
  try {
    await client.query(`DROP DATABASE IF EXISTS ${E2E_DATABASE_NAME}`);
    await client.query(`CREATE DATABASE ${E2E_DATABASE_NAME}`);
  } finally {
    await client.end();
  }

  execSync('npx tsx src/db/migrate.ts', {
    cwd: '../backend',
    env: {
      ...process.env,
      DATABASE_URL: `postgres://testflow:testflow@localhost:5432/${E2E_DATABASE_NAME}`,
    },
    stdio: 'inherit',
  });

  console.log('[prepare-db] testflow_e2e ready.');
}

main().catch((error) => {
  console.error('[prepare-db] failed:', error);
  process.exit(1);
});
