import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireActiveSubscription } from '../../middleware/subscriptionGate.js';
import { requireOwnOrganisation } from '../subscription/subscription.routes.js';
import { createProject, listProjects, parseListProjectsQuery } from './projects.service.js';

export const projectsRouter = Router();

/**
 * POST /organisations/{orgId}/projects — FR-PRJ-001.
 * Admin, QA Manager and QA Tester may all create projects (PD-014), so there is no role
 * restriction beyond being an authenticated organisation member. The subscription gate is
 * the authoritative FR-SUB-002 block; the organisation always comes from the session.
 */
projectsRouter.post('/organisations/:orgId/projects', requireAuth, requireActiveSubscription, async (req, res, next) => {
  try {
    requireOwnOrganisation(req, req.params.orgId!);
    const project = await createProject(req.currentUser!, req.body);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /organisations/{orgId}/projects — FR-PRJ-004.
 * Visibility by role is enforced inside the SQL query, not by filtering the response.
 */
projectsRouter.get('/organisations/:orgId/projects', requireAuth, requireActiveSubscription, async (req, res, next) => {
  try {
    requireOwnOrganisation(req, req.params.orgId!);
    const input = parseListProjectsQuery(req.query);
    const result = await listProjects(req.currentUser!, input);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
