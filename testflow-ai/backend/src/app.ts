import cors from 'cors';
import express, { type Express } from 'express';
import { env, isProduction } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { meRouter } from './modules/me/me.routes.js';
import { subscriptionRouter } from './modules/subscription/subscription.routes.js';
import { webhookRouter } from './modules/subscription/webhook.routes.js';
import { testSupportRouter } from './modules/testSupport/testSupport.routes.js';
import { workspaceRouter } from './modules/workspace/workspace.routes.js';

/**
 * Express app factory (AD-002: Node.js/TypeScript, AD-001: modular monolith).
 * Separated from index.ts so tests can import the app without binding a port.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    cors({
      // Production: exactly the one configured origin, no exceptions.
      // Development: also accept any http(s)://localhost:<port> or 127.0.0.1:<port> —
      // Next's dev server silently picks the next free port (3000 -> 3001 -> ...) when
      // one is already taken, which previously required manually chasing CORS_ORIGIN
      // every time that happened. env.corsOrigin is still respected first/always.
      origin: isProduction
        ? env.corsOrigin
        : (origin, callback) => {
            const isConfiguredOrigin = origin === env.corsOrigin;
            const isLocalDevOrigin = origin !== undefined && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
            callback(null, !origin || isConfiguredOrigin || isLocalDevOrigin);
          },
      credentials: true,
    }),
  );
  app.use(requestLogger);

  // Health check is deliberately unversioned infra, not a product API resource.
  app.use(healthRouter);

  // The Paystack webhook needs the exact raw request bytes to verify its signature —
  // it must be registered with express.raw(), scoped to only its own exact path, and
  // BEFORE the global express.json() below (whichever body parser runs first consumes
  // the request stream; applying express.raw() any more broadly than this one path
  // would starve every other route's express.json() parser downstream).
  app.use('/v1/webhooks/payments', express.raw({ type: 'application/json' }), webhookRouter);

  app.use(express.json());

  // APID-001: every other product API path prefixed /v1/ from day one.
  const v1 = express.Router();
  v1.use(authRouter);
  v1.use(meRouter);
  v1.use(subscriptionRouter);
  v1.use(workspaceRouter);
  // E2E-only, double-gated (see testSupport.routes.ts) — never mounted in production.
  if (env.e2eFakePayments && !isProduction) {
    v1.use(testSupportRouter);
  }
  app.use('/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
