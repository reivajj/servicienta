import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ok } from '../core/http-response.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/require-auth.js';
import { completeClientOnboarding } from './service.js';
import { validateCompleteClientOnboardingInput } from './validators.js';

interface ClientOnboardingRouterOptions {
  supabase: SupabaseClient;
}

export function clientOnboardingRouter(options: ClientOnboardingRouterOptions) {
  const router = Router();

  router.post(
    '/api/client-onboarding',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const profile = await completeClientOnboarding(
        options.supabase,
        request.auth!,
        validateCompleteClientOnboardingInput(request.body),
      );

      ok(response, profile);
    }),
  );

  return router;
}
