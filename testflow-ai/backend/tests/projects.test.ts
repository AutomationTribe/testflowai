import './paystackMock.js';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { hashPassword } from '../src/lib/password.js';
import { createSession, SESSION_COOKIE_NAME } from '../src/lib/session.js';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from './testUtils.js';

const app = createApp();

// One long-lived server for the whole file. `request(baseUrl)` would start (and close) a new server on a
// random port for every call; with Node's keep-alive connection reuse, ~hundreds of such calls
// occasionally reach a stale socket or an unrelated local listener (observed as empty-body 404s and
// "socket hang up"). A single stable address avoids that.
let server: Server;
let baseUrl = '';

interface TestUser {
  cookie: string;
  organisationId: string;
  userId: string;
}

/** Signs up an organisation (Admin or QA Manager — the only roles signup can create) and, by default, starts its trial. */
async function signUp(options: {
  email: string;
  organisationName: string;
  role?: 'admin' | 'qa_manager';
  name?: string;
  startTrial?: boolean;
}): Promise<TestUser> {
  const res = await request(baseUrl)
    .post('/v1/auth/signup')
    .send({
      email: options.email,
      password: 'correct-horse-battery-staple',
      name: options.name ?? 'Ada Admin',
      role: options.role ?? 'admin',
      organisationName: options.organisationName,
    });
  expect(res.status, `sign-up failed: ${JSON.stringify(res.body)}`).toBe(201);
  const cookie = res.headers['set-cookie']![0]!;
  const me = await request(baseUrl).get('/v1/me').set('Cookie', cookie);
  const organisationId = me.body.organisation.id as string;
  if (options.startTrial !== false) {
    await request(baseUrl).post(`/v1/organisations/${organisationId}/subscription/trial`).set('Cookie', cookie);
  }
  return { cookie, organisationId, userId: me.body.user.id as string };
}

/** There is no invite flow yet, so a QA Tester is inserted directly and given a real session. */
async function addQaTester(organisationId: string, email: string, name: string): Promise<TestUser> {
  const passwordHash = await hashPassword('correct-horse-battery-staple');
  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO users (organisation_id, email, name, role, password_hash) VALUES ($1, $2, $3, 'qa_tester', $4) RETURNING id`,
    [organisationId, email, name, passwordHash],
  );
  const userId = inserted.rows[0]!.id;
  const session = await createSession(userId);
  return { cookie: `${SESSION_COOKIE_NAME}=${session.token}`, organisationId, userId };
}

function createProject(user: TestUser, body: Record<string, unknown>) {
  return request(baseUrl).post(`/v1/organisations/${user.organisationId}/projects`).set('Cookie', user.cookie).send(body);
}

/** Creates a project and fails loudly if it did not succeed — for test SETUP, where success is assumed. */
async function createProjectOk(user: TestUser, body: Record<string, unknown>) {
  const res = await createProject(user, body);
  expect(res.status, `setup create failed: ${JSON.stringify(res.body)}`).toBe(201);
  return res;
}

function listProjects(user: TestUser, query = '') {
  return request(baseUrl).get(`/v1/organisations/${user.organisationId}/projects${query}`).set('Cookie', user.cookie);
}

async function currentVersionId(user: TestUser): Promise<string> {
  const res = await request(baseUrl)
    .get(`/v1/organisations/${user.organisationId}/qa-configuration/current`)
    .set('Cookie', user.cookie);
  return res.body.id as string;
}

async function publishNewVersion(user: TestUser): Promise<void> {
  await request(baseUrl)
    .post(`/v1/organisations/${user.organisationId}/qa-configuration/draft`)
    .set('Cookie', user.cookie)
    .send({ presetOrigin: 'lightweight' });
  const published = await request(baseUrl)
    .post(`/v1/organisations/${user.organisationId}/qa-configuration/draft/publish`)
    .set('Cookie', user.cookie)
    .set('Idempotency-Key', `publish-${Date.now()}-${Math.random()}`);
  expect(published.status).toBe(200);
}

describe('Projects — Create Project (FR-PRJ-001) and visibility (FR-PRJ-004)', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await teardownTestDatabase();
  });

  describe('authentication and subscription eligibility (FR-SUB-002)', () => {
    it('rejects unauthenticated create and list with 401', async () => {
      const orgPath = '/v1/organisations/00000000-0000-0000-0000-000000000000/projects';
      expect((await request(baseUrl).post(orgPath).send({ name: 'X' })).status).toBe(401);
      expect((await request(baseUrl).get(orgPath)).status).toBe(401);
    });

    it('blocks create and list with subscription_required when the organisation has no active trial/subscription', async () => {
      const admin = await signUp({ email: 'nosub@example.com', organisationName: 'No Sub Org', startTrial: false });

      const created = await createProject(admin, { name: 'Blocked' });
      expect(created.status).toBe(403);
      expect(created.body.error).toBe('subscription_required');

      const listed = await listProjects(admin);
      expect(listed.status).toBe(403);
      expect(listed.body.error).toBe('subscription_required');

      const rows = await pool.query('SELECT count(*)::int AS n FROM projects');
      expect(rows.rows[0].n).toBe(0);
    });
  });

  describe('successful creation', () => {
    it('lets an Admin create a project: 201, sequential code, active, creator as sole member, pinned to the current published version', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA', name: 'Ada Admin' });
      const versionId = await currentVersionId(admin);

      const res = await createProject(admin, { name: 'Website Build', description: 'Main corporate website' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        organisationId: admin.organisationId,
        projectCode: 'PRJ-001',
        name: 'Website Build',
        description: 'Main corporate website',
        status: 'active',
        createdBy: { userId: admin.userId, name: 'Ada Admin' },
        qaConfiguration: { versionId, versionNumber: 1, presetOrigin: 'standard' },
        members: [{ userId: admin.userId, name: 'Ada Admin' }],
      });
      expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(res.body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      const membership = await pool.query(
        'SELECT user_id, granted_by_user_id, is_creator_grant FROM project_memberships WHERE project_id = $1',
        [res.body.id],
      );
      expect(membership.rows).toEqual([{ user_id: admin.userId, granted_by_user_id: admin.userId, is_creator_grant: true }]);
    });

    it('lets a QA Manager and a QA Tester create projects (PD-014)', async () => {
      const manager = await signUp({ email: 'mgr@example.com', organisationName: 'Mgr Org', role: 'qa_manager' });
      const tester = await addQaTester(manager.organisationId, 'tester@example.com', 'Tess Tester');

      expect((await createProject(manager, { name: 'Manager project' })).status).toBe(201);
      const testerRes = await createProject(tester, { name: 'Tester project' });
      expect(testerRes.status).toBe(201);
      expect(testerRes.body.createdBy.userId).toBe(tester.userId);
    });

    it('stores a missing or blank description as null and trims the name', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });

      const noDescription = await createProject(admin, { name: '  Padded Name  ' });
      expect(noDescription.status).toBe(201);
      expect(noDescription.body.name).toBe('Padded Name');
      expect(noDescription.body.description).toBeNull();

      const blank = await createProject(admin, { name: 'Blank desc', description: '   ' });
      expect(blank.body.description).toBeNull();
    });

    it('generates a sequential code per organisation, independent between organisations (PD-066)', async () => {
      const orgA = await signUp({ email: 'a@example.com', organisationName: 'Org A' });
      const orgB = await signUp({ email: 'b@example.com', organisationName: 'Org B' });

      expect((await createProject(orgA, { name: 'A1' })).body.projectCode).toBe('PRJ-001');
      expect((await createProject(orgA, { name: 'A2' })).body.projectCode).toBe('PRJ-002');
      expect((await createProject(orgB, { name: 'B1' })).body.projectCode).toBe('PRJ-001');
    });

    it('never reuses a code and issues unique codes under concurrent creates', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const results = await Promise.all(
        Array.from({ length: 5 }, (_, index) => createProject(admin, { name: `Concurrent ${index}` })),
      );
      expect(results.every((res) => res.status === 201)).toBe(true);
      const codes = results.map((res) => res.body.projectCode as string).sort();
      expect(codes).toEqual(['PRJ-001', 'PRJ-002', 'PRJ-003', 'PRJ-004', 'PRJ-005']);
    });

    it('ignores client-supplied organisation, creator, code and status — they come from the session', async () => {
      const orgA = await signUp({ email: 'a@example.com', organisationName: 'Org A' });
      const orgB = await signUp({ email: 'b@example.com', organisationName: 'Org B' });

      const res = await createProject(orgA, {
        name: 'Spoof attempt',
        organisationId: orgB.organisationId,
        createdByUserId: orgB.userId,
        projectCode: 'PRJ-999',
        status: 'archived',
      });

      expect(res.status).toBe(201);
      expect(res.body.organisationId).toBe(orgA.organisationId);
      expect(res.body.createdBy.userId).toBe(orgA.userId);
      expect(res.body.projectCode).toBe('PRJ-001');
      expect(res.body.status).toBe('active');
    });
  });

  describe('validation', () => {
    it.each([
      ['missing name', {}, 'name'],
      ['blank name', { name: '   ' }, 'name'],
      ['non-string name', { name: 42 }, 'name'],
      ['name over 120 characters', { name: 'x'.repeat(121) }, 'name'],
      ['description over 500 characters', { name: 'ok', description: 'y'.repeat(501) }, 'description'],
      ['non-string description', { name: 'ok', description: 7 }, 'description'],
      ['name containing a NUL byte', { name: 'bad\u0000name' }, 'name'],
      ['description containing a NUL byte', { name: 'ok', description: 'bad\u0000text' }, 'description'],
      ['malformed QA configuration id', { name: 'ok', qaConfigurationVersionId: 'not-a-uuid' }, 'qaConfigurationVersionId'],
    ])('rejects %s with 422 validation_error and creates nothing', async (_label, body, field) => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });

      const res = await createProject(admin, body);

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('validation_error');
      expect(res.body.fields).toHaveProperty(field);
      const rows = await pool.query('SELECT count(*)::int AS n FROM projects');
      expect(rows.rows[0].n).toBe(0);
    });

    it('accepts a name of exactly 120 characters and a description of exactly 500', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const res = await createProject(admin, { name: 'n'.repeat(120), description: 'd'.repeat(500) });
      expect(res.status).toBe(201);
    });

    it('does not consume a project code when validation fails', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      await createProject(admin, { name: '' });
      expect((await createProject(admin, { name: 'First valid' })).body.projectCode).toBe('PRJ-001');
    });
  });

  describe('QA configuration version pinning and cross-organisation rejection (FR-QAOM-012, DBD-014)', () => {
    it('accepts the explicitly named current published version', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const versionId = await currentVersionId(admin);

      const res = await createProject(admin, { name: 'Explicit', qaConfigurationVersionId: versionId });

      expect(res.status).toBe(201);
      expect(res.body.qaConfiguration.versionId).toBe(versionId);
    });

    it("rejects another organisation's configuration version with 422 and creates no project", async () => {
      const orgA = await signUp({ email: 'a@example.com', organisationName: 'Org A' });
      const orgB = await signUp({ email: 'b@example.com', organisationName: 'Org B' });
      const orgBVersion = await currentVersionId(orgB);

      const res = await createProject(orgA, { name: 'Cross-tenant config', qaConfigurationVersionId: orgBVersion });

      expect(res.status).toBe(422);
      expect(res.body.fields).toHaveProperty('qaConfigurationVersionId');
      // Same response as any other unavailable version — nothing about org B is revealed.
      expect(JSON.stringify(res.body)).not.toContain(orgBVersion);
      const rows = await pool.query('SELECT count(*)::int AS n FROM projects');
      expect(rows.rows[0].n).toBe(0);
    });

    it('rejects a non-existent version id the same way', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const res = await createProject(admin, { name: 'Ghost', qaConfigurationVersionId: '00000000-0000-4000-8000-000000000000' });
      expect(res.status).toBe(422);
    });

    it('rejects a draft (unpublished) version of the same organisation', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const draft = await request(baseUrl)
        .post(`/v1/organisations/${admin.organisationId}/qa-configuration/draft`)
        .set('Cookie', admin.cookie)
        .send({ presetOrigin: 'controlled' });
      expect(draft.status).toBe(201);

      const res = await createProject(admin, { name: 'Draft pin', qaConfigurationVersionId: draft.body.id });

      expect(res.status).toBe(422);
    });

    it('pins a project to the version current at creation; a later publish does not change it, and new projects use the new version', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const versionOne = await currentVersionId(admin);
      const projectA = await createProjectOk(admin, { name: 'Project A' });
      expect(projectA.body.qaConfiguration).toMatchObject({ versionId: versionOne, versionNumber: 1 });

      await publishNewVersion(admin);
      const versionTwo = await currentVersionId(admin);
      expect(versionTwo).not.toBe(versionOne);

      const projectB = await createProjectOk(admin, { name: 'Project B' });
      expect(projectB.body.qaConfiguration).toMatchObject({ versionId: versionTwo, versionNumber: 2, presetOrigin: 'lightweight' });

      const listed = await listProjects(admin);
      const byName = Object.fromEntries(listed.body.items.map((p: { name: string }) => [p.name, p]));
      expect(byName['Project A'].qaConfiguration.versionNumber).toBe(1);
      expect(byName['Project B'].qaConfiguration.versionNumber).toBe(2);
    });

    it('rejects the superseded version once a newer one is published', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const versionOne = await currentVersionId(admin);
      await publishNewVersion(admin);

      const res = await createProject(admin, { name: 'Stale pin', qaConfigurationVersionId: versionOne });

      expect(res.status).toBe(422);
    });

    it('is enforced by the database too: a project cannot reference another organisation\'s version', async () => {
      const orgA = await signUp({ email: 'a@example.com', organisationName: 'Org A' });
      const orgB = await signUp({ email: 'b@example.com', organisationName: 'Org B' });
      const orgBVersion = await currentVersionId(orgB);

      await expect(
        pool.query(
          `INSERT INTO projects (organisation_id, project_code, name, qa_configuration_version_id, created_by_user_id)
           VALUES ($1, 'PRJ-001', 'Direct insert', $2, $3)`,
          [orgA.organisationId, orgBVersion, orgA.userId],
        ),
      ).rejects.toThrow(/fk_projects_qa_configuration_version/);
    });
  });

  describe('visibility by role (FR-PRJ-004)', () => {
    it('Admin sees every project in the organisation, including those created by others', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const tester = await addQaTester(admin.organisationId, 'tester@example.com', 'Tess Tester');
      await createProjectOk(admin, { name: 'Admin project' });
      await createProjectOk(tester, { name: 'Tester project' });

      const res = await listProjects(admin);

      expect(res.status).toBe(200);
      expect(res.body.items.map((p: { name: string }) => p.name).sort()).toEqual(['Admin project', 'Tester project']);
      expect(res.body.counts).toEqual({ total: 2, active: 2, archived: 0 });
    });

    it('QA Manager sees every project in the organisation', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const manager = await addQaManager(admin.organisationId, 'mgr@example.com');
      const tester = await addQaTester(admin.organisationId, 'tester@example.com', 'Tess Tester');
      await createProjectOk(admin, { name: 'Admin project' });
      await createProjectOk(tester, { name: 'Tester project' });

      const res = await listProjects(manager);

      expect(res.body.items).toHaveLength(2);
    });

    it('QA Tester sees a project they created', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const tester = await addQaTester(admin.organisationId, 'tester@example.com', 'Tess Tester');
      await createProjectOk(tester, { name: 'My project' });

      const res = await listProjects(tester);

      expect(res.body.items.map((p: { name: string }) => p.name)).toEqual(['My project']);
    });

    it('QA Tester does not see projects they neither created nor were added to', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const tester = await addQaTester(admin.organisationId, 'tester@example.com', 'Tess Tester');
      await createProjectOk(admin, { name: 'Admin only' });

      const res = await listProjects(tester);

      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
      expect(res.body.counts).toEqual({ total: 0, active: 0, archived: 0 });
      expect(res.body.qaConfigurations).toEqual([]);
    });

    it('QA Tester sees a project once they hold a project membership, and loses it when the membership is removed', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const tester = await addQaTester(admin.organisationId, 'tester@example.com', 'Tess Tester');
      const created = await createProjectOk(admin, { name: 'Shared project' });
      const projectId = created.body.id as string;

      expect((await listProjects(tester)).body.items).toHaveLength(0);

      await pool.query(
        'INSERT INTO project_memberships (project_id, user_id, granted_by_user_id) VALUES ($1, $2, $3)',
        [projectId, tester.userId, admin.userId],
      );
      const afterGrant = await listProjects(tester);
      expect(afterGrant.body.items).toHaveLength(1);
      expect(afterGrant.body.items[0].members.map((m: { name: string }) => m.name).sort()).toEqual(['Ada Admin', 'Tess Tester']);

      await pool.query('DELETE FROM project_memberships WHERE project_id = $1 AND user_id = $2', [projectId, tester.userId]);
      expect((await listProjects(tester)).body.items).toHaveLength(0);
    });

    it('applies visibility to counts and filter options, not just items (no leakage through metadata)', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const tester = await addQaTester(admin.organisationId, 'tester@example.com', 'Tess Tester');
      await createProjectOk(admin, { name: 'Hidden from tester' });
      await createProjectOk(admin, { name: 'Also hidden' });
      await createProjectOk(tester, { name: 'Visible' });

      const res = await listProjects(tester);

      expect(res.body.counts.total).toBe(1);
      expect(res.body.items).toHaveLength(1);
    });
  });

  describe('organisation isolation and cross-tenant access', () => {
    it("never lists another organisation's projects", async () => {
      const orgA = await signUp({ email: 'a@example.com', organisationName: 'Org A' });
      const orgB = await signUp({ email: 'b@example.com', organisationName: 'Org B' });
      await createProjectOk(orgB, { name: 'Org B secret' });

      const res = await listProjects(orgA);

      expect(res.body.items).toEqual([]);
      expect(JSON.stringify(res.body)).not.toContain('Org B secret');
    });

    it("returns 404 when listing or creating under another organisation's path", async () => {
      const orgA = await signUp({ email: 'a@example.com', organisationName: 'Org A' });
      const orgB = await signUp({ email: 'b@example.com', organisationName: 'Org B' });

      const list = await request(baseUrl).get(`/v1/organisations/${orgB.organisationId}/projects`).set('Cookie', orgA.cookie);
      const create = await request(baseUrl)
        .post(`/v1/organisations/${orgB.organisationId}/projects`)
        .set('Cookie', orgA.cookie)
        .send({ name: 'Intruder' });

      expect(list.status).toBe(404);
      expect(create.status).toBe(404);
      const rows = await pool.query('SELECT count(*)::int AS n FROM projects WHERE organisation_id = $1', [orgB.organisationId]);
      expect(rows.rows[0].n).toBe(0);
    });

    it("a QA Tester cannot reach another organisation's projects either", async () => {
      const orgA = await signUp({ email: 'a@example.com', organisationName: 'Org A' });
      const orgB = await signUp({ email: 'b@example.com', organisationName: 'Org B' });
      const tester = await addQaTester(orgA.organisationId, 'tester@example.com', 'Tess Tester');

      const res = await request(baseUrl).get(`/v1/organisations/${orgB.organisationId}/projects`).set('Cookie', tester.cookie);

      expect(res.status).toBe(404);
    });
  });

  describe('robustness: concurrency, atomicity and metadata leakage', () => {
    it('survives more concurrent creates than the connection pool holds (no pool deadlock)', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      // pg's default pool holds 10 connections; 14 simultaneous creates would hang forever if a
      // create held one connection while waiting for a second.
      const results = await Promise.all(
        Array.from({ length: 14 }, (_, index) => createProject(admin, { name: `Burst ${index}` })),
      );

      expect(results.every((res) => res.status === 201)).toBe(true);
      const codes = new Set(results.map((res) => res.body.projectCode as string));
      expect(codes.size).toBe(14);
    });

    it('rolls the whole create back on a mid-transaction failure: no project, no membership, counter not advanced', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const versionId = await currentVersionId(admin);
      // Occupy the next code so the INSERT inside the transaction (after the counter was bumped) fails.
      await pool.query(
        `INSERT INTO projects (organisation_id, project_code, name, qa_configuration_version_id, created_by_user_id)
         VALUES ($1, 'PRJ-001', 'Squatter', $2, $3)`,
        [admin.organisationId, versionId, admin.userId],
      );

      const failed = await createProject(admin, { name: 'Should roll back' });

      expect(failed.status).toBe(500);
      const counter = await pool.query('SELECT next_project_number FROM organisations WHERE id = $1', [admin.organisationId]);
      expect(counter.rows[0].next_project_number).toBe(1);
      const projects = await pool.query('SELECT name FROM projects WHERE organisation_id = $1', [admin.organisationId]);
      expect(projects.rows.map((row) => row.name)).toEqual(['Squatter']);
      const memberships = await pool.query('SELECT count(*)::int AS n FROM project_memberships');
      expect(memberships.rows[0].n).toBe(0);

      // Once the obstruction is gone the same code is issued — nothing was consumed by the failure.
      await pool.query(`DELETE FROM projects WHERE name = 'Squatter'`);
      expect((await createProject(admin, { name: 'Retry' })).body.projectCode).toBe('PRJ-001');
    });

    it('returns 404 when the organisation has no published QA configuration', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      await pool.query(
        `UPDATE qa_configuration_versions SET status = 'draft', published_by = NULL, published_at = NULL WHERE organisation_id = $1`,
        [admin.organisationId],
      );

      const res = await createProject(admin, { name: 'No config' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('not_found');
    });

    it("does not leak other users' QA configuration versions through the filter options", async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const tester = await addQaTester(admin.organisationId, 'tester@example.com', 'Tess Tester');
      const versionOne = await currentVersionId(admin);
      await createProjectOk(admin, { name: 'Admin project on v1' });
      await publishNewVersion(admin);
      const versionTwo = await currentVersionId(admin);
      await createProjectOk(tester, { name: 'Tester project on v2' });

      const testerView = await listProjects(tester);
      const adminView = await listProjects(admin);

      expect(testerView.body.qaConfigurations.map((c: { versionId: string }) => c.versionId)).toEqual([versionTwo]);
      expect(JSON.stringify(testerView.body)).not.toContain(versionOne);
      expect(adminView.body.qaConfigurations.map((c: { versionId: string }) => c.versionId).sort()).toEqual([versionOne, versionTwo].sort());
    });
  });

  describe('list: search, status filter, pagination and empty state', () => {
    it('returns an empty list with zero counts for an organisation with no accessible projects (empty state)', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });

      const res = await listProjects(admin);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ items: [], nextCursor: null, counts: { total: 0, active: 0, archived: 0 }, qaConfigurations: [] });
    });

    it('returns newest first', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      await createProjectOk(admin, { name: 'First' });
      await createProjectOk(admin, { name: 'Second' });
      await createProjectOk(admin, { name: 'Third' });

      const res = await listProjects(admin);

      expect(res.body.items.map((p: { name: string }) => p.name)).toEqual(['Third', 'Second', 'First']);
    });

    it('paginates with cursors without skipping or repeating items', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      for (let index = 1; index <= 5; index += 1) {
        await createProjectOk(admin, { name: `Project ${index}` });
      }

      const first = await listProjects(admin, '?limit=2');
      expect(first.body.items.map((p: { name: string }) => p.name)).toEqual(['Project 5', 'Project 4']);
      expect(first.body.nextCursor).toBeTruthy();
      expect(first.body.counts.total).toBe(5);

      const second = await listProjects(admin, `?limit=2&cursor=${first.body.nextCursor}`);
      expect(second.body.items.map((p: { name: string }) => p.name)).toEqual(['Project 3', 'Project 2']);

      const third = await listProjects(admin, `?limit=2&cursor=${second.body.nextCursor}`);
      expect(third.body.items.map((p: { name: string }) => p.name)).toEqual(['Project 1']);
      expect(third.body.nextCursor).toBeNull();
    });

    it('rejects a malformed cursor, limit, status or QA configuration filter with 422', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      expect((await listProjects(admin, '?cursor=garbage')).status).toBe(422);
      expect((await listProjects(admin, '?limit=0')).status).toBe(422);
      expect((await listProjects(admin, '?limit=101')).status).toBe(422);
      expect((await listProjects(admin, '?status=deleted')).status).toBe(422);
      expect((await listProjects(admin, '?qaConfigurationVersionId=nope')).status).toBe(422);
    });

    it('searches by name or code, case-insensitively, treating % and _ literally', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      await createProjectOk(admin, { name: 'Mobile Banking App' });
      await createProjectOk(admin, { name: 'API Platform' });
      await createProjectOk(admin, { name: '100% coverage' });

      const byName = await listProjects(admin, '?q=mobile');
      expect(byName.body.items.map((p: { name: string }) => p.name)).toEqual(['Mobile Banking App']);

      const byCode = await listProjects(admin, '?q=prj-002');
      expect(byCode.body.items.map((p: { name: string }) => p.name)).toEqual(['API Platform']);

      const percent = await listProjects(admin, `?q=${encodeURIComponent('%')}`);
      expect(percent.body.items.map((p: { name: string }) => p.name)).toEqual(['100% coverage']);
    });

    it('filters by status and reports counts across statuses', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      await createProjectOk(admin, { name: 'Active one' });
      const old = await createProjectOk(admin, { name: 'Old one' });
      // Archiving is a later requirement (FR-PRJ-003); set the status directly to test the filter and counts.
      await pool.query(`UPDATE projects SET status = 'archived' WHERE id = $1`, [old.body.id]);

      const archived = await listProjects(admin, '?status=archived');
      expect(archived.body.items.map((p: { name: string }) => p.name)).toEqual(['Old one']);
      expect(archived.body.counts).toEqual({ total: 2, active: 1, archived: 1 });

      const active = await listProjects(admin, '?status=active');
      expect(active.body.items.map((p: { name: string }) => p.name)).toEqual(['Active one']);
    });

    it('counts honour the search text but not the status filter', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      await createProjectOk(admin, { name: 'Alpha one' });
      const alphaTwo = await createProjectOk(admin, { name: 'Alpha two' });
      await createProjectOk(admin, { name: 'Beta' });
      await pool.query(`UPDATE projects SET status = 'archived' WHERE id = $1`, [alphaTwo.body.id]);

      const res = await listProjects(admin, '?q=alpha&status=archived');

      expect(res.body.items.map((p: { name: string }) => p.name)).toEqual(['Alpha two']);
      expect(res.body.counts).toEqual({ total: 2, active: 1, archived: 1 });
    });

    it('rejects search text containing a NUL byte with 422 (not a 500)', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const res = await listProjects(admin, '?q=a%00b');
      expect(res.status).toBe(422);
      expect(res.body.fields).toHaveProperty('q');
    });

    it('rejects search text longer than 120 characters', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const res = await listProjects(admin, `?q=${'a'.repeat(121)}`);
      expect(res.status).toBe(422);
      expect(res.body.fields).toHaveProperty('q');
    });

    it('pages through projects that share an identical created_at without skipping or repeating any (id tie-break)', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const versionId = await currentVersionId(admin);
      for (const code of ['PRJ-001', 'PRJ-002', 'PRJ-003']) {
        const inserted = await pool.query<{ id: string }>(
          `INSERT INTO projects (organisation_id, project_code, name, qa_configuration_version_id, created_by_user_id, created_at)
           VALUES ($1, $2, $3, $4, $5, '2026-01-01T00:00:00.123456Z') RETURNING id`,
          [admin.organisationId, code, `Tie ${code}`, versionId, admin.userId],
        );
        await pool.query(
          'INSERT INTO project_memberships (project_id, user_id, granted_by_user_id, is_creator_grant) VALUES ($1, $2, $2, true)',
          [inserted.rows[0]!.id, admin.userId],
        );
      }

      const seen: string[] = [];
      let cursor = '';
      for (let page = 0; page < 5; page += 1) {
        const res = await listProjects(admin, `?limit=1${cursor ? `&cursor=${cursor}` : ''}`);
        seen.push(...res.body.items.map((p: { name: string }) => p.name));
        if (!res.body.nextCursor) break;
        cursor = res.body.nextCursor as string;
      }

      expect([...seen].sort()).toEqual(['Tie PRJ-001', 'Tie PRJ-002', 'Tie PRJ-003']);
    });

    it('filters by QA configuration version and lists the available versions as filter options', async () => {
      const admin = await signUp({ email: 'admin@example.com', organisationName: 'Acme QA' });
      const versionOne = await currentVersionId(admin);
      await createProjectOk(admin, { name: 'On v1' });
      await publishNewVersion(admin);
      await createProjectOk(admin, { name: 'On v2' });

      const filtered = await listProjects(admin, `?qaConfigurationVersionId=${versionOne}`);

      expect(filtered.body.items.map((p: { name: string }) => p.name)).toEqual(['On v1']);
      expect(filtered.body.qaConfigurations.map((c: { versionNumber: number }) => c.versionNumber)).toEqual([2, 1]);
    });
  });
});

/** A QA Manager other than the signing-up user (signup creates only the first user of an organisation). */
async function addQaManager(organisationId: string, email: string): Promise<TestUser> {
  const passwordHash = await hashPassword('correct-horse-battery-staple');
  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO users (organisation_id, email, name, role, password_hash) VALUES ($1, $2, 'Max Manager', 'qa_manager', $3) RETURNING id`,
    [organisationId, email, passwordHash],
  );
  const userId = inserted.rows[0]!.id;
  const session = await createSession(userId);
  return { cookie: `${SESSION_COOKIE_NAME}=${session.token}`, organisationId, userId };
}
