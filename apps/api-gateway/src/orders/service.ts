import type {
  CreateOrderInput,
  ListAdminOrdersInput,
  ListMyOrdersInput,
  PaginatedAdminOrders,
  PaginatedOrders,
  UpdateAdminOrderInput,
} from '@servicienta/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ForbiddenError, NotFoundError } from '../core/errors.js';
import type { RequestAuth } from '../core/http.js';
import { mapAdminOrderRow, mapOrderRow } from './mapper.js';
import type { AdminOrderRow, OrderRow } from './types.js';
import {
  validateCreateOrderInput,
  validateUpdateAdminOrderInput,
} from './validators.js';

const ORDER_SELECT =
  'id, client_id, status, flow_type, description, service_address_text, service_lat, service_lng, address_notes, created_at, updated_at';

const ADMIN_ORDER_SELECT = `
  id,
  client_id,
  status,
  flow_type,
  description,
  service_address_text,
  service_lat,
  service_lng,
  address_notes,
  created_at,
  updated_at,
  client:users!orders_client_id_fkey(
    email,
    name,
    surname,
    status
  )
`;

export async function createOrder(
  supabase: SupabaseClient,
  auth: RequestAuth,
  input: CreateOrderInput,
) {
  ensureClientRole(auth);
  const payload = validateCreateOrderInput(input);

  const { data, error } = await supabase
    .from('orders')
    .insert({
      client_id: auth.id,
      status: 'open',
      flow_type: payload.flow_type,
      description: payload.description,
      service_address_text: payload.service_address_text,
      service_lat: payload.service_lat,
      service_lng: payload.service_lng,
      address_notes: payload.address_notes,
    })
    .select(ORDER_SELECT)
    .single();

  if (error) throw new Error(error.message);

  return mapOrderRow(data as OrderRow);
}

export async function listMyOrders(
  supabase: SupabaseClient,
  auth: RequestAuth,
  input: ListMyOrdersInput,
): Promise<PaginatedOrders> {
  ensureClientRole(auth);
  return listOrdersCore(supabase, input, auth.id);
}

export async function getMyOrderById(
  supabase: SupabaseClient,
  auth: RequestAuth,
  orderId: string,
) {
  ensureClientRole(auth);

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .eq('client_id', auth.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError('Order not found');

  return mapOrderRow(data as OrderRow);
}

export async function listAdminOrders(
  supabase: SupabaseClient,
  input: ListAdminOrdersInput,
): Promise<PaginatedAdminOrders> {
  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;

  const ordersQuery = buildAdminOrdersQuery(supabase, input, from, to);
  const totalQuery = buildAdminOrdersCountQuery(supabase, input);
  const openCountQuery = buildOrdersStatusCountQuery(supabase, input, 'open');
  const inProgressCountQuery = buildOrdersStatusCountQuery(
    supabase,
    input,
    'in_progress',
  );
  const enGarantiaCountQuery = buildOrdersStatusCountQuery(
    supabase,
    input,
    'en_garantia',
  );
  const closedCountQuery = buildOrdersStatusCountQuery(
    supabase,
    input,
    'closed',
  );

  const [
    ordersResult,
    totalResult,
    openCountResult,
    inProgressCountResult,
    enGarantiaCountResult,
    closedCountResult,
  ] = await Promise.all([
    ordersQuery,
    totalQuery,
    openCountQuery,
    inProgressCountQuery,
    enGarantiaCountQuery,
    closedCountQuery,
  ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (totalResult.error) throw new Error(totalResult.error.message);
  if (openCountResult.error) throw new Error(openCountResult.error.message);
  if (inProgressCountResult.error)
    throw new Error(inProgressCountResult.error.message);
  if (enGarantiaCountResult.error)
    throw new Error(enGarantiaCountResult.error.message);
  if (closedCountResult.error) throw new Error(closedCountResult.error.message);

  const total = totalResult.count ?? ordersResult.count ?? 0;

  return {
    items: ((ordersResult.data ?? []) as AdminOrderRow[]).flatMap((row) => {
      const order = mapAdminOrderRow(row);

      return order ? [order] : [];
    }),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: total === 0 ? 1 : Math.ceil(total / input.pageSize),
    },
    summary: {
      totalOrders: total,
      openOrders: openCountResult.count ?? 0,
      inProgressOrders: inProgressCountResult.count ?? 0,
      enGarantiaOrders: enGarantiaCountResult.count ?? 0,
      closedOrders: closedCountResult.count ?? 0,
    },
  };
}

export async function getAdminOrderById(
  supabase: SupabaseClient,
  orderId: string,
) {
  const { data, error } = await supabase
    .from('orders')
    .select(ADMIN_ORDER_SELECT)
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError('Order not found');

  const order = mapAdminOrderRow(data as AdminOrderRow);
  if (!order) throw new NotFoundError('Order not found');

  return order;
}

export async function updateAdminOrderById(
  supabase: SupabaseClient,
  orderId: string,
  input: UpdateAdminOrderInput,
) {
  const payload = validateUpdateAdminOrderInput(input);
  const existingOrder = await getAdminOrderById(supabase, orderId);

  const { data, error } = await supabase
    .from('orders')
    .update({
      status: payload.status,
      flow_type: payload.flow_type,
      description: payload.description,
      service_address_text: payload.service_address_text,
      service_lat: payload.service_lat,
      service_lng: payload.service_lng,
      address_notes: payload.address_notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingOrder.id)
    .select(ADMIN_ORDER_SELECT)
    .single();

  if (error) throw new Error(error.message);

  const order = mapAdminOrderRow(data as AdminOrderRow);
  if (!order) throw new NotFoundError('Order not found');

  return order;
}

async function listOrdersCore(
  supabase: SupabaseClient,
  input: ListMyOrdersInput,
  clientId: string,
): Promise<PaginatedOrders> {
  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;

  const ordersQuery = buildMyOrdersQuery(supabase, input, clientId, from, to);
  const totalQuery = buildMyOrdersCountQuery(supabase, input, clientId);
  const openCountQuery = buildMyOrdersStatusCountQuery(
    supabase,
    input,
    clientId,
    'open',
  );
  const inProgressCountQuery = buildMyOrdersStatusCountQuery(
    supabase,
    input,
    clientId,
    'in_progress',
  );
  const enGarantiaCountQuery = buildMyOrdersStatusCountQuery(
    supabase,
    input,
    clientId,
    'en_garantia',
  );
  const closedCountQuery = buildMyOrdersStatusCountQuery(
    supabase,
    input,
    clientId,
    'closed',
  );

  const [
    ordersResult,
    totalResult,
    openCountResult,
    inProgressCountResult,
    enGarantiaCountResult,
    closedCountResult,
  ] = await Promise.all([
    ordersQuery,
    totalQuery,
    openCountQuery,
    inProgressCountQuery,
    enGarantiaCountQuery,
    closedCountQuery,
  ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (totalResult.error) throw new Error(totalResult.error.message);
  if (openCountResult.error) throw new Error(openCountResult.error.message);
  if (inProgressCountResult.error)
    throw new Error(inProgressCountResult.error.message);
  if (enGarantiaCountResult.error)
    throw new Error(enGarantiaCountResult.error.message);
  if (closedCountResult.error) throw new Error(closedCountResult.error.message);

  const total = totalResult.count ?? ordersResult.count ?? 0;

  return {
    items: ((ordersResult.data ?? []) as OrderRow[]).map(mapOrderRow),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: total === 0 ? 1 : Math.ceil(total / input.pageSize),
    },
    summary: {
      totalOrders: total,
      openOrders: openCountResult.count ?? 0,
      inProgressOrders: inProgressCountResult.count ?? 0,
      enGarantiaOrders: enGarantiaCountResult.count ?? 0,
      closedOrders: closedCountResult.count ?? 0,
    },
  };
}

function buildMyOrdersQuery(
  supabase: SupabaseClient,
  input: ListMyOrdersInput,
  clientId: string,
  from: number,
  to: number,
) {
  let query = supabase
    .from('orders')
    .select(ORDER_SELECT, { count: 'exact' })
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (input.status) query = query.eq('status', input.status);
  if (input.search) query = applyOrderSearch(query, input.search);

  return query;
}

function buildMyOrdersCountQuery(
  supabase: SupabaseClient,
  input: ListMyOrdersInput,
  clientId: string,
) {
  let query = supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId);

  if (input.status) query = query.eq('status', input.status);
  if (input.search) query = applyOrderSearch(query, input.search);

  return query;
}

function buildMyOrdersStatusCountQuery(
  supabase: SupabaseClient,
  input: ListMyOrdersInput,
  clientId: string,
  status: 'open' | 'in_progress' | 'en_garantia' | 'closed',
) {
  let query = supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('status', status);

  if (input.search) query = applyOrderSearch(query, input.search);

  return query;
}

function buildAdminOrdersQuery(
  supabase: SupabaseClient,
  input: ListAdminOrdersInput,
  from: number,
  to: number,
) {
  let query = supabase
    .from('orders')
    .select(ADMIN_ORDER_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (input.status) query = query.eq('status', input.status);
  if (input.flow_type) query = query.eq('flow_type', input.flow_type);
  if (input.search) query = applyAdminOrderSearch(query, input.search);

  return query;
}

function buildAdminOrdersCountQuery(
  supabase: SupabaseClient,
  input: ListAdminOrdersInput,
) {
  let query = supabase
    .from('orders')
    .select('id', { count: 'exact', head: true });

  if (input.status) query = query.eq('status', input.status);
  if (input.flow_type) query = query.eq('flow_type', input.flow_type);
  if (input.search) query = applyAdminOrderSearch(query, input.search);

  return query;
}

function buildOrdersStatusCountQuery(
  supabase: SupabaseClient,
  input: ListAdminOrdersInput,
  status: 'open' | 'in_progress' | 'en_garantia' | 'closed',
) {
  let query = supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', status);

  if (input.flow_type) query = query.eq('flow_type', input.flow_type);
  if (input.search) query = applyAdminOrderSearch(query, input.search);

  return query;
}

function applyOrderSearch<TQuery extends { or(filters: string): TQuery }>(
  query: TQuery,
  search: string,
) {
  const escapedSearch = search.replace(/[%]/g, '');

  return query.or(
    `description.ilike.%${escapedSearch}%,service_address_text.ilike.%${escapedSearch}%`,
  );
}

function applyAdminOrderSearch<TQuery extends { or(filters: string): TQuery }>(
  query: TQuery,
  search: string,
) {
  const escapedSearch = search.replace(/[%]/g, '');

  return query.or(
    `description.ilike.%${escapedSearch}%,service_address_text.ilike.%${escapedSearch}%`,
  );
}

function ensureClientRole(auth: RequestAuth) {
  if (auth.role !== 'client') throw new ForbiddenError('Client role required');
}
