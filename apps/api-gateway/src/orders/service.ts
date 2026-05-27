import type {
  CreateOrderInput,
  ListAdminOrdersInput,
  ListMyOrdersInput,
  PaginatedAdminOrders,
  PaginatedOrders,
  UpdateAdminOrderInput,
} from '@servicienta/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../core/errors.js';
import type { RequestAuth } from '../core/http.js';
import { mapAdminOrderRow, mapOrderRow } from './mapper.js';
import type { AdminOrderRow, OrderRow } from './types.js';
import {
  validateCreateOrderInput,
  validateUpdateAdminOrderInput,
} from './validators.js';

const ORDER_SELECT =
  'id, client_id, technician_id, status, flow_type, description, service_address_text, service_lat, service_lng, address_notes, zone_slug, appliance_type_slug, created_at, updated_at';

const ADMIN_ORDER_SELECT = `
  id,
  client_id,
  technician_id,
  status,
  flow_type,
  description,
  service_address_text,
  service_lat,
  service_lng,
  address_notes,
  zone_slug,
  appliance_type_slug,
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
  const technicianId = await findTechnicianIdByPublicSlug(
    supabase,
    payload.technician_public_slug,
  );

  const { data, error } = await supabase
    .from('orders')
    .insert({
      client_id: auth.id,
      technician_id: technicianId,
      status: 'pending',
      flow_type: 'client_selects',
      description: payload.description,
      service_address_text: payload.service_address_text,
      service_lat: payload.service_lat,
      service_lng: payload.service_lng,
      address_notes: payload.address_notes,
      zone_slug: payload.zone_slug,
      appliance_type_slug: payload.appliance_type_slug,
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
  if (auth.role === 'client') {
    return listOrdersCore(supabase, input, 'client_id', auth.id);
  }
  if (auth.role === 'technician') {
    return listOrdersCore(supabase, input, 'technician_id', auth.id);
  }

  throw new ForbiddenError('Client or technician role required');
}

export async function getMyOrderById(
  supabase: SupabaseClient,
  auth: RequestAuth,
  orderId: string,
) {
  let query = supabase.from('orders').select(ORDER_SELECT).eq('id', orderId);

  if (auth.role === 'client') query = query.eq('client_id', auth.id);
  else if (auth.role === 'technician')
    query = query.eq('technician_id', auth.id);
  else throw new ForbiddenError('Client or technician role required');

  const { data, error } = await query.maybeSingle();

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
  const pendingCountQuery = buildOrdersStatusCountQuery(
    supabase,
    input,
    'pending',
  );
  const acceptedCountQuery = buildOrdersStatusCountQuery(
    supabase,
    input,
    'accepted',
  );
  const cancelledCountQuery = buildOrdersStatusCountQuery(
    supabase,
    input,
    'cancelled',
  );
  const inProgressCountQuery = buildOrdersStatusCountQuery(
    supabase,
    input,
    'in_progress',
  );
  const completedTechCountQuery = buildOrdersStatusCountQuery(
    supabase,
    input,
    'completed_tech',
  );
  const completedCountQuery = buildOrdersStatusCountQuery(
    supabase,
    input,
    'completed',
  );

  const [
    ordersResult,
    totalResult,
    pendingCountResult,
    acceptedCountResult,
    cancelledCountResult,
    inProgressCountResult,
    completedTechCountResult,
    completedCountResult,
  ] = await Promise.all([
    ordersQuery,
    totalQuery,
    pendingCountQuery,
    acceptedCountQuery,
    cancelledCountQuery,
    inProgressCountQuery,
    completedTechCountQuery,
    completedCountQuery,
  ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (totalResult.error) throw new Error(totalResult.error.message);
  if (pendingCountResult.error)
    throw new Error(pendingCountResult.error.message);
  if (acceptedCountResult.error)
    throw new Error(acceptedCountResult.error.message);
  if (cancelledCountResult.error)
    throw new Error(cancelledCountResult.error.message);
  if (inProgressCountResult.error)
    throw new Error(inProgressCountResult.error.message);
  if (completedTechCountResult.error)
    throw new Error(completedTechCountResult.error.message);
  if (completedCountResult.error)
    throw new Error(completedCountResult.error.message);

  const total = totalResult.count ?? ordersResult.count ?? 0;

  return {
    items: ((ordersResult.data ?? []) as unknown as AdminOrderRow[]).flatMap(
      (row) => {
        const order = mapAdminOrderRow(row);

        return order ? [order] : [];
      },
    ),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: total === 0 ? 1 : Math.ceil(total / input.pageSize),
    },
    summary: {
      totalOrders: total,
      pendingOrders: pendingCountResult.count ?? 0,
      acceptedOrders: acceptedCountResult.count ?? 0,
      cancelledOrders: cancelledCountResult.count ?? 0,
      inProgressOrders: inProgressCountResult.count ?? 0,
      completedTechOrders: completedTechCountResult.count ?? 0,
      completedOrders: completedCountResult.count ?? 0,
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
      technician_id: payload.technician_id,
      zone_slug: payload.zone_slug,
      appliance_type_slug: payload.appliance_type_slug,
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

export async function cancelOrder(
  supabase: SupabaseClient,
  auth: RequestAuth,
  orderId: string,
) {
  const order = await getMyOrderById(supabase, auth, orderId);

  if (order.status === 'completed') {
    throw new ValidationError('Completed orders cannot be cancelled');
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', order.id)
    .select(ORDER_SELECT)
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from('operations')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('order_id', order.id)
    .neq('status', 'completed');

  return mapOrderRow(data as OrderRow);
}

export async function acceptOrder(
  supabase: SupabaseClient,
  auth: RequestAuth,
  orderId: string,
) {
  ensureTechnicianRole(auth);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .eq('technician_id', auth.id)
    .maybeSingle();

  if (orderError) throw new Error(orderError.message);
  if (!order) throw new NotFoundError('Order not found');
  if (order.status !== 'pending') {
    throw new ValidationError('Only pending orders can be accepted');
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('technician_id', auth.id);

  if (updateError) throw new Error(updateError.message);

  const { error: operationError } = await supabase.from('operations').insert({
    order_id: orderId,
    technician_id: auth.id,
    status: 'pending',
  });

  if (operationError) throw new Error(operationError.message);

  return getMyOrderById(supabase, auth, orderId);
}

async function listOrdersCore(
  supabase: SupabaseClient,
  input: ListMyOrdersInput,
  ownerColumn: 'client_id' | 'technician_id',
  ownerId: string,
): Promise<PaginatedOrders> {
  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;

  const ordersQuery = buildMyOrdersQuery(
    supabase,
    input,
    ownerColumn,
    ownerId,
    from,
    to,
  );
  const totalQuery = buildMyOrdersCountQuery(
    supabase,
    input,
    ownerColumn,
    ownerId,
  );
  const pendingCountQuery = buildMyOrdersStatusCountQuery(
    supabase,
    input,
    ownerColumn,
    ownerId,
    'pending',
  );
  const acceptedCountQuery = buildMyOrdersStatusCountQuery(
    supabase,
    input,
    ownerColumn,
    ownerId,
    'accepted',
  );
  const cancelledCountQuery = buildMyOrdersStatusCountQuery(
    supabase,
    input,
    ownerColumn,
    ownerId,
    'cancelled',
  );
  const inProgressCountQuery = buildMyOrdersStatusCountQuery(
    supabase,
    input,
    ownerColumn,
    ownerId,
    'in_progress',
  );
  const completedTechCountQuery = buildMyOrdersStatusCountQuery(
    supabase,
    input,
    ownerColumn,
    ownerId,
    'completed_tech',
  );
  const completedCountQuery = buildMyOrdersStatusCountQuery(
    supabase,
    input,
    ownerColumn,
    ownerId,
    'completed',
  );

  const [
    ordersResult,
    totalResult,
    pendingCountResult,
    acceptedCountResult,
    cancelledCountResult,
    inProgressCountResult,
    completedTechCountResult,
    completedCountResult,
  ] = await Promise.all([
    ordersQuery,
    totalQuery,
    pendingCountQuery,
    acceptedCountQuery,
    cancelledCountQuery,
    inProgressCountQuery,
    completedTechCountQuery,
    completedCountQuery,
  ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (totalResult.error) throw new Error(totalResult.error.message);
  if (pendingCountResult.error)
    throw new Error(pendingCountResult.error.message);
  if (acceptedCountResult.error) {
    throw new Error(acceptedCountResult.error.message);
  }
  if (cancelledCountResult.error) {
    throw new Error(cancelledCountResult.error.message);
  }
  if (inProgressCountResult.error)
    throw new Error(inProgressCountResult.error.message);
  if (completedTechCountResult.error) {
    throw new Error(completedTechCountResult.error.message);
  }
  if (completedCountResult.error) {
    throw new Error(completedCountResult.error.message);
  }

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
      pendingOrders: pendingCountResult.count ?? 0,
      acceptedOrders: acceptedCountResult.count ?? 0,
      cancelledOrders: cancelledCountResult.count ?? 0,
      inProgressOrders: inProgressCountResult.count ?? 0,
      completedTechOrders: completedTechCountResult.count ?? 0,
      completedOrders: completedCountResult.count ?? 0,
    },
  };
}

function buildMyOrdersQuery(
  supabase: SupabaseClient,
  input: ListMyOrdersInput,
  ownerColumn: 'client_id' | 'technician_id',
  ownerId: string,
  from: number,
  to: number,
) {
  let query = supabase
    .from('orders')
    .select(ORDER_SELECT, { count: 'exact' })
    .eq(ownerColumn, ownerId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (input.status) query = query.eq('status', input.status);
  if (input.search) query = applyOrderSearch(query, input.search);

  return query;
}

function buildMyOrdersCountQuery(
  supabase: SupabaseClient,
  input: ListMyOrdersInput,
  ownerColumn: 'client_id' | 'technician_id',
  ownerId: string,
) {
  let query = supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq(ownerColumn, ownerId);

  if (input.status) query = query.eq('status', input.status);
  if (input.search) query = applyOrderSearch(query, input.search);

  return query;
}

function buildMyOrdersStatusCountQuery(
  supabase: SupabaseClient,
  input: ListMyOrdersInput,
  ownerColumn: 'client_id' | 'technician_id',
  ownerId: string,
  status:
    | 'pending'
    | 'accepted'
    | 'cancelled'
    | 'in_progress'
    | 'completed_tech'
    | 'completed',
) {
  let query = supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq(ownerColumn, ownerId)
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
  if (input.technician_id) {
    query = query.eq('technician_id', input.technician_id);
  }
  if (input.search) query = applyAdminOrderSearch(query, input.search);

  return query;
}

function buildAdminOrdersCountQuery(
  supabase: SupabaseClient,
  input: ListAdminOrdersInput,
) {
  let query = supabase.from('orders').select('id', {
    count: 'exact',
    head: true,
  });

  if (input.status) query = query.eq('status', input.status);
  if (input.flow_type) query = query.eq('flow_type', input.flow_type);
  if (input.technician_id) {
    query = query.eq('technician_id', input.technician_id);
  }
  if (input.search) query = applyAdminOrderSearch(query, input.search);

  return query;
}

function buildOrdersStatusCountQuery(
  supabase: SupabaseClient,
  input: ListAdminOrdersInput,
  status:
    | 'pending'
    | 'accepted'
    | 'cancelled'
    | 'in_progress'
    | 'completed_tech'
    | 'completed',
) {
  let query = supabase
    .from('orders')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('status', status);

  if (input.flow_type) query = query.eq('flow_type', input.flow_type);
  if (input.technician_id) {
    query = query.eq('technician_id', input.technician_id);
  }
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

function ensureTechnicianRole(auth: RequestAuth) {
  if (auth.role !== 'technician') {
    throw new ForbiddenError('Technician role required');
  }
}

async function findTechnicianIdByPublicSlug(
  supabase: SupabaseClient,
  publicSlug: string,
) {
  const { data, error } = await supabase
    .from('technician_profiles')
    .select('id')
    .eq('public_slug', publicSlug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError('Technician profile not found');

  return data.id;
}
