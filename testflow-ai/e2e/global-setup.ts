import { request } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { BACKEND_URL, TESTER } from './testerUser';
import { TESTER_STORAGE_STATE } from './storageStatePath';

/**
 * Runs once per test run, after the dev servers are up and the e2e database has been rebuilt.
 * Creates the dedicated tester (organisation + active trial) and saves their signed-in session so
 * tests start logged in instead of signing up first. If the account already exists (a re-run
 * against a database that was not rebuilt) it simply logs in.
 */
export default async function globalSetup(): Promise<void> {
  const api = await request.newContext({ baseURL: BACKEND_URL });
  try {
    const signup = await api.post('/v1/auth/signup', {
      data: {
        name: TESTER.name,
        email: TESTER.email,
        password: TESTER.password,
        role: TESTER.role,
        organisationName: TESTER.organisationName,
      },
    });
    if (!signup.ok()) {
      const login = await api.post('/v1/auth/login', { data: { email: TESTER.email, password: TESTER.password } });
      if (!login.ok()) {
        throw new Error(`Could not create or log in the dedicated tester (signup ${signup.status()}, login ${login.status()}).`);
      }
    }

    const me = await (await api.get('/v1/me')).json();
    const organisationId = me.organisation.id as string;
    if (!me.subscription?.hasAccess) {
      const trial = await api.post(`/v1/organisations/${organisationId}/subscription/trial`);
      if (!trial.ok()) throw new Error(`Could not start the dedicated tester's trial (${trial.status()}).`);
    }

    mkdirSync(dirname(TESTER_STORAGE_STATE), { recursive: true });
    await api.storageState({ path: TESTER_STORAGE_STATE });
  } finally {
    await api.dispose();
  }
}
