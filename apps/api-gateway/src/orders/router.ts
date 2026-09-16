import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ok } from '../core/http-response.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { requireAuth } from '../middleware/require-auth.js';
import {
  acceptOrder,
  cancelOrder,
  createOrder,
  getAdminOrderById,
  getMyOrderById,
  listAdminOrders,
  listMyOrders,
  updateAdminOrderById,
} from './service.js';
import {
  validateCreateOrderInput,
  validateListAdminOrdersInput,
  validateListMyOrdersInput,
  validateOrderId,
} from './validators.js';

interface OrdersRouterOptions {
  supabase: SupabaseClient;
}

export function ordersRouter(options: OrdersRouterOptions) {
  const router = Router();

  router.post(
    '/api/orders',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const order = await createOrder(
        options.supabase,
        request.auth!,
        validateCreateOrderInput(request.body),
      );

      ok(response, order, 201);
    }),
  );

  router.get(
    '/api/orders/current',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const orders = await listMyOrders(
        options.supabase,
        request.auth!,
        validateListMyOrdersInput({
          page: readQueryParam(request.query.page),
          pageSize: readQueryParam(request.query.pageSize),
          status: readQueryParam(request.query.status),
          search: readQueryParam(request.query.search),
          flowType: readQueryParam(request.query.flowType),
        }),
      );

      ok(response, orders);
    }),
  );

  router.get(
    '/api/orders/:orderId',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const order = await getMyOrderById(
        options.supabase,
        request.auth!,
        validateOrderId(request.params.orderId),
      );

      ok(response, order);
    }),
  );

  router.post(
    '/api/orders/:orderId/cancel',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const order = await cancelOrder(
        options.supabase,
        request.auth!,
        validateOrderId(request.params.orderId),
      );

      ok(response, order);
    }),
  );

  router.post(
    '/api/orders/:orderId/accept',
    requireAuth({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const order = await acceptOrder(
        options.supabase,
        request.auth!,
        validateOrderId(request.params.orderId),
      );

      ok(response, order);
    }),
  );

  router.get(
    '/api/admin/orders',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const orders = await listAdminOrders(
        options.supabase,
        validateListAdminOrdersInput({
          page: readQueryParam(request.query.page),
          pageSize: readQueryParam(request.query.pageSize),
          status: readQueryParam(request.query.status),
          flowType: readQueryParam(request.query.flowType),
          search: readQueryParam(request.query.search),
          technicianId: readQueryParam(request.query.technicianId),
          clientId: readQueryParam(request.query.clientId),
        }),
      );

      ok(response, orders);
    }),
  );

  router.get(
    '/api/admin/orders/:orderId',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const order = await getAdminOrderById(
        options.supabase,
        validateOrderId(request.params.orderId),
      );

      ok(response, order);
    }),
  );

  router.patch(
    '/api/admin/orders/:orderId',
    requireAdmin({ supabase: options.supabase }),
    asyncHandler(async (request, response) => {
      const order = await updateAdminOrderById(
        options.supabase,
        request.auth!,
        validateOrderId(request.params.orderId),
        request.body,
      );

      ok(response, order);
    }),
  );

  return router;
}

function readQueryParam(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];

  return undefined;
}
