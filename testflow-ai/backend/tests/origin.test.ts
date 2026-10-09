import { afterEach, describe, expect, it, vi } from 'vitest';

/** Loads lib/origin.ts fresh under a given NODE_ENV / CORS_ORIGIN (the module reads both at import time). */
async function loadOrigin(nodeEnv: string, corsOrigin?: string) {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', nodeEnv);
  if (corsOrigin === undefined) vi.stubEnv('CORS_ORIGIN', '');
  else vi.stubEnv('CORS_ORIGIN', corsOrigin);
  return import('../src/lib/origin.js');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('isTrustedOrigin — production', () => {
  it('trusts exactly the configured frontend origin', async () => {
    const { isTrustedOrigin } = await loadOrigin('production', 'https://testflow-frontend.onrender.com');
    expect(isTrustedOrigin('https://testflow-frontend.onrender.com')).toBe(true);
  });

  it('tolerates a trailing slash in the CONFIGURED value, but never trusts one in the request', async () => {
    const { isTrustedOrigin } = await loadOrigin('production', 'https://testflow-frontend.onrender.com/');
    expect(isTrustedOrigin('https://testflow-frontend.onrender.com')).toBe(true);
    expect(isTrustedOrigin('https://testflow-frontend.onrender.com/')).toBe(false);
  });

  it.each([
    'https://evil.example',
    'null',
    '',
    'http://testflow-frontend.onrender.com', // wrong scheme
    'https://testflow-frontend.onrender.com:444', // wrong port
    'https://testflow-frontend.onrender.com.evil.example', // suffix look-alike
    'https://evil-testflow-frontend.onrender.com', // prefix look-alike
    'https://TESTFLOW-FRONTEND.onrender.com', // browsers lower-case the host; anything else is not a browser
    'http://localhost:3000', // dev origins are NOT trusted in production
    'http://127.0.0.1:3000',
  ])('does not trust %j', async (origin) => {
    const { isTrustedOrigin } = await loadOrigin('production', 'https://testflow-frontend.onrender.com');
    expect(isTrustedOrigin(origin)).toBe(false);
  });
});

describe('isTrustedOrigin — development/test', () => {
  it('trusts the configured origin and any localhost / 127.0.0.1 port', async () => {
    const { isTrustedOrigin } = await loadOrigin('development', 'http://localhost:3000');
    expect(isTrustedOrigin('http://localhost:3000')).toBe(true);
    expect(isTrustedOrigin('http://localhost:3100')).toBe(true);
    expect(isTrustedOrigin('https://127.0.0.1:5173')).toBe(true);
  });

  it.each(['null', 'http://localhost', 'http://localhost.evil.example:3000', 'http://evil.example:3000', 'ftp://localhost:3000', 'http://localhost:3000/x'])(
    'still does not trust %j',
    async (origin) => {
      const { isTrustedOrigin } = await loadOrigin('development', 'http://localhost:3000');
      expect(isTrustedOrigin(origin)).toBe(false);
    },
  );
});

describe('originOfUrl', () => {
  it('returns the origin of a URL and null for anything unusable', async () => {
    const { originOfUrl } = await loadOrigin('development', 'http://localhost:3000');
    expect(originOfUrl('https://testflow-frontend.onrender.com/projects?x=1')).toBe('https://testflow-frontend.onrender.com');
    expect(originOfUrl('not a url')).toBeNull();
    expect(originOfUrl('')).toBeNull();
    expect(originOfUrl('data:text/html,hi')).toBeNull(); // opaque origin ("null")
  });
});
