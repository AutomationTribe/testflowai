import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiError } from '../src/lib/apiClient';

describe('apiClient error handling', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('surfaces a network failure as an ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    );

    await expect(apiClient.me()).rejects.toMatchObject({
      error: 'network_error',
    });
  });

  it('surfaces an unauthorized (401) response using the shared error envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'unauthorized', message: 'Authentication required.' }), {
          status: 401,
        }),
      ),
    );

    const error = await apiClient.me().catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isUnauthorized).toBe(true);
  });

  it('surfaces a generic server error (500) using the shared error envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'internal_error', message: 'Something went wrong.' }), {
          status: 500,
        }),
      ),
    );

    await expect(apiClient.me()).rejects.toMatchObject({ error: 'internal_error', status: 500 });
  });
});
