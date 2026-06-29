export type ActivityEventEntityType =
  | 'user'
  | 'order'
  | 'operation'
  | 'technician_review';

export type ActivityEventType =
  | 'user.client_onboarded'
  | 'order.created'
  | 'order.accepted'
  | 'order.cancelled'
  | 'operation.created'
  | 'operation.scheduled'
  | 'operation.completed_by_technician'
  | 'operation.completed_by_client'
  | 'operation.cancelled'
  | 'technician_review.created'
  | 'admin.order_updated'
  | 'admin.operation_updated';

export interface ActivityEvent {
  id: string;
  actor_id: string;
  actor_email: string | null;
  entity_type: ActivityEventEntityType;
  entity_id: string;
  event_type: ActivityEventType;
  payload: Record<string, unknown> | null;
  created_at: string;
}
