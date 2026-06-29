import cors from 'cors';
import express from 'express';
import { activityEventsRouter } from './activity-events/router.js';
import { createServiceSupabaseClient } from './core/supabase.js';
import { clientOnboardingRouter } from './client-onboarding/router.js';
import { clientProfilesRouter } from './client-profiles/router.js';
import type { ApiGatewayEnv } from './env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { operationsRouter } from './operations/router.js';
import { requestId } from './middleware/request-id.js';
import { requestLogger } from './middleware/request-logger.js';
import { ordersRouter } from './orders/router.js';
import { apiDocsRouter } from './system/api-docs.js';
import { healthRouter } from './system/health.js';
import { technicianProfilesRouter } from './technician-profiles/router.js';
import { usersRouter } from './users/router.js';

export function createApp(env: ApiGatewayEnv) {
  const app = express();
  const supabase = createServiceSupabaseClient(env);

  app.use(cors());
  app.use(express.json());
  app.use(requestId);
  app.use(requestLogger);

  app.use(apiDocsRouter({ supabase }));
  app.use(healthRouter);
  app.use(activityEventsRouter({ supabase }));
  app.use(clientOnboardingRouter({ supabase }));
  app.use(operationsRouter({ supabase }));
  app.use(ordersRouter({ supabase }));
  app.use(clientProfilesRouter({ supabase }));
  app.use(technicianProfilesRouter({ supabase }));
  app.use(usersRouter({ supabase }));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
