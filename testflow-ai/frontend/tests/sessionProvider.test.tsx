import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/**
 * SessionProvider is the central session-state hook — every other frontend test
 * mocks it (see protectedRoute.test.tsx, appShell.test.tsx) rather than exercising
 * it directly. This file is that missing direct coverage: hydration via GET /v1/me,
 * the 401-vs-network-error handling in `refresh`, and `logout`'s state-clearing.
 */
const meMock = vi.fn();
const logoutMock = vi.fn();
vi.mock('../src/lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/apiClient')>('../src/lib/apiClient');
  return {
    ...actual,
    apiClient: { me: () => meMock(), logout: () => logoutMock() },
  };
});

import { ApiError } from '../src/lib/apiClient';
import { SessionProvider, useSession } from '../src/lib/SessionProvider';

function Probe() {
  const session = useSession();
  return (
    <div>
      <span data-testid="status">{session.status}</span>
      <span data-testid="user">{session.user?.email ?? 'none'}</span>
      <button onClick={() => void session.logout()}>logout</button>
    </div>
  );
}

describe('SessionProvider', () => {
  it('starts loading, then hydrates to authenticated on a successful GET /v1/me', async () => {
    meMock.mockResolvedValueOnce({
      user: { id: 'u1', email: 'ada@example.com', name: 'Ada', role: 'admin' },
      organisation: { id: 'o1', name: 'Acme' },
      subscription: { hasAccess: true, status: 'trial_active', planType: 'trial', seatsTotal: 3 },
    });

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('user')).toHaveTextContent('ada@example.com');
  });

  it('resolves to unauthenticated (not an error state) on a 401 from GET /v1/me', async () => {
    meMock.mockRejectedValueOnce(new ApiError(401, 'unauthorized', 'Authentication required.'));

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('also resolves to unauthenticated on a network/server error (never leaves the app stuck in loading)', async () => {
    meMock.mockRejectedValueOnce(new ApiError(0, 'network_error', 'Could not reach the server.'));

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
  });

  it('logout clears user/session state even if the backend call itself fails', async () => {
    meMock.mockResolvedValueOnce({
      user: { id: 'u1', email: 'ada@example.com', name: 'Ada', role: 'admin' },
      organisation: { id: 'o1', name: 'Acme' },
      subscription: { hasAccess: true, status: 'trial_active', planType: 'trial', seatsTotal: 3 },
    });
    logoutMock.mockRejectedValueOnce(new Error('network blip'));

    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    screen.getByText('logout').click();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('useSession throws outside a SessionProvider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow('useSession must be used within a SessionProvider');
    errorSpy.mockRestore();
  });
});
