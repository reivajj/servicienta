import type {
  ActivityEvent,
  ActivityEventEntityType,
  ActivityEventType,
} from '@servicienta/types';
import type { ActivityEventRow } from './types.js';

export function mapActivityEventRow(row: ActivityEventRow): ActivityEvent {
  const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor;

  return {
    id: row.id,
    actor_id: row.actor_id,
    actor_email: actor?.email ?? null,
    entity_type: normalizeEntityType(row.entity_type),
    entity_id: row.entity_id,
    event_type: normalizeEventType(row.event_type),
    payload: row.payload,
    created_at: row.created_at,
  };
}

function normalizeEntityType(value: string): ActivityEventEntityType {
  if (
    value === 'user' ||
    value === 'order' ||
    value === 'operation' ||
    value === 'technician_review'
  ) {
    return value;
  }

  return 'user';
}

function normalizeEventType(value: string): ActivityEventType {
  if (
    value === 'user.client_onboarded' ||
    value === 'order.created' ||
    value === 'order.accepted' ||
    value === 'order.cancelled' ||
    value === 'operation.created' ||
    value === 'operation.scheduled' ||
    value === 'operation.completed_by_technician' ||
    value === 'operation.completed_by_client' ||
    value === 'operation.cancelled' ||
    value === 'technician_review.created' ||
    value === 'admin.order_updated' ||
    value === 'admin.operation_updated'
  ) {
    return value;
  }

  return 'user.client_onboarded';
}
