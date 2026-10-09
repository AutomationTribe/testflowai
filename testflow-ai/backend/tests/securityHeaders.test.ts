import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** The app reads NODE_ENV / CORS_ORIGIN at import time, so each case builds a fresh app. */
async function appFor(nodeEnv: string, extra: Record<string, string> = {}) {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', nodeEnv);
  vi.stubEnv('CORS_ORIGIN', 'https://testflow-frontend.onrender.com');
  for (const [k, v] of Object.entries(extra)) vi.stubEnv(k, v);
  const { createApp } = await import('../src/app.js');
  return createApp();
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('security headers and Cache-Control', () => {
  it('every response (here a 404 outside /v1) carries the baseline headers and no X-Powered-By', async () => {
    const res = await request(await appFor('production')).get('/nope');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['content-security-policy']).toBe("default-src 'none'; frame-ancestors 'none'");
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('API responses, including errors and unknown routes under /v1, are Cache-Control: no-store', async () => {
    const app = await appFor('production');
    for (const path of ['/v1/me', '/v1/no-such-route']) {
      const res = await request(app).get(path);
      expect(res.headers['cache-control']).toBe('no-store');
    }
    const refused = await request(app).post('/v1/auth/logout').set('Origin', 'https://evil.example');
    expect(refused.status).toBe(403);
    expect(refused.headers['cache-control']).toBe('no-store'); // refusals are not cacheable either
  });

  it('HSTS is sent in production only, with a short max-age and no includeSubDomains/preload', async () => {
    const prod = await request(await appFor('production')).get('/nope');
    expect(prod.headers['strict-transport-security']).toBe('max-age=300');
    const dev = await request(await appFor('development')).get('/nope');
    expect(dev.headers['strict-transport-security']).toBeUndefined();
  });

  it('Swagger UI (when enabled) is exempt from the CSP/framing headers so it still renders, but keeps nosniff', async () => {
    const res = await request(await appFor('development', { SWAGGER_UI_ENABLED: 'true' })).get('/docs/');
    expect(res.headers['content-security-policy']).toBeUndefined();
    expect(res.headers['x-frame-options']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('Swagger UI is not exposed in production by default, and the CSP applies there', async () => {
    const res = await request(await appFor('production')).get('/docs/');
    expect(res.status).toBe(404);
    expect(res.headers['content-security-policy']).toBe("default-src 'none'; frame-ancestors 'none'");
  });
});

describe('production origin rules', () => {
  it('trusts only the configured frontend: dev origins and look-alikes are refused, the real frontend passes the check', async () => {
    const app = await appFor('production');
    for (const origin of ['http://localhost:3000', 'https://evil.example', 'null', 'https://testflow-frontend.onrender.com.evil.example']) {
      const res = await request(app).post('/v1/auth/logout').set('Origin', origin);
      expect(res.status, origin).toBe(403);
    }
    const ok = await request(app).post('/v1/auth/logout').set('Origin', 'https://testflow-frontend.onrender.com');
    expect(ok.status).toBe(401); // passed the origin check; refused only because there is no session
  });

  it('gives an untrusted origin no CORS headers and the frontend its credentialed CORS headers', async () => {
    const app = await appFor('production');
    const bad = await request(app).options('/v1/me').set('Origin', 'https://evil.example').set('Access-Control-Request-Method', 'GET');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
    const ok = await request(app).get('/v1/me').set('Origin', 'https://testflow-frontend.onrender.com');
    expect(ok.headers['access-control-allow-origin']).toBe('https://testflow-frontend.onrender.com');
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
  });
});
