import type {
  NextFunction,
  Response,
} from 'express'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RequestWithId } from '../core/http.js'
import { extractBearerToken } from '../core/auth.js'
import { getCurrentUser, authenticateUser } from '../users/service.js'

interface RequireAuthOptions {
  supabase: SupabaseClient
}

export function requireAuth(options: RequireAuthOptions) {
  return async function requireAuthMiddleware(
    request: RequestWithId,
    _response: Response,
    next: NextFunction,
  ) {
    try {
      const authenticatedUser = await authenticateUser(
        options.supabase,
        extractBearerToken(request),
      )
      const currentUser = await getCurrentUser(options.supabase, authenticatedUser)

      request.auth = currentUser

      next()
    } catch (error) {
      next(error)
    }
  }
}
