import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../src/lib/apiClient';

/** apiClient methods for the QA Operating Model (QA Setup screen). */
describe('apiClient — QA configuration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('qaConfigurationPresets calls GET .../qa-configuration/presets', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.qaConfigurationPresets('org-1');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/v1/organisations/org-1/qa-configuration/presets');
    expect(init.method).toBe('GET');
  });

  it('currentQaConfiguration calls GET .../qa-configuration/current', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.currentQaConfiguration('org-1');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/v1/organisations/org-1/qa-configuration/current');
    expect(init.method).toBe('GET');
  });

  it('startQaConfigurationDraft POSTs the chosen presetOrigin', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.startQaConfigurationDraft('org-1', 'controlled');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/v1/organisations/org-1/qa-configuration/draft');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ presetOrigin: 'controlled' });
  });

  it('publishQaConfigurationDraft POSTs with an Idempotency-Key header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.publishQaConfigurationDraft('org-1');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/v1/organisations/org-1/qa-configuration/draft/publish');
    expect(init.method).toBe('POST');
    expect(init.headers['Idempotency-Key']).toBeTruthy();
  });

  it('surfaces a validation_error (with structured errors[]) from publish using the shared error handling', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'validation_error',
          message: 'The configuration draft is incomplete and cannot be published.',
          errors: [{ section: 'workflows', resource: 'test_case', code: 'CONFIGURATION_INCOMPLETE', message: 'Missing.' }],
        }),
        { status: 422 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.publishQaConfigurationDraft('org-1')).rejects.toMatchObject({
      error: 'validation_error',
      status: 422,
    });
  });
});
