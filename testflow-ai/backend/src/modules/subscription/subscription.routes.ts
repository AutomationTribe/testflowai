import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { isProduction, env } from '../../config/env.js';
import { HttpError } from '../../lib/httpError.js';
import { replayIfSeen, storeIdempotentResponse } from '../../lib/idempotency.js';
import { initializeTransaction } from '../../lib/paystack.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  activateTrial,
  calculateAmountCents,
  getBillingHistory,
  resolveSubscriptionAccess,
  validateSeatCount,
} from './subscription.service.js';

export const subscriptionRouter = Router();

/**
 * Tenant isolation (NFR-SEC-003 / CLAUDE.md rule 14): the organisation is always the
 * caller's own resolved organisation, never trusted from the `:orgId` path param.
 * A mismatch returns 404, not 403 — indistinguishable from "doesn't exist".
 */
export function requireOwnOrganisation(req: import('express').Request, orgId: string): void {
  if (req.currentUser?.organisationId !== orgId) {
    throw HttpError.notFound();
  }
}

export function requireBillingRole(req: import('express').Request): void {
  // PD-047/FR-SUB-012: billing/subscription visibility and actions are Admin/QA Manager only.
  const role = req.currentUser?.role;
  if (role !== 'admin' && role !== 'qa_manager') {
    throw HttpError.forbidden();
  }
}

/** GET /organisations/{orgId}/subscription — FR-SUB-003. */
subscriptionRouter.get('/organisations/:orgId/subscription', requireAuth, async (req, res, next) => {
  try {
    requireOwnOrganisation(req, req.params.orgId!);
    requireBillingRole(req);
    const access = await resolveSubscriptionAccess(req.params.orgId!);
    res.status(200).json(access);
  } catch (error) {
    next(error);
  }
});

/** POST /organisations/{orgId}/subscription/trial — FR-SUB-001. */
subscriptionRouter.post('/organisations/:orgId/subscription/trial', requireAuth, async (req, res, next) => {
  try {
    const orgId = req.params.orgId!;
    requireOwnOrganisation(req, orgId);
    requireBillingRole(req);

    if (await replayIfSeen(req, res, orgId, 'subscription/trial')) return;

    const subscription = await activateTrial(orgId);
    const body = { subscription: { planType: subscription.plan_type, trialEndsAt: subscription.trial_ends_at } };
    await storeIdempotentResponse(req, orgId, 'subscription/trial', 201, body);
    res.status(201).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * Returns a Paystack transaction reference/access code for the given amount/plan/
 * seats — real Paystack by default. When `E2E_FAKE_PAYMENTS=true` (never in
 * production — hard double-gated here), returns synthetic values instead of
 * calling Paystack at all, so E2E tests never need real payment credentials (see
 * modules/testSupport for the matching fake reconciliation endpoint). The
 * authoritative amount calculation above this call is identical in both paths —
 * only the provider call is swapped.
 */
async function getPaystackTransaction(input: {
  amountCents: number;
  email: string;
  organisationId: string;
  planType: 'monthly' | 'yearly';
  seatCount: number;
}): Promise<{ reference: string; accessCode: string }> {
  if (env.e2eFakePayments && !isProduction) {
    const suffix = randomBytes(12).toString('hex');
    return { reference: `e2e_fake_ref_${suffix}`, accessCode: `e2e_fake_access_${suffix}` };
  }
  return initializeTransaction(input);
}

/**
 * POST /organisations/{orgId}/subscription/{monthly|yearly} — FR-SUB-004/005.
 * Initializes a Paystack transaction only; no TestFlow billing record is written
 * until the webhook confirms the charge (see webhook.routes.ts) — NFR-REL-003.
 */
function subscribeHandler(planType: 'monthly' | 'yearly') {
  return async (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
    try {
      const orgId = req.params.orgId!;
      requireOwnOrganisation(req, orgId);
      requireBillingRole(req);

      const endpoint = `subscription/${planType}`;
      if (await replayIfSeen(req, res, orgId, endpoint)) return;

      const seatCount = validateSeatCount(req.body?.seatCount);
      // Backend-authoritative amount — never trust a client-submitted total (§10/§11).
      const amountCents = calculateAmountCents(planType, seatCount);

      const { reference, accessCode } = await getPaystackTransaction({
        amountCents,
        email: req.currentUser!.email,
        organisationId: orgId,
        planType,
        seatCount,
      });

      const body = {
        reference,
        accessCode,
        amountCents,
        planType,
        seatCount,
      };
      await storeIdempotentResponse(req, orgId, endpoint, 201, body);
      res.status(201).json(body);
    } catch (error) {
      next(error);
    }
  };
}

subscriptionRouter.post('/organisations/:orgId/subscription/monthly', requireAuth, subscribeHandler('monthly'));
subscriptionRouter.post('/organisations/:orgId/subscription/yearly', requireAuth, subscribeHandler('yearly'));

/** POST /organisations/{orgId}/seats — FR-SUB-007/008. Same Paystack transaction pattern as subscribe. */
subscriptionRouter.post('/organisations/:orgId/seats', requireAuth, async (req, res, next) => {
  try {
    const orgId = req.params.orgId!;
    requireOwnOrganisation(req, orgId);
    requireBillingRole(req);

    if (await replayIfSeen(req, res, orgId, 'seats')) return;

    const access = await resolveSubscriptionAccess(orgId);
    if (access.planType === null) throw HttpError.conflict('No active subscription to add seats to.');
    if (access.planType === 'trial') {
      throw HttpError.conflict('Adding seats beyond the trial cap requires converting to a paid plan first.');
    }

    const seatCount = validateSeatCount(req.body?.seatCount);
    const amountCents = calculateAmountCents(access.planType, seatCount);
    const { reference, accessCode } = await getPaystackTransaction({
      amountCents,
      email: req.currentUser!.email,
      organisationId: orgId,
      planType: access.planType,
      seatCount,
    });

    const body = { reference, accessCode, amountCents, planType: access.planType, seatCount };
    await storeIdempotentResponse(req, orgId, 'seats', 201, body);
    res.status(201).json(body);
  } catch (error) {
    next(error);
  }
});

/** GET /organisations/{orgId}/billing-history — FR-SUB-012. */
subscriptionRouter.get('/organisations/:orgId/billing-history', requireAuth, async (req, res, next) => {
  try {
    const orgId = req.params.orgId!;
    requireOwnOrganisation(req, orgId);
    requireBillingRole(req);
    const history = await getBillingHistory(orgId);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
});
