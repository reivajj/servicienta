import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ok } from '../core/http-response.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { listActivityEvents } from './service.js';
import { validateListActivityEventsInput } from './validators.js';

interface ActivityEventsRouterOptions {
  supabase: SupabaseClient;
}

export function activityEventsRouter(options: ActivityEventsRouterOptions) {
  const router = Router();

  router.get(
    '/api/admin/activity-events',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const events = await listActivityEvents(
        options.supabase,
        validateListActivityEventsInput({
          page: readQueryParam(request.query.page),
          pageSize: readQueryParam(request.query.pageSize),
          entityType: readQueryParam(request.query.entityType),
          entityId: readQueryParam(request.query.entityId),
          eventType: readQueryParam(request.query.eventType),
          createdFrom: readQueryParam(request.query.createdFrom),
          createdTo: readQueryParam(request.query.createdTo),
        }),
      );

      ok(response, events);
    }),
  );

  return router;
}

function readQueryParam(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];

  return undefined;
}
