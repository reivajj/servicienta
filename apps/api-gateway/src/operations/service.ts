import type {
  AdminOperation,
  CreateOperationInput,
  ListAdminOperationsInput,
  ListCurrentOperationsInput,
  OperationStatus,
  PaginatedAdminOperations,
  PaginatedOperations,
  ScheduleOperationInput,
  UpdateAdminOperationInput,
} from '@servicienta/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../core/errors.js';
import type { RequestAuth } from '../core/http.js';
import { mapAdminOperationRow, mapOperationRow } from './mapper.js';
import type {
  AdminOperationRow,
  OperationRow,
  TechnicianReviewRow,
} from './types.js';
import {
  validateCreateOperationInput,
  validateScheduleOperationInput,
  validateUpdateAdminOperationInput,
} from './validators.js';

const OPERATION_SELECT =
  'id, order_id, technician_id, status, scheduled_at, description, technician_completed_at, completed_at, created_at, updated_at';

const CURRENT_OPERATION_SELECT = `
  id,
  order_id,
  technician_id,
  status,
  scheduled_at,
  description,
  technician_completed_at,
  completed_at,
  created_at,
  updated_at,
  order:orders!inner(
    client_id
  )
`;

const ADMIN_OPERATION_SELECT = `
  id,
  order_id,
  technician_id,
  status,
  scheduled_at,
  description,
  technician_completed_at,
  completed_at,
  created_at,
  updated_at,
  order:orders!operations_order_id_fkey(
    status,
    flow_type,
    service_address_text,
    client_id,
    client:users!orders_client_id_fkey(
      email,
      name,
      surname
    )
  ),
  technician:technician_profiles!operations_technician_id_fkey(
    public_slug,
    user:users!technician_profiles_id_fkey(
      email,
      name,
      surname
    )
  )
`;

export async function createOperation(
  supabase: SupabaseClient,
  auth: RequestAuth,
  orderId: string,
  input: CreateOperationInput,
) {
  ensureClientRole(auth);
  const payload = validateCreateOperationInput(input);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, client_id, status')
    .eq('id', orderId)
    .eq('client_id', auth.id)
    .maybeSingle();

  if (orderError) throw new Error(orderError.message);
  if (!order) throw new NotFoundError('Order not found');
  if (order.status !== 'accepted') {
    throw new ValidationError('Order is not accepted for a new operation');
  }

  const { data: technician, error: technicianError } = await supabase
    .from('technician_profiles')
    .select('id')
    .eq('id', payload.technician_id)
    .maybeSingle();

  if (technicianError) throw new Error(technicianError.message);
  if (!technician) throw new NotFoundError('Technician profile not found');

  const { data, error } = await supabase
    .from('operations')
    .insert({
      order_id: orderId,
      technician_id: payload.technician_id,
      status: 'pending',
      scheduled_at: payload.scheduled_at,
    })
    .select(OPERATION_SELECT)
    .single();

  if (error) throw new Error(error.message);

  const { error: updateOrderError } = await supabase
    .from('orders')
    .update({ status: 'in_progress' })
    .eq('id', orderId)
    .eq('client_id', auth.id);

  if (updateOrderError) throw new Error(updateOrderError.message);

  return mapOperationRow(data as OperationRow);
}

export async function listCurrentOperations(
  supabase: SupabaseClient,
  auth: RequestAuth,
  input: ListCurrentOperationsInput,
): Promise<PaginatedOperations> {
  if (auth.role === 'client') {
    return listClientOperations(supabase, auth.id, input);
  }

  if (auth.role === 'technician') {
    return listTechnicianOperations(supabase, auth.id, input);
  }

  throw new ForbiddenError('Client or technician role required');
}

export async function getCurrentOperationById(
  supabase: SupabaseClient,
  auth: RequestAuth,
  operationId: string,
) {
  if (auth.role === 'client') {
    const { data, error } = await supabase
      .from('operations')
      .select(CURRENT_OPERATION_SELECT)
      .eq('id', operationId)
      .eq('order.client_id', auth.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundError('Operation not found');

    return mapOperationRow(data as OperationRow);
  }

  if (auth.role === 'technician') {
    const { data, error } = await supabase
      .from('operations')
      .select(OPERATION_SELECT)
      .eq('id', operationId)
      .eq('technician_id', auth.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundError('Operation not found');

    return mapOperationRow(data as OperationRow);
  }

  throw new ForbiddenError('Client or technician role required');
}

export async function scheduleOperation(
  supabase: SupabaseClient,
  auth: RequestAuth,
  operationId: string,
  input: ScheduleOperationInput,
) {
  ensureTechnicianRole(auth);
  const payload = validateScheduleOperationInput(input);

  const { data: operation, error: operationError } = await supabase
    .from('operations')
    .select('id, order_id, technician_id, status')
    .eq('id', operationId)
    .eq('technician_id', auth.id)
    .maybeSingle();

  if (operationError) throw new Error(operationError.message);
  if (!operation) throw new NotFoundError('Operation not found');
  if (operation.status !== 'pending') {
    throw new ValidationError('Only pending operations can be scheduled');
  }

  const { data, error } = await supabase
    .from('operations')
    .update({
      status: 'scheduled',
      scheduled_at: payload.scheduled_at,
      description: payload.description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', operationId)
    .eq('technician_id', auth.id)
    .select(OPERATION_SELECT)
    .single();

  if (error) throw new Error(error.message);

  const { error: updateOrderError } = await supabase
    .from('orders')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', operation.order_id);

  if (updateOrderError) throw new Error(updateOrderError.message);

  return mapOperationRow(data as OperationRow);
}

export async function completeTechOperation(
  supabase: SupabaseClient,
  auth: RequestAuth,
  operationId: string,
) {
  ensureTechnicianRole(auth);

  const { data: operation, error: operationError } = await supabase
    .from('operations')
    .select('id, order_id, technician_id, status')
    .eq('id', operationId)
    .eq('technician_id', auth.id)
    .maybeSingle();

  if (operationError) throw new Error(operationError.message);
  if (!operation) throw new NotFoundError('Operation not found');
  if (operation.status !== 'scheduled') {
    throw new ValidationError('Only scheduled operations can be completed');
  }

  const completedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from('operations')
    .update({
      status: 'completed_tech',
      technician_completed_at: completedAt,
      updated_at: completedAt,
    })
    .eq('id', operationId)
    .eq('technician_id', auth.id)
    .select(OPERATION_SELECT)
    .single();

  if (error) throw new Error(error.message);

  const { error: updateOrderError } = await supabase
    .from('orders')
    .update({ status: 'completed_tech', updated_at: completedAt })
    .eq('id', operation.order_id);

  if (updateOrderError) throw new Error(updateOrderError.message);

  return mapOperationRow(data as OperationRow);
}

export async function confirmCompletedOperation(
  supabase: SupabaseClient,
  auth: RequestAuth,
  operationId: string,
) {
  ensureClientRole(auth);

  const { data: operation, error: operationError } = await supabase
    .from('operations')
    .select('id, order_id, status, order:orders!inner(client_id)')
    .eq('id', operationId)
    .eq('order.client_id', auth.id)
    .maybeSingle();

  if (operationError) throw new Error(operationError.message);
  if (!operation) throw new NotFoundError('Operation not found');
  if (operation.status !== 'completed_tech') {
    throw new ValidationError(
      'Only technician-completed operations can be confirmed',
    );
  }

  const completedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from('operations')
    .update({
      status: 'completed',
      completed_at: completedAt,
      updated_at: completedAt,
    })
    .eq('id', operationId)
    .select(OPERATION_SELECT)
    .single();

  if (error) throw new Error(error.message);

  const { error: updateOrderError } = await supabase
    .from('orders')
    .update({ status: 'completed', updated_at: completedAt })
    .eq('id', operation.order_id);

  if (updateOrderError) throw new Error(updateOrderError.message);

  return mapOperationRow(data as OperationRow);
}

export async function cancelOperation(
  supabase: SupabaseClient,
  auth: RequestAuth,
  operationId: string,
) {
  ensureTechnicianRole(auth);

  const { data: operation, error: operationError } = await supabase
    .from('operations')
    .select('id, order_id, technician_id, status')
    .eq('id', operationId)
    .eq('technician_id', auth.id)
    .maybeSingle();

  if (operationError) throw new Error(operationError.message);
  if (!operation) throw new NotFoundError('Operation not found');
  if (
    operation.status === 'completed' ||
    operation.status === 'completed_tech'
  ) {
    throw new ValidationError('Completed operations cannot be cancelled');
  }

  const updatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from('operations')
    .update({ status: 'cancelled', updated_at: updatedAt })
    .eq('id', operationId)
    .eq('technician_id', auth.id)
    .select(OPERATION_SELECT)
    .single();

  if (error) throw new Error(error.message);

  const { error: updateOrderError } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: updatedAt })
    .eq('id', operation.order_id);

  if (updateOrderError) throw new Error(updateOrderError.message);

  return mapOperationRow(data as OperationRow);
}

export const completeOperation = completeTechOperation;

export async function listAdminOperations(
  supabase: SupabaseClient,
  input: ListAdminOperationsInput,
): Promise<PaginatedAdminOperations> {
  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;

  const operationsQuery = buildAdminOperationsQuery(supabase, input, from, to);
  const totalQuery = buildAdminOperationsCountQuery(supabase, input);
  const pendingCountQuery = buildOperationsStatusCountQuery(
    supabase,
    input,
    'pending',
  );
  const scheduledCountQuery = buildOperationsStatusCountQuery(
    supabase,
    input,
    'scheduled',
  );
  const completedTechCountQuery = buildOperationsStatusCountQuery(
    supabase,
    input,
    'completed_tech',
  );
  const completedCountQuery = buildOperationsStatusCountQuery(
    supabase,
    input,
    'completed',
  );
  const cancelledCountQuery = buildOperationsStatusCountQuery(
    supabase,
    input,
    'cancelled',
  );

  const [
    operationsResult,
    totalResult,
    pendingCountResult,
    scheduledCountResult,
    completedTechCountResult,
    completedCountResult,
    cancelledCountResult,
  ] = await Promise.all([
    operationsQuery,
    totalQuery,
    pendingCountQuery,
    scheduledCountQuery,
    completedTechCountQuery,
    completedCountQuery,
    cancelledCountQuery,
  ]);

  if (operationsResult.error) throw new Error(operationsResult.error.message);
  if (totalResult.error) throw new Error(totalResult.error.message);
  if (pendingCountResult.error)
    throw new Error(pendingCountResult.error.message);
  if (scheduledCountResult.error) {
    throw new Error(scheduledCountResult.error.message);
  }
  if (completedTechCountResult.error) {
    throw new Error(completedTechCountResult.error.message);
  }
  if (completedCountResult.error) {
    throw new Error(completedCountResult.error.message);
  }
  if (cancelledCountResult.error) {
    throw new Error(cancelledCountResult.error.message);
  }

  const total = totalResult.count ?? operationsResult.count ?? 0;

  const items = ((operationsResult.data ?? []) as AdminOperationRow[]).flatMap(
    (row) => {
      const operation = mapAdminOperationRow(row);

      return operation ? [operation] : [];
    },
  );

  return {
    items: await attachTechnicianReviews(supabase, items),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: total === 0 ? 1 : Math.ceil(total / input.pageSize),
    },
    summary: {
      totalOperations: total,
      pendingOperations: pendingCountResult.count ?? 0,
      scheduledOperations: scheduledCountResult.count ?? 0,
      completedTechOperations: completedTechCountResult.count ?? 0,
      completedOperations: completedCountResult.count ?? 0,
      cancelledOperations: cancelledCountResult.count ?? 0,
    },
  };
}

export async function getAdminOperationById(
  supabase: SupabaseClient,
  operationId: string,
) {
  const { data, error } = await supabase
    .from('operations')
    .select(ADMIN_OPERATION_SELECT)
    .eq('id', operationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError('Operation not found');

  const operation = mapAdminOperationRow(data as AdminOperationRow);
  if (!operation) throw new NotFoundError('Operation not found');

  const [operationWithReview] = await attachTechnicianReviews(supabase, [
    operation,
  ]);

  return operationWithReview;
}

export async function updateAdminOperationById(
  supabase: SupabaseClient,
  operationId: string,
  input: UpdateAdminOperationInput,
) {
  const payload = validateUpdateAdminOperationInput(input);
  const existingOperation = await getAdminOperationById(supabase, operationId);

  const { data, error } = await supabase
    .from('operations')
    .update({
      status: payload.status,
      scheduled_at: payload.scheduled_at,
      description: payload.description,
      technician_completed_at: payload.technician_completed_at,
      completed_at: payload.completed_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingOperation.id)
    .select(ADMIN_OPERATION_SELECT)
    .single();

  if (error) throw new Error(error.message);

  const operation = mapAdminOperationRow(data as AdminOperationRow);
  if (!operation) throw new NotFoundError('Operation not found');

  const [operationWithReview] = await attachTechnicianReviews(supabase, [
    operation,
  ]);

  return operationWithReview;
}

async function attachTechnicianReviews(
  supabase: SupabaseClient,
  operations: AdminOperation[],
): Promise<AdminOperation[]> {
  if (!operations.length) return operations;

  const operationIds = operations.map((operation) => operation.id);

  const { data, error } = await supabase
    .from('technician_reviews')
    .select('id, technician_id, operation_id, rating, comment, created_at')
    .in('operation_id', operationIds);

  if (error) throw new Error(error.message);

  const reviewsByOperationId = new Map<string, TechnicianReviewRow>();

  for (const review of (data ?? []) as TechnicianReviewRow[]) {
    reviewsByOperationId.set(review.operation_id, review);
  }

  return operations.map((operation) => {
    const review = reviewsByOperationId.get(operation.id);

    return {
      ...operation,
      technician_review: review
        ? {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            created_at: review.created_at,
          }
        : null,
    };
  });
}

async function listClientOperations(
  supabase: SupabaseClient,
  clientId: string,
  input: ListCurrentOperationsInput,
): Promise<PaginatedOperations> {
  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;

  const operationsQuery = buildClientOperationsQuery(
    supabase,
    input,
    clientId,
    from,
    to,
  );
  const totalQuery = buildClientOperationsCountQuery(supabase, input, clientId);
  const pendingCountQuery = buildClientOperationsStatusCountQuery(
    supabase,
    input,
    clientId,
    'pending',
  );
  const scheduledCountQuery = buildClientOperationsStatusCountQuery(
    supabase,
    input,
    clientId,
    'scheduled',
  );
  const completedTechCountQuery = buildClientOperationsStatusCountQuery(
    supabase,
    input,
    clientId,
    'completed_tech',
  );
  const completedCountQuery = buildClientOperationsStatusCountQuery(
    supabase,
    input,
    clientId,
    'completed',
  );
  const cancelledCountQuery = buildClientOperationsStatusCountQuery(
    supabase,
    input,
    clientId,
    'cancelled',
  );

  const [
    operationsResult,
    totalResult,
    pendingCountResult,
    scheduledCountResult,
    completedTechCountResult,
    completedCountResult,
    cancelledCountResult,
  ] = await Promise.all([
    operationsQuery,
    totalQuery,
    pendingCountQuery,
    scheduledCountQuery,
    completedTechCountQuery,
    completedCountQuery,
    cancelledCountQuery,
  ]);

  if (operationsResult.error) throw new Error(operationsResult.error.message);
  if (totalResult.error) throw new Error(totalResult.error.message);
  if (pendingCountResult.error)
    throw new Error(pendingCountResult.error.message);
  if (scheduledCountResult.error) {
    throw new Error(scheduledCountResult.error.message);
  }
  if (completedTechCountResult.error) {
    throw new Error(completedTechCountResult.error.message);
  }
  if (completedCountResult.error) {
    throw new Error(completedCountResult.error.message);
  }
  if (cancelledCountResult.error) {
    throw new Error(cancelledCountResult.error.message);
  }

  const total = totalResult.count ?? operationsResult.count ?? 0;

  return {
    items: ((operationsResult.data ?? []) as OperationRow[]).map(
      mapOperationRow,
    ),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: total === 0 ? 1 : Math.ceil(total / input.pageSize),
    },
    summary: {
      totalOperations: total,
      pendingOperations: pendingCountResult.count ?? 0,
      scheduledOperations: scheduledCountResult.count ?? 0,
      completedTechOperations: completedTechCountResult.count ?? 0,
      completedOperations: completedCountResult.count ?? 0,
      cancelledOperations: cancelledCountResult.count ?? 0,
    },
  };
}

async function listTechnicianOperations(
  supabase: SupabaseClient,
  technicianId: string,
  input: ListCurrentOperationsInput,
): Promise<PaginatedOperations> {
  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;

  const operationsQuery = buildTechnicianOperationsQuery(
    supabase,
    input,
    technicianId,
    from,
    to,
  );
  const totalQuery = buildTechnicianOperationsCountQuery(
    supabase,
    input,
    technicianId,
  );
  const pendingCountQuery = buildTechnicianOperationsStatusCountQuery(
    supabase,
    input,
    technicianId,
    'pending',
  );
  const scheduledCountQuery = buildTechnicianOperationsStatusCountQuery(
    supabase,
    input,
    technicianId,
    'scheduled',
  );
  const completedTechCountQuery = buildTechnicianOperationsStatusCountQuery(
    supabase,
    input,
    technicianId,
    'completed_tech',
  );
  const completedCountQuery = buildTechnicianOperationsStatusCountQuery(
    supabase,
    input,
    technicianId,
    'completed',
  );
  const cancelledCountQuery = buildTechnicianOperationsStatusCountQuery(
    supabase,
    input,
    technicianId,
    'cancelled',
  );

  const [
    operationsResult,
    totalResult,
    pendingCountResult,
    scheduledCountResult,
    completedTechCountResult,
    completedCountResult,
    cancelledCountResult,
  ] = await Promise.all([
    operationsQuery,
    totalQuery,
    pendingCountQuery,
    scheduledCountQuery,
    completedTechCountQuery,
    completedCountQuery,
    cancelledCountQuery,
  ]);

  if (operationsResult.error) throw new Error(operationsResult.error.message);
  if (totalResult.error) throw new Error(totalResult.error.message);
  if (pendingCountResult.error)
    throw new Error(pendingCountResult.error.message);
  if (scheduledCountResult.error) {
    throw new Error(scheduledCountResult.error.message);
  }
  if (completedTechCountResult.error) {
    throw new Error(completedTechCountResult.error.message);
  }
  if (completedCountResult.error) {
    throw new Error(completedCountResult.error.message);
  }
  if (cancelledCountResult.error) {
    throw new Error(cancelledCountResult.error.message);
  }

  const total = totalResult.count ?? operationsResult.count ?? 0;

  return {
    items: ((operationsResult.data ?? []) as OperationRow[]).map(
      mapOperationRow,
    ),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: total === 0 ? 1 : Math.ceil(total / input.pageSize),
    },
    summary: {
      totalOperations: total,
      pendingOperations: pendingCountResult.count ?? 0,
      scheduledOperations: scheduledCountResult.count ?? 0,
      completedTechOperations: completedTechCountResult.count ?? 0,
      completedOperations: completedCountResult.count ?? 0,
      cancelledOperations: cancelledCountResult.count ?? 0,
    },
  };
}

function buildClientOperationsQuery(
  supabase: SupabaseClient,
  input: ListCurrentOperationsInput,
  clientId: string,
  from: number,
  to: number,
) {
  let query = supabase
    .from('operations')
    .select(CURRENT_OPERATION_SELECT, { count: 'exact' })
    .eq('order.client_id', clientId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (input.status) query = query.eq('status', input.status);

  return query;
}

function buildClientOperationsCountQuery(
  supabase: SupabaseClient,
  input: ListCurrentOperationsInput,
  clientId: string,
) {
  let query = supabase
    .from('operations')
    .select('id, order:orders!inner(client_id)', { count: 'exact', head: true })
    .eq('order.client_id', clientId);

  if (input.status) query = query.eq('status', input.status);

  return query;
}

function buildClientOperationsStatusCountQuery(
  supabase: SupabaseClient,
  _input: ListCurrentOperationsInput,
  clientId: string,
  status: OperationStatus,
) {
  const query = supabase
    .from('operations')
    .select('id, order:orders!inner(client_id)', { count: 'exact', head: true })
    .eq('order.client_id', clientId)
    .eq('status', status);

  return query;
}

function buildTechnicianOperationsQuery(
  supabase: SupabaseClient,
  input: ListCurrentOperationsInput,
  technicianId: string,
  from: number,
  to: number,
) {
  let query = supabase
    .from('operations')
    .select(OPERATION_SELECT, { count: 'exact' })
    .eq('technician_id', technicianId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (input.status) query = query.eq('status', input.status);

  return query;
}

function buildTechnicianOperationsCountQuery(
  supabase: SupabaseClient,
  input: ListCurrentOperationsInput,
  technicianId: string,
) {
  let query = supabase
    .from('operations')
    .select('id', { count: 'exact', head: true })
    .eq('technician_id', technicianId);

  if (input.status) query = query.eq('status', input.status);

  return query;
}

function buildTechnicianOperationsStatusCountQuery(
  supabase: SupabaseClient,
  _input: ListCurrentOperationsInput,
  technicianId: string,
  status: OperationStatus,
) {
  const query = supabase
    .from('operations')
    .select('id', { count: 'exact', head: true })
    .eq('technician_id', technicianId)
    .eq('status', status);

  return query;
}

function buildAdminOperationsQuery(
  supabase: SupabaseClient,
  input: ListAdminOperationsInput,
  from: number,
  to: number,
) {
  let query = supabase
    .from('operations')
    .select(ADMIN_OPERATION_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (input.status) query = query.eq('status', input.status);
  if (input.order_id) query = query.eq('order_id', input.order_id);
  if (input.technician_id)
    query = query.eq('technician_id', input.technician_id);

  return query;
}

function buildAdminOperationsCountQuery(
  supabase: SupabaseClient,
  input: ListAdminOperationsInput,
) {
  let query = supabase
    .from('operations')
    .select('id', { count: 'exact', head: true });

  if (input.status) query = query.eq('status', input.status);
  if (input.order_id) query = query.eq('order_id', input.order_id);
  if (input.technician_id)
    query = query.eq('technician_id', input.technician_id);

  return query;
}

function buildOperationsStatusCountQuery(
  supabase: SupabaseClient,
  input: ListAdminOperationsInput,
  status: OperationStatus,
) {
  let query = supabase
    .from('operations')
    .select('id', { count: 'exact', head: true })
    .eq('status', status);

  if (input.order_id) query = query.eq('order_id', input.order_id);
  if (input.technician_id)
    query = query.eq('technician_id', input.technician_id);

  return query;
}

function ensureClientRole(auth: RequestAuth) {
  if (auth.role !== 'client') throw new ForbiddenError('Client role required');
}

function ensureTechnicianRole(auth: RequestAuth) {
  if (auth.role !== 'technician') {
    throw new ForbiddenError('Technician role required');
  }
}
