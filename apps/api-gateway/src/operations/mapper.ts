import type {
  AdminOperation,
  Operation,
  OperationStatus,
  OrderFlowType,
  OrderStatus,
} from '@servicienta/types';
import type { AdminOperationRow, OperationRow } from './types.js';

export function mapOperationRow(row: OperationRow): Operation {
  const order = Array.isArray(row.order) ? row.order[0] : row.order;
  const client = order
    ? Array.isArray(order.client)
      ? order.client[0]
      : order.client
    : null;
  const clientProfile = client
    ? Array.isArray(client.client_profile)
      ? client.client_profile[0]
      : client.client_profile
    : null;
  const technician = Array.isArray(row.technician)
    ? row.technician[0]
    : row.technician;
  const technicianUser = technician
    ? Array.isArray(technician.user)
      ? technician.user[0]
      : technician.user
    : null;

  return {
    id: row.id,
    order_id: row.order_id,
    client_id: order?.client_id ?? '',
    technician_id: row.technician_id,
    technician_public_slug: technician?.public_slug ?? null,
    status: normalizeOperationStatus(row.status),
    client_name: client?.name ?? null,
    client_surname: client?.surname ?? null,
    client_phone: clientProfile?.phone ?? null,
    client_whatsapp_phone: clientProfile?.whatsapp_phone ?? null,
    technician_name: technicianUser?.name ?? null,
    technician_surname: technicianUser?.surname ?? null,
    technician_phone: technician?.phone ?? null,
    technician_whatsapp_phone: technician?.whatsapp_phone ?? null,
    order_status: order ? normalizeOrderStatus(order.status) : null,
    order_flow_type: order ? normalizeOrderFlowType(order.flow_type) : null,
    service_address_text: order?.service_address_text ?? null,
    address_notes: order?.address_notes ?? null,
    zone_slug: order?.zone_slug ?? null,
    appliance_type_slug: order?.appliance_type_slug ?? null,
    scheduled_at: row.scheduled_at,
    description: row.description,
    completed_at: row.completed_at,
    technician_completed_at: row.technician_completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    technician_review: null,
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
    client_email: client.email,
    technician_email: technicianUser.email,
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
