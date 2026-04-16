import type { NextFunction, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RequestWithId } from '../core/http.js';
import { ForbiddenError } from '../core/errors.js';
import { requireAuth } from './require-auth.js';

interface RequireAdminOptions {
  supabase: SupabaseClient;
}

export function requireAdmin(options: RequireAdminOptions) {
  const ensureAuthenticated = requireAuth(options);

  return async function requireAdminMiddleware(
    request: RequestWithId,
    response: Response,
    next: NextFunction,
  ) {
    await ensureAuthenticated(request, response, (error?: unknown) => {
      if (error) {
        next(error);
        return;
      }

      if (!request.auth || request.auth.role !== 'admin') {
        next(new ForbiddenError('Admin role required'));
        return;
      }

      next();
    });
  };
}
