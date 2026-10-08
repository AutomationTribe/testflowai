import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from './testUtils.js';

const app = createApp();

async function signUpAndGetCookie(overrides: Partial<Record<string, string>> = {}) {
  const payload = {
    email: 'admin@example.com',
    password: 'correct-horse-battery-staple',
    name: 'Ada Admin',
    role: 'admin',
    organisationName: 'Acme QA',
    ...overrides,
  };
  const res = await request(app).post('/v1/auth/signup').send(payload);
  if (!res.headers['set-cookie']) throw new Error(`DIAG signup status=${res.status} body=${JSON.stringify(res.body)}`);
  const cookie = res.headers['set-cookie'][0]!;
  const me = await request(app).get('/v1/me').set('Cookie', cookie);
  return { cookie, organisationId: me.body.organisation.id as string };
}

describe('QA Operating Model (FR-QAOM)', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('FR-QAOM-001 — automatic Standard QA on organisation creation', () => {
    it('publishes Standard QA immediately at signup, before any QA Setup action', async () => {
      const { cookie, organisationId } = await signUpAndGetCookie();

      const res = await request(app).get(`/v1/organisations/${organisationId}/qa-configuration/current`).set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'published', presetOrigin: 'standard', versionNumber: 1 });
      expect(res.body.publishedAt).toBeTruthy();
      expect(res.body.settings.requiredArtifacts).toEqual(['test_report']);
      expect(res.body.settings.enabledGatesCount).toBe(0);
    });

    it('is readable by any organisation member, not just Admin/QA Manager', async () => {
      // Slice 1 can only create admin/qa_manager users at signup (no invite flow yet),
      // so this asserts the route imposes no extra role check beyond requireAuth —
      // it does not (and cannot, at MVP) exercise a qa_tester session directly.
      const { cookie, organisationId } = await signUpAndGetCookie({ role: 'qa_manager' });
      const res = await request(app).get(`/v1/organisations/${organisationId}/qa-configuration/current`).set('Cookie', cookie);
      expect(res.status).toBe(200);
    });

    it('rejects an unauthenticated request', async () => {
      const res = await request(app).get('/v1/organisations/00000000-0000-0000-0000-000000000000/qa-configuration/current');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /qa-configuration/presets — FR-QAOM-003', () => {
    it('returns exactly the four approved presets, Standard marked recommended', async () => {
      const { cookie, organisationId } = await signUpAndGetCookie();
      const res = await request(app).get(`/v1/organisations/${organisationId}/qa-configuration/presets`).set('Cookie', cookie);

      expect(res.status).toBe(200);
      const origins = res.body.map((p: { presetOrigin: string }) => p.presetOrigin);
      expect(origins.sort()).toEqual(['controlled', 'custom', 'lightweight', 'standard']);
      const standard = res.body.find((p: { presetOrigin: string }) => p.presetOrigin === 'standard');
      expect(standard.recommended).toBe(true);
    });

    it('rejects a request for another organisation (tenant isolation, 404)', async () => {
      const orgA = await signUpAndGetCookie({ email: 'a@example.com', organisationName: 'Org A' });
      const orgB = await signUpAndGetCookie({ email: 'b@example.com', organisationName: 'Org B' });

      const res = await request(app)
        .get(`/v1/organisations/${orgB.organisationId}/qa-configuration/presets`)
        .set('Cookie', orgA.cookie);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /qa-configuration/draft + publish — FR-QAOM-002/004-008', () => {
    it('materializes Standard QA settings exactly per FR-QAOM-004 (no approval, only Test Report required, no gates)', async () => {
      const { cookie, organisationId } = await signUpAndGetCookie();

      const draft = await request(app)
        .post(`/v1/organisations/${organisationId}/qa-configuration/draft`)
        .set('Cookie', cookie)
        .send({ presetOrigin: 'standard' });
      expect(draft.status).toBe(201);
      expect(draft.body).toMatchObject({ status: 'draft', presetOrigin: 'standard', versionNumber: 2 });

      const publish = await request(app)
        .post(`/v1/organisations/${organisationId}/qa-configuration/draft/publish`)
        .set('Cookie', cookie);
      expect(publish.status).toBe(200);
      expect(publish.body).toMatchObject({ status: 'published', presetOrigin: 'standard', versionNumber: 2 });
      expect(publish.body.settings).toMatchObject({
        workflowShapes: { test_case: 'no_approval', test_report: 'no_approval', regression_report: 'no_approval' },
        requiredArtifacts: ['test_report'],
        enabledGatesCount: 0,
        totalGatesCount: 6,
      });

      const current = await request(app).get(`/v1/organisations/${organisationId}/qa-configuration/current`).set('Cookie', cookie);
      expect(current.body.versionNumber).toBe(2); // superseded the auto-published v1
    });

    it('materializes Lightweight QA settings per FR-QAOM-005 (no approval, nothing required, no gates)', async () => {
      const { cookie, organisationId } = await signUpAndGetCookie();

      await request(app).post(`/v1/organisations/${organisationId}/qa-configuration/draft`).set('Cookie', cookie).send({ presetOrigin: 'lightweight' });
      const publish = await request(app).post(`/v1/organisations/${organisationId}/qa-configuration/draft/publish`).set('Cookie', cookie);

      expect(publish.status).toBe(200);
      expect(publish.body.presetOrigin).toBe('lightweight');
      expect(publish.body.settings).toMatchObject({
        workflowShapes: { test_case: 'no_approval', test_report: 'no_approval', regression_report: 'no_approval' },
        requiredArtifacts: [],
        enabledGatesCount: 0,
      });
    });

    it('materializes Controlled QA settings per FR-QAOM-006 (review+approval, both reports required, 3 gates enabled)', async () => {
      const { cookie, organisationId } = await signUpAndGetCookie();

      await request(app).post(`/v1/organisations/${organisationId}/qa-configuration/draft`).set('Cookie', cookie).send({ presetOrigin: 'controlled' });
      const publish = await request(app).post(`/v1/organisations/${organisationId}/qa-configuration/draft/publish`).set('Cookie', cookie);

      expect(publish.status).toBe(200);
      expect(publish.body.presetOrigin).toBe('controlled');
      expect(publish.body.settings.workflowShapes.test_case).toBe('review_approval');
      expect(publish.body.settings.workflowShapes.test_report).toBe('single_approval');
      expect(publish.body.settings.requiredArtifacts.sort()).toEqual(['regression_report', 'test_report']);
      expect(publish.body.settings.enabledGatesCount).toBe(3);
    });

    it('rejects an invalid presetOrigin', async () => {
      const { cookie, organisationId } = await signUpAndGetCookie();
      const res = await request(app)
        .post(`/v1/organisations/${organisationId}/qa-configuration/draft`)
        .set('Cookie', cookie)
        .send({ presetOrigin: 'enterprise' });
      expect(res.status).toBe(422);
      expect(res.body.fields).toHaveProperty('presetOrigin');
    });

    it('rejects starting a second draft while one is already open (409, one-draft-per-org)', async () => {
      const { cookie, organisationId } = await signUpAndGetCookie();
      await request(app).post(`/v1/organisations/${organisationId}/qa-configuration/draft`).set('Cookie', cookie).send({ presetOrigin: 'standard' });

      const second = await request(app)
        .post(`/v1/organisations/${organisationId}/qa-configuration/draft`)
        .set('Cookie', cookie)
        .send({ presetOrigin: 'lightweight' });
      expect(second.status).toBe(409);
    });

    it('rejects publishing when no draft is open (404)', async () => {
      const { cookie, organisationId } = await signUpAndGetCookie();
      const res = await request(app).post(`/v1/organisations/${organisationId}/qa-configuration/draft/publish`).set('Cookie', cookie);
      expect(res.status).toBe(404);
    });

    it('rejects publishing an incomplete Custom Setup draft (FR-QAOM-007 — empty draft has no workflow settings)', async () => {
      const { cookie, organisationId } = await signUpAndGetCookie();
      await request(app).post(`/v1/organisations/${organisationId}/qa-configuration/draft`).set('Cookie', cookie).send({ presetOrigin: 'custom' });

      const publish = await request(app).post(`/v1/organisations/${organisationId}/qa-configuration/draft/publish`).set('Cookie', cookie);
      expect(publish.status).toBe(422);
      expect(publish.body.errors.length).toBeGreaterThan(0);
      expect(publish.body.errors[0]).toMatchObject({ section: 'workflows', code: 'CONFIGURATION_INCOMPLETE' });

      // The previous published version (auto-published Standard QA) remains in
      // effect until publish completes — FR-QAOM-007's explicit error/edge condition.
      const current = await request(app).get(`/v1/organisations/${organisationId}/qa-configuration/current`).set('Cookie', cookie);
      expect(current.body).toMatchObject({ presetOrigin: 'standard', versionNumber: 1 });
    });

    it('publishing does not disturb a previously published version — history remains resolvable (FR-QAOM-009/012)', async () => {
      const { cookie, organisationId } = await signUpAndGetCookie();
      const v1 = await request(app).get(`/v1/organisations/${organisationId}/qa-configuration/current`).set('Cookie', cookie);
      expect(v1.body.versionNumber).toBe(1);

      await request(app).post(`/v1/organisations/${organisationId}/qa-configuration/draft`).set('Cookie', cookie).send({ presetOrigin: 'controlled' });
      await request(app).post(`/v1/organisations/${organisationId}/qa-configuration/draft/publish`).set('Cookie', cookie);

      const v2 = await request(app).get(`/v1/organisations/${organisationId}/qa-configuration/current`).set('Cookie', cookie);
      expect(v2.body.versionNumber).toBe(2);
      expect(v2.body.presetOrigin).toBe('controlled');
    });

    it('is idempotent under a repeated Idempotency-Key on publish', async () => {
      const { cookie, organisationId } = await signUpAndGetCookie();
      await request(app).post(`/v1/organisations/${organisationId}/qa-configuration/draft`).set('Cookie', cookie).send({ presetOrigin: 'standard' });
      const key = 'qa-publish-key-1';

      const first = await request(app)
        .post(`/v1/organisations/${organisationId}/qa-configuration/draft/publish`)
        .set('Cookie', cookie)
        .set('Idempotency-Key', key);
      const replay = await request(app)
        .post(`/v1/organisations/${organisationId}/qa-configuration/draft/publish`)
        .set('Cookie', cookie)
        .set('Idempotency-Key', key);

      expect(first.status).toBe(200);
      expect(replay.body).toEqual(first.body);
    });

    it('rejects draft creation and publish for another organisation (tenant isolation, 404)', async () => {
      const orgA = await signUpAndGetCookie({ email: 'ta@example.com', organisationName: 'Tenant A' });
      const orgB = await signUpAndGetCookie({ email: 'tb@example.com', organisationName: 'Tenant B' });

      const crossDraft = await request(app)
        .post(`/v1/organisations/${orgB.organisationId}/qa-configuration/draft`)
        .set('Cookie', orgA.cookie)
        .send({ presetOrigin: 'standard' });
      expect(crossDraft.status).toBe(404);

      const crossPublish = await request(app)
        .post(`/v1/organisations/${orgB.organisationId}/qa-configuration/draft/publish`)
        .set('Cookie', orgA.cookie);
      expect(crossPublish.status).toBe(404);
    });

    it('rejects unauthenticated draft creation and publish', async () => {
      const draft = await request(app)
        .post('/v1/organisations/00000000-0000-0000-0000-000000000000/qa-configuration/draft')
        .send({ presetOrigin: 'standard' });
      expect(draft.status).toBe(401);

      const publish = await request(app).post('/v1/organisations/00000000-0000-0000-0000-000000000000/qa-configuration/draft/publish');
      expect(publish.status).toBe(401);
    });
  });
});
