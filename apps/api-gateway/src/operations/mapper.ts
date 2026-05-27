import type {
  AdminOperation,
  Operation,
  OperationStatus,
  OrderFlowType,
  OrderStatus,
} from '@servicienta/types';
import type { AdminOperationRow, OperationRow } from './types.js';

export function mapOperationRow(row: OperationRow): Operation {
  return {
    id: row.id,
    order_id: row.order_id,
    technician_id: row.technician_id,
    status: normalizeOperationStatus(row.status),
    scheduled_at: row.scheduled_at,
    description: row.description,
    completed_at: row.completed_at,
    technician_completed_at: row.technician_completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapAdminOperationRow(
  row: AdminOperationRow,
): AdminOperation | null {
  const order = Array.isArray(row.order) ? row.order[0] : row.order;
  const technician = Array.isArray(row.technician)
    ? row.technician[0]
    : row.technician;
  const client = order
    ? Array.isArray(order.client)
      ? order.client[0]
      : order.client
    : null;
  const technicianUser = technician
    ? Array.isArray(technician.user)
      ? technician.user[0]
      : technician.user
    : null;

  if (!order || !client || !technician || !technicianUser) return null;

  return {
    ...mapOperationRow(row),
    order_status: normalizeOrderStatus(order.status),
    order_flow_type: normalizeOrderFlowType(order.flow_type),
    service_address_text: order.service_address_text,
    client_id: order.client_id,
    client_email: client.email,
    client_name: client.name,
    client_surname: client.surname,
    technician_email: technicianUser.email,
    technician_name: technicianUser.name,
    technician_surname: technicianUser.surname,
    technician_public_slug: technician.public_slug,
    technician_review: null,
  };
}

function normalizeOperationStatus(value: string): OperationStatus {
  if (
    value === 'pending' ||
    value === 'scheduled' ||
    value === 'completed_tech' ||
    value === 'completed' ||
    value === 'cancelled'
  ) {
    return value;
  }

  return 'pending';
}

function normalizeOrderStatus(value: string): OrderStatus {
  if (
    value === 'pending' ||
    value === 'accepted' ||
    value === 'cancelled' ||
    value === 'in_progress' ||
    value === 'completed_tech' ||
    value === 'completed'
  ) {
    return value;
  }

  return 'pending';
}

function normalizeOrderFlowType(value: string): OrderFlowType {
  if (value === 'client_selects' || value === 'tech_applies') return value;

  return 'client_selects';
}
