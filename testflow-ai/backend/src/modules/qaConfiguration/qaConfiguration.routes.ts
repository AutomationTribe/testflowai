import { Router } from 'express';
import { HttpError } from '../../lib/httpError.js';
import { replayIfSeen, storeIdempotentResponse } from '../../lib/idempotency.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireOwnOrganisation } from '../subscription/subscription.routes.js';
import {
  PRESET_CATALOGUE,
  getCurrentPublished,
  getOpenDraft,
  publishDraft,
  startDraft,
  type PresetOrigin,
} from './qaConfiguration.service.js';

export const qaConfigurationRouter = Router();

const PRESET_ORIGINS = new Set<PresetOrigin>(['standard', 'lightweight', 'controlled', 'custom']);

/** FR-QAOM-002/007/008/011: setup/reconfiguration is QA Manager or Admin only (FR-WF-006). */
function requireQaOperatingModelRole(req: import('express').Request): void {
  const role = req.currentUser?.role;
  if (role !== 'admin' && role !== 'qa_manager') {
    throw HttpError.forbidden();
  }
}

/** GET /organisations/{orgId}/qa-configuration/presets — FR-QAOM-003. */
qaConfigurationRouter.get('/organisations/:orgId/qa-configuration/presets', requireAuth, (req, res, next) => {
  try {
    requireOwnOrganisation(req, req.params.orgId!);
    requireQaOperatingModelRole(req);
    res.status(200).json(PRESET_CATALOGUE);
  } catch (error) {
    next(error);
  }
});

/** GET /organisations/{orgId}/qa-configuration/current — FR-QAOM-009. Any org member may read it. */
qaConfigurationRouter.get('/organisations/:orgId/qa-configuration/current', requireAuth, async (req, res, next) => {
  try {
    const orgId = req.params.orgId!;
    requireOwnOrganisation(req, orgId);
    const current = await getCurrentPublished(orgId);
    // FR-QAOM-001 guarantees this always exists once the organisation exists — a
    // missing row here would indicate a data-integrity bug, not a normal 404.
    if (!current) throw HttpError.notFound('No published QA configuration exists for this organisation.');
    res.status(200).json(current);
  } catch (error) {
    next(error);
  }
});

/** POST /organisations/{orgId}/qa-configuration/draft — FR-QAOM-002/004-007/008. */
qaConfigurationRouter.post('/organisations/:orgId/qa-configuration/draft', requireAuth, async (req, res, next) => {
  try {
    const orgId = req.params.orgId!;
    requireOwnOrganisation(req, orgId);
    requireQaOperatingModelRole(req);

    const presetOrigin = req.body?.presetOrigin;
    if (typeof presetOrigin !== 'string' || !PRESET_ORIGINS.has(presetOrigin as PresetOrigin)) {
      throw HttpError.validation('A valid presetOrigin is required.', {
        presetOrigin: 'Must be one of: standard, lightweight, controlled, custom.',
      });
    }

    const draft = await startDraft(orgId, presetOrigin as PresetOrigin);
    res.status(201).json(draft);
  } catch (error) {
    next(error);
  }
});

/** GET /organisations/{orgId}/qa-configuration/draft — FR-QAOM-008. */
qaConfigurationRouter.get('/organisations/:orgId/qa-configuration/draft', requireAuth, async (req, res, next) => {
  try {
    const orgId = req.params.orgId!;
    requireOwnOrganisation(req, orgId);
    requireQaOperatingModelRole(req);

    const draft = await getOpenDraft(orgId);
    if (!draft) throw HttpError.notFound('No configuration draft is open for this organisation.');
    res.status(200).json(draft);
  } catch (error) {
    next(error);
  }
});

/** POST /organisations/{orgId}/qa-configuration/draft/publish — FR-QAOM-008/009. */
qaConfigurationRouter.post('/organisations/:orgId/qa-configuration/draft/publish', requireAuth, async (req, res, next) => {
  try {
    const orgId = req.params.orgId!;
    requireOwnOrganisation(req, orgId);
    requireQaOperatingModelRole(req);

    if (await replayIfSeen(req, res, orgId, 'qa-configuration/draft/publish')) return;

    const published = await publishDraft(orgId, req.currentUser!.id);

    await storeIdempotentResponse(req, orgId, 'qa-configuration/draft/publish', 200, published);
    res.status(200).json(published);
  } catch (error) {
    next(error);
  }
});
