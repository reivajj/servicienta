import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ok } from '../core/http-response.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { requireAuth } from '../middleware/require-auth.js';
import {
  cancelOperation,
  completeOperation,
  completeTechOperation,
  confirmCompletedOperation,
  createOperation,
  createTechnicianReview,
  getAdminOperationById,
  getCurrentOperationById,
  listAdminOperations,
  listCurrentOperations,
  scheduleOperation,
  updateAdminOperationById,
} from './service.js';
import {
  validateCreateOperationInput,
  validateCreateTechnicianReviewInput,
  validateListAdminOperationsInput,
  validateListCurrentOperationsInput,
  validateOperationId,
  validateOrderId,
  validateScheduleOperationInput,
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
    '/api/operations/:operationId/schedule',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const operation = await scheduleOperation(
        options.supabase,
        request.auth!,
        validateOperationId(request.params.operationId),
        validateScheduleOperationInput(request.body),
      );

      ok(response, operation);
    }),
  );

  router.post(
    '/api/operations/:operationId/complete-tech',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const operation = await completeTechOperation(
        options.supabase,
        request.auth!,
        validateOperationId(request.params.operationId),
      );

      ok(response, operation);
    }),
  );

  router.post(
    '/api/operations/:operationId/confirm-completed',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const operation = await confirmCompletedOperation(
        options.supabase,
        request.auth!,
        validateOperationId(request.params.operationId),
      );

      ok(response, operation);
    }),
  );

  router.post(
    '/api/operations/:operationId/cancel',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const operation = await cancelOperation(
        options.supabase,
        request.auth!,
        validateOperationId(request.params.operationId),
      );

      ok(response, operation);
    }),
  );

  router.post(
    '/api/operations/:operationId/review',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const operation = await createTechnicianReview(
        options.supabase,
        request.auth!,
        validateOperationId(request.params.operationId),
        validateCreateTechnicianReviewInput(request.body),
      );

      ok(response, operation, 201);
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
          orderId: readQueryParam(request.query.orderId),
          technicianId: readQueryParam(request.query.technicianId),
          clientId: readQueryParam(request.query.clientId),
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

  router.patch(
    '/api/admin/operations/:operationId',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const operation = await updateAdminOperationById(
        options.supabase,
        request.auth!,
        validateOperationId(request.params.operationId),
        request.body,
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
