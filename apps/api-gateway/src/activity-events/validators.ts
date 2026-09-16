import type {
  ActivityEventEntityType,
  ActivityEventType,
  ListActivityEventsInput,
  UsersPageSize,
} from '@servicienta/types';
import { ValidationError } from '../core/errors.js';

const ALLOWED_PAGE_SIZES: UsersPageSize[] = [25, 50, 100];

export function validateListActivityEventsInput(input: {
  page?: string;
  pageSize?: string;
  entityType?: string;
  entityId?: string;
  eventType?: string;
  createdFrom?: string;
  createdTo?: string;
}): ListActivityEventsInput {
  const page = input.page ? Number(input.page) : 1;
  const pageSize = input.pageSize ? Number(input.pageSize) : 25;
  const entityId = input.entityId?.trim() || undefined;
  const createdFrom = input.createdFrom?.trim() || undefined;
  const createdTo = input.createdTo?.trim() || undefined;

  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError('Invalid page');
  }

  if (!ALLOWED_PAGE_SIZES.includes(pageSize as UsersPageSize)) {
    throw new ValidationError('Invalid page size');
  }

  if (input.entityType && !isActivityEventEntityType(input.entityType)) {
    throw new ValidationError('Invalid entity type');
  }

  if (input.eventType && !isActivityEventType(input.eventType)) {
    throw new ValidationError('Invalid event type');
  }

  if (createdFrom && Number.isNaN(new Date(createdFrom).getTime())) {
    throw new ValidationError('Invalid created from date');
  }

  if (createdTo && Number.isNaN(new Date(createdTo).getTime())) {
    throw new ValidationError('Invalid created to date');
  }

  return {
    page,
    pageSize: pageSize as UsersPageSize,
    entity_type:
      input.entityType && isActivityEventEntityType(input.entityType)
        ? input.entityType
        : undefined,
    entity_id: entityId,
    event_type:
      input.eventType && isActivityEventType(input.eventType)
        ? input.eventType
        : undefined,
    created_from: createdFrom,
    created_to: createdTo,
  };
}

function isActivityEventEntityType(
  value: string,
): value is ActivityEventEntityType {
  return (
    value === 'user' ||
    value === 'order' ||
    value === 'operation' ||
    value === 'technician_review'
  );
}

function isActivityEventType(value: string): value is ActivityEventType {
  return (
    value === 'user.client_onboarded' ||
    value === 'order.created' ||
    value === 'order.accepted' ||
    value === 'order.cancelled' ||
    value === 'operation.created' ||
    value === 'operation.scheduled' ||
    value === 'operation.completed_by_technician' ||
    value === 'operation.completed_by_client' ||
    value === 'operation.completion_rejected_by_client' ||
    value === 'operation.cancelled' ||
    value === 'technician_review.created' ||
    value === 'admin.order_updated' ||
    value === 'admin.operation_updated'
  );
}
