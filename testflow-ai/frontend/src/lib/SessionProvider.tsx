'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  apiClient,
  ApiError,
  type CurrentOrganisation,
  type CurrentUser,
  type SubscriptionAccess,
} from './apiClient';

/**
 * Session state lives server-side (httpOnly cookie) — the frontend cannot read it
 * directly, so this provider hydrates it once via GET /v1/me and keeps it in memory.
 * Subscription access is likewise never inferred client-side (dates/payment records) —
 * it is exactly what the backend's GET /v1/me returns (FR-SUB-002, resolved server-side).
 */
interface SessionState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: CurrentUser | null;
  organisation: CurrentOrganisation | null;
  subscription: SubscriptionAccess | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionState | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }): JSX.Element {
  const [status, setStatus] = useState<SessionState['status']>('loading');
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [organisation, setOrganisation] = useState<CurrentOrganisation | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionAccess | null>(null);

  const refresh = useCallback(async () => {
    try {
      const me = await apiClient.me();
      setUser(me.user);
      setOrganisation(me.organisation);
      setSubscription(me.subscription);
      setStatus('authenticated');
    } catch (error) {
      setUser(null);
      setOrganisation(null);
      setSubscription(null);
      setStatus('unauthenticated');
      if (!(error instanceof ApiError) || !error.isUnauthorized) {
        // A non-401 failure (network/server error) is still treated as "not signed in"
        // for routing purposes; the error itself surfaces where it's relevant to show.
      }
    }
  }, []);

  const logout = useCallback(async () => {
    await apiClient.logout().catch(() => undefined);
    setUser(null);
    setOrganisation(null);
    setSubscription(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <SessionContext.Provider value={{ status, user, organisation, subscription, refresh, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
