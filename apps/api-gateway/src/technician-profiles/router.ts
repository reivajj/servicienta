import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '../middleware/require-admin.js';
import { ok } from '../core/http-response.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { readQueryParam } from './helpers/http.js';
import {
  getPublicTechnicianProfileBySlug,
  listAdminTechnicianProfiles,
  listAdminTechnicianCatalogs,
  listAdminTechniciansByCatalogItem,
  listPublicTechnicianProfileCatalogs,
  listPublicTechnicianProfiles,
} from './service.js';
import {
  validateListAdminTechnicianProfilesInput,
  validateAdminTechniciansByCatalogItemInput,
  validateListPublicTechnicianProfilesInput,
  validatePublicTechnicianSlug,
} from './validators.js';

interface TechnicianProfilesRouterOptions {
  supabase: SupabaseClient;
}

export function technicianProfilesRouter(
  options: TechnicianProfilesRouterOptions,
) {
  const router = Router();

  router.get(
    '/api/admin/technician-profiles',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const profiles = await listAdminTechnicianProfiles(
        options.supabase,
        validateListAdminTechnicianProfilesInput({
          page: readQueryParam(request.query.page),
          pageSize: readQueryParam(request.query.pageSize),
          status: readQueryParam(request.query.status),
          available: readQueryParam(request.query.available),
          search: readQueryParam(request.query.search),
          sort: readQueryParam(request.query.sort),
        }),
      );

      ok(response, profiles);
    }),
  );

  router.get(
    '/api/admin/technician-profiles/catalogs',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (_request, response) => {
      const catalogs = await listAdminTechnicianCatalogs(options.supabase);

      ok(response, catalogs);
    }),
  );

  router.get(
    '/api/admin/technician-profiles/catalogs/:kind/:slug/technicians',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const result = await listAdminTechniciansByCatalogItem(
        options.supabase,
        validateAdminTechniciansByCatalogItemInput({
          kind: request.params.kind,
          slug: request.params.slug,
        }),
      );

      ok(response, result);
    }),
  );

  router.get(
    '/api/public/technician-profiles/catalogs',
    asyncHandler(async (_request, response) => {
      const catalogs = await listPublicTechnicianProfileCatalogs(
        options.supabase,
      );

      ok(response, catalogs);
    }),
  );

  router.get(
    '/api/public/technician-profiles',
    asyncHandler(async (request, response) => {
      const profiles = await listPublicTechnicianProfiles(
        options.supabase,
        validateListPublicTechnicianProfilesInput({
          zoneSlug: readQueryParam(request.query.zoneSlug),
          applianceTypeSlug: readQueryParam(request.query.applianceTypeSlug),
          available: readQueryParam(request.query.available),
        }),
      );

      ok(response, profiles);
    }),
  );

  router.get(
    '/api/public/technician-profiles/:publicSlug',
    asyncHandler(async (request, response) => {
      const profile = await getPublicTechnicianProfileBySlug(
        options.supabase,
        validatePublicTechnicianSlug(request.params.publicSlug),
      );

      ok(response, profile);
    }),
  );

  return router;
}
