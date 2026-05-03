import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ok } from '../core/http-response.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { requireAuth } from '../middleware/require-auth.js';
import {
  completeOperation,
  createOperation,
  getAdminOperationById,
  getCurrentOperationById,
  listAdminOperations,
  listCurrentOperations,
} from './service.js';
import {
  validateCreateOperationInput,
  validateListAdminOperationsInput,
  validateListCurrentOperationsInput,
  validateOperationId,
  validateOrderId,
} from './validators.js';

interface OperationsRouterOptions {
  supabase: SupabaseClient;
}

export function operationsRouter(options: OperationsRouterOptions) {
  const router = Router();

  router.post(
    '/api/orders/:orderId/operations',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const operation = await createOperation(
        options.supabase,
        request.auth!,
        validateOrderId(request.params.orderId),
        validateCreateOperationInput(request.body),
      );

      ok(response, operation, 201);
    }),
  );

  router.get(
    '/api/operations/current',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const operations = await listCurrentOperations(
        options.supabase,
        request.auth!,
        validateListCurrentOperationsInput({
          page: readQueryParam(request.query.page),
          pageSize: readQueryParam(request.query.pageSize),
          status: readQueryParam(request.query.status),
        }),
      );

      ok(response, operations);
    }),
  );

  router.get(
    '/api/operations/:operationId',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const operation = await getCurrentOperationById(
        options.supabase,
        request.auth!,
        validateOperationId(request.params.operationId),
      );

      ok(response, operation);
    }),
  );

  router.post(
    '/api/operations/:operationId/complete',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const operation = await completeOperation(
        options.supabase,
        request.auth!,
        validateOperationId(request.params.operationId),
      );

      ok(response, operation);
    }),
  );

  router.get(
    '/api/admin/operations',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const operations = await listAdminOperations(
        options.supabase,
        validateListAdminOperationsInput({
          page: readQueryParam(request.query.page),
          pageSize: readQueryParam(request.query.pageSize),
          status: readQueryParam(request.query.status),
        }),
      );

      ok(response, operations);
    }),
  );

  router.get(
    '/api/admin/operations/:operationId',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const operation = await getAdminOperationById(
        options.supabase,
        validateOperationId(request.params.operationId),
      );

      ok(response, operation);
    }),
  );

  return router;
}

function readQueryParam(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];

  return undefined;
}
