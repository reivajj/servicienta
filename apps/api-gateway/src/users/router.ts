import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ValidationError } from '../core/errors.js';
import { ok } from '../core/http-response.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { requireAuth } from '../middleware/require-auth.js';
import {
  deleteUserById,
  getUserById,
  listUsers,
  restoreUserById,
  updateUserById,
  updateCurrentUser,
} from './service.js';
import { validateListUsersInput } from './validators.js';

interface UsersRouterOptions {
  supabase: SupabaseClient;
}

export function usersRouter(options: UsersRouterOptions) {
  const router = Router();

  router.get(
    '/api/users/current',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (_request, response) => {
      ok(response, _request.auth);
    }),
  );

  router.patch(
    '/api/users/current',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const user = await updateCurrentUser(
        options.supabase,
        request.auth!,
        request.body,
      );

      ok(response, user);
    }),
  );

  router.get(
    '/api/users',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const users = await listUsers(
        options.supabase,
        validateListUsersInput({
          page: readQueryParam(request.query.page),
          pageSize: readQueryParam(request.query.pageSize),
          status: readQueryParam(request.query.status),
          role: readQueryParam(request.query.role),
          search: readQueryParam(request.query.search),
        }),
      );

      ok(response, users);
    }),
  );

  router.get(
    '/api/users/:userId',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const user = await getUserById(
        options.supabase,
        readUserIdParam(request.params.userId),
      );

      ok(response, user);
    }),
  );

  router.patch(
    '/api/users/:userId',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const user = await updateUserById(
        options.supabase,
        readUserIdParam(request.params.userId),
        request.body,
      );

      ok(response, user);
    }),
  );

  router.delete(
    '/api/users/:userId',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const user = await deleteUserById(
        options.supabase,
        readUserIdParam(request.params.userId),
        request.auth?.id,
      );

      ok(response, user);
    }),
  );

  router.patch(
    '/api/users/:userId/restore',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const user = await restoreUserById(
        options.supabase,
        readUserIdParam(request.params.userId),
      );

      ok(response, user);
    }),
  );

  return router;
}

function readUserIdParam(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Invalid user id');
  }

  return value;
}

function readQueryParam(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return undefined;
}
