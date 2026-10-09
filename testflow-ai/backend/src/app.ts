import cors from 'cors';
import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env, isProduction } from './config/env.js';
import { isTrustedOrigin } from './lib/origin.js';
import { loadOpenApiSpec } from './lib/openapi.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requireTrustedOrigin } from './middleware/originCheck.js';
import { requestLogger } from './middleware/requestLogger.js';
import { noStore, securityHeaders } from './middleware/securityHeaders.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { meRouter } from './modules/me/me.routes.js';
import { projectsRouter } from './modules/projects/projects.routes.js';
import { qaConfigurationRouter } from './modules/qaConfiguration/qaConfiguration.routes.js';
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
  app.use(securityHeaders);
  // Every /v1 response is uncacheable, including CORS preflights and the webhook (which are answered before the Origin check below).
  app.use('/v1', noStore);
  app.use(
    cors({
      // One shared predicate (lib/origin.ts) decides which origins may read credentialed responses and,
      // separately, which may change state (middleware/originCheck.ts). Requests without an Origin header
      // are not browser cross-origin requests and are let through here.
      origin: (origin, callback) => callback(null, !origin || isTrustedOrigin(origin)),
      credentials: true,
    }),
  );
  app.use(requestLogger);

  // Health check is deliberately unversioned infra, not a product API resource.
  app.use(healthRouter);

  // Swagger UI (docs/technical/api/openapi.yaml): on by default outside production,
  // off by default in production — never exposed publicly in a mature production
  // deployment unless someone explicitly sets SWAGGER_UI_ENABLED=true.
  if (env.swaggerUiEnabled) {
    const openApiSpec = loadOpenApiSpec();
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
    app.get('/docs.json', (_req, res) => res.json(openApiSpec));
  }

  // The Paystack webhook needs the exact raw request bytes to verify its signature —
  // it must be registered with express.raw(), scoped to only its own exact path, and
  // BEFORE the global express.json() below (whichever body parser runs first consumes
  // the request stream; applying express.raw() any more broadly than this one path
  // would starve every other route's express.json() parser downstream).
  app.use('/v1/webhooks/payments', express.raw({ type: 'application/json' }), webhookRouter);

  // CSRF defence for state-changing /v1 requests and `Cache-Control: no-store` for every API response.
  // Placed after the Paystack webhook (a server-to-server call with no Origin, verified by signature) and
  // before the body parser, so a forged cross-site request is refused before its body is even read.
  app.use('/v1', requireTrustedOrigin);

  app.use(express.json());

  // APID-001: every other product API path prefixed /v1/ from day one.
  const v1 = express.Router();
  v1.use(authRouter);
  v1.use(meRouter);
  v1.use(subscriptionRouter);
  v1.use(qaConfigurationRouter);
  v1.use(projectsRouter);
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
