import type {
  AdminOrder,
  Order,
  OrderFlowType,
  OrderStatus,
} from '@servicienta/types';
import type { AdminOrderRow, OrderRow } from './types.js';

export function mapOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    client_id: row.client_id,
    technician_id: row.technician_id,
    status: normalizeOrderStatus(row.status),
    flow_type: normalizeOrderFlowType(row.flow_type),
    description: row.description,
    service_address_text: row.service_address_text,
    service_lat: row.service_lat,
    service_lng: row.service_lng,
    address_notes: row.address_notes,
    zone_slug: row.zone_slug,
    appliance_type_slug: row.appliance_type_slug,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapAdminOrderRow(row: AdminOrderRow): AdminOrder | null {
  const client = Array.isArray(row.client) ? row.client[0] : row.client;

  if (!client) return null;

  return {
    ...mapOrderRow(row),
    client_email: client.email,
    client_name: client.name,
    client_surname: client.surname,
    client_status: client.status === 'DELETED' ? 'DELETED' : 'ACTIVE',
  };
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
