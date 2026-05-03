import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ok } from '../core/http-response.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAdmin } from '../middleware/require-admin.js';
import {
  getClientProfileById,
  listClientProfiles,
  updateClientProfileById,
} from './service.js';
import {
  validateClientProfileId,
  validateListClientProfilesInput,
} from './validators.js';

interface ClientProfilesRouterOptions {
  supabase: SupabaseClient;
}

export function clientProfilesRouter(options: ClientProfilesRouterOptions) {
  const router = Router();

  router.get(
    '/api/client-profiles',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const clientProfiles = await listClientProfiles(
        options.supabase,
        validateListClientProfilesInput({
          page: readQueryParam(request.query.page),
          pageSize: readQueryParam(request.query.pageSize),
          status: readQueryParam(request.query.status),
          search: readQueryParam(request.query.search),
        }),
      );

      ok(response, clientProfiles);
    }),
  );

  router.get(
    '/api/client-profiles/:clientProfileId',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const clientProfile = await getClientProfileById(
        options.supabase,
        validateClientProfileId(request.params.clientProfileId),
      );

      ok(response, clientProfile);
    }),
  );

  router.patch(
    '/api/client-profiles/:clientProfileId',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const clientProfile = await updateClientProfileById(
        options.supabase,
        validateClientProfileId(request.params.clientProfileId),
        request.body,
      );

      ok(response, clientProfile);
    }),
  );

  return router;
}

function readQueryParam(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];

  return undefined;
}
