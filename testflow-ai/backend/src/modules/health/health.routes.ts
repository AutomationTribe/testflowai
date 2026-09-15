import { Router } from 'express';
import { checkDatabaseConnection } from '../../db/pool.js';

export const healthRouter = Router();

/** GET /health — liveness + DB connectivity. No secrets/infra internals in the response. */
healthRouter.get('/health', async (_req, res) => {
  try {
    await checkDatabaseConnection();
    res.status(200).json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});
