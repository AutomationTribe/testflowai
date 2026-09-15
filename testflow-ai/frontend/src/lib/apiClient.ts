/**
 * Single frontend API client (Step 9). All backend calls go through here —
 * never scattered fetch() calls in components. Cookies (session) are sent
 * automatically via `credentials: 'include'`; there is no token to manage client-side.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  readonly status: number;
  readonly error: string;
  readonly fields?: Record<string, string>;

  constructor(status: number, error: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.error = error;
    this.fields = fields;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'network_error', 'Could not reach the server. Check your connection.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON response (unexpected) — fall through to generic error below.
  }

  if (!response.ok) {
    const errBody = (body ?? {}) as { error?: string; message?: string; fields?: Record<string, string> };
    throw new ApiError(
      response.status,
      errBody.error ?? 'internal_error',
      errBody.message ?? 'Something went wrong. Please try again.',
      errBody.fields,
    );
  }

  return body as T;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'qa_manager' | 'qa_tester';
}

export interface CurrentOrganisation {
  id: string;
  name: string;
}

export type PlanType = 'trial' | 'monthly' | 'yearly';

export interface SubscriptionAccess {
  hasAccess: boolean;
  planType: PlanType | null;
  status: 'none' | 'trial_active' | 'trial_expired' | 'active' | 'grace_period' | 'blocked';
  trialEndsAt: string | null;
  gracePeriodEndsAt: string | null;
  seatsTotal: number;
}

export interface MeResponse {
  user: CurrentUser;
  organisation: CurrentOrganisation | null;
  subscription: SubscriptionAccess;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'qa_manager';
  organisationName: string;
}

function newIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const apiClient = {
  signUp: (input: SignUpInput) =>
    request<{ user: CurrentUser }>('/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  login: (email: string, password: string) =>
    request<{ user: CurrentUser }>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<void>('/v1/auth/logout', { method: 'POST' }),

  me: () => request<MeResponse>('/v1/me', { method: 'GET' }),

  health: () => request<{ status: string }>('/health', { method: 'GET' }),

  startTrial: (organisationId: string) =>
    request<{ subscription: { planType: PlanType; trialEndsAt: string } }>(
      `/v1/organisations/${organisationId}/subscription/trial`,
      { method: 'POST', headers: { 'Idempotency-Key': newIdempotencyKey() } },
    ),

  subscribe: (organisationId: string, planType: 'monthly' | 'yearly', seatCount: number) =>
    request<{ reference: string; accessCode: string; amountCents: number; planType: PlanType; seatCount: number }>(
      `/v1/organisations/${organisationId}/subscription/${planType}`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': newIdempotencyKey() },
        body: JSON.stringify({ seatCount }),
      },
    ),

  subscriptionState: (organisationId: string) =>
    request<SubscriptionAccess>(`/v1/organisations/${organisationId}/subscription`, { method: 'GET' }),

  billingHistory: (organisationId: string) =>
    request<{
      payments: Array<{ id: string; amount: string; planType: string; status: string; chargedAt: string }>;
      seatBatches: Array<{ id: string; seatCount: number; planTypeAtPurchase: string; purchasedAt: string; amountCharged: string }>;
    }>(`/v1/organisations/${organisationId}/billing-history`, { method: 'GET' }),

  workspace: () => request<{ status: string; message: string }>('/v1/workspace', { method: 'GET' }),

  /**
   * E2E-only (Slice 1 E2E closure): stands in for Paystack's webhook confirmation
   * so Playwright can deterministically drive Flow B (succeeded)/Flow D (failed)
   * with no real Paystack account. Only reachable when the backend was started with
   * `E2E_FAKE_PAYMENTS=true` (never in production — see app.ts). Never used by the
   * real checkout path (see CheckoutForm.tsx, which uses the real Paystack popup).
   */
  simulatePayment: (input: {
    organisationId: string;
    planType: 'monthly' | 'yearly';
    seatCount: number;
    amountCents: number;
    outcome: 'succeeded' | 'failed';
  }) =>
    request<{ simulated: 'succeeded' | 'failed' }>('/v1/test-support/simulate-payment', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};
