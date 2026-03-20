import { Router } from 'express'
import type { SupabaseClient } from '@supabase/supabase-js'
import { extractBearerToken } from '../core/auth.js'
import { ok } from '../core/http-response.js'
import { asyncHandler } from '../middleware/async-handler.js'
import {
  authenticateUser,
  getCurrentUser,
  updateCurrentUser,
} from './service.js'

interface UsersRouterOptions {
  supabase: SupabaseClient
}

export function usersRouter(options: UsersRouterOptions) {
  const router = Router()

  router.get(
    '/api/me',
    asyncHandler(async (request, response) => {
      const authenticatedUser = await authenticateUser(
        options.supabase,
        extractBearerToken(request),
      )
      const user = await getCurrentUser(options.supabase, authenticatedUser)

      ok(response, user)
    }),
  )

  router.patch(
    '/api/me',
    asyncHandler(async (request, response) => {
      const authenticatedUser = await authenticateUser(
        options.supabase,
        extractBearerToken(request),
      )
      const user = await updateCurrentUser(
        options.supabase,
        authenticatedUser,
        request.body,
      )

      ok(response, user)
    }),
  )

  return router
}
