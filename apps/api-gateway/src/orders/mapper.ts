import type {
  AdminOrder,
  Order,
  OrderFlowType,
  OrderStatus,
} from '@servicienta/types';
import type { AdminOrderRow, OrderRow } from './types.js';

export function mapOrderRow(row: OrderRow): Order {
  const client = Array.isArray(row.client) ? row.client[0] : row.client;
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
    client_id: row.client_id,
    client_name: client?.name ?? null,
    client_surname: client?.surname ?? null,
    client_phone: clientProfile?.phone ?? null,
    client_whatsapp_phone: clientProfile?.whatsapp_phone ?? null,
    technician_id: row.technician_id,
    technician_public_slug: technician?.public_slug ?? null,
    technician_name: technicianUser?.name ?? null,
    technician_surname: technicianUser?.surname ?? null,
    technician_phone: technician?.phone ?? null,
    technician_whatsapp_phone: technician?.whatsapp_phone ?? null,
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
  const technician = Array.isArray(row.technician)
    ? row.technician[0]
    : row.technician;
  const technicianUser = technician
    ? Array.isArray(technician.user)
      ? technician.user[0]
      : technician.user
    : null;

  if (!client) return null;

  return {
    ...mapOrderRow(row),
    client_email: client.email,
    client_name: client.name,
    client_surname: client.surname,
    client_status: client.status === 'DELETED' ? 'DELETED' : 'ACTIVE',
    technician_email: technicianUser?.email ?? null,
    technician_status: technicianUser
      ? technicianUser.status === 'DELETED'
        ? 'DELETED'
        : 'ACTIVE'
      : null,
  };
}

function normalizeOrderStatus(value: string): OrderStatus {
  if (
    value === 'pending' ||
    value === 'accepted' ||
    value === 'cancelled' ||
    value === 'in_progress' ||
    value === 'completed_tech' ||
    value === 'completion_rejected' ||
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
