import { Router } from 'express'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ok } from '../core/http-response.js'
import { asyncHandler } from '../middleware/async-handler.js'
import {
  getPublicTechnicianProfileBySlug,
  listPublicTechnicianProfiles,
} from './service.js'
import {
  validateListPublicTechnicianProfilesInput,
  validatePublicTechnicianSlug,
} from './validators.js'

interface TechnicianProfilesRouterOptions {
  supabase: SupabaseClient
}

export function technicianProfilesRouter(
  options: TechnicianProfilesRouterOptions,
) {
  const router = Router()

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
      )

      ok(response, profiles)
    }),
  )

  router.get(
    '/api/public/technician-profiles/:publicSlug',
    asyncHandler(async (request, response) => {
      const profile = await getPublicTechnicianProfileBySlug(
        options.supabase,
        validatePublicTechnicianSlug(request.params.publicSlug),
      )

      ok(response, profile)
    }),
  )

  return router
}

function readQueryParam(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0]
  }

  return undefined
}
