import type {
  CreateOperationInput,
  ListAdminOperationsInput,
  ListCurrentOperationsInput,
  OperationStatus,
  ScheduleOperationInput,
  UpdateAdminOperationInput,
  UsersPageSize,
} from '@servicienta/types';
import { ValidationError } from '../core/errors.js';

const ALLOWED_PAGE_SIZES: UsersPageSize[] = [25, 50, 100];

export function validateCreateOperationInput(
  input: CreateOperationInput,
): CreateOperationInput {
  const technicianId = input.technician_id.trim();

  if (!technicianId) throw new ValidationError('Technician id is required');

  return {
    technician_id: technicianId,
    scheduled_at: normalizeNullableDateTime(input.scheduled_at),
  };
}

export function validateUpdateAdminOperationInput(
  input: UpdateAdminOperationInput,
): UpdateAdminOperationInput {
  if (!isOperationStatus(input.status)) {
    throw new ValidationError('Invalid operation status');
  }

  return {
    status: input.status,
    scheduled_at: normalizeNullableDateTime(input.scheduled_at),
    description: input.description?.trim() || null,
    completed_at: normalizeNullableDateTime(input.completed_at),
    technician_completed_at: normalizeNullableDateTime(
      input.technician_completed_at,
    ),
  };
}

export function validateScheduleOperationInput(
  input: ScheduleOperationInput,
): ScheduleOperationInput {
  const description = input.description.trim();
  const scheduledAt = normalizeRequiredDateTime(
    input.scheduled_at,
    'scheduled_at',
  );

  if (!description) throw new ValidationError('Description is required');

  return {
    scheduled_at: scheduledAt,
    description,
  };
}

export function validateListCurrentOperationsInput(input: {
  page?: string;
  pageSize?: string;
  status?: string;
}): ListCurrentOperationsInput {
  return validatePaginatedOperationsInput(input);
}

export function validateListAdminOperationsInput(input: {
  page?: string;
  pageSize?: string;
  status?: string;
  orderId?: string;
  technicianId?: string;
}): ListAdminOperationsInput {
  const paginatedInput = validatePaginatedOperationsInput(input);

  return {
    ...paginatedInput,
    order_id: input.orderId ? validateOrderId(input.orderId) : undefined,
    technician_id: input.technicianId
      ? validateTechnicianId(input.technicianId)
      : undefined,
  };
}

export function validateOperationId(
  value: string | string[] | undefined,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Invalid operation id');
  }

  return value.trim();
}

export function validateOrderId(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Invalid order id');
  }

  return value.trim();
}

export function validateTechnicianId(
  value: string | string[] | undefined,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Invalid technician id');
  }

  return value.trim();
}

function validatePaginatedOperationsInput(input: {
  page?: string;
  pageSize?: string;
  status?: string;
}): {
  page: number;
  pageSize: UsersPageSize;
  status?: OperationStatus;
} {
  const page = input.page ? Number(input.page) : 1;
  const pageSize = input.pageSize ? Number(input.pageSize) : 25;

  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError('Invalid page');
  }

  if (!ALLOWED_PAGE_SIZES.includes(pageSize as UsersPageSize)) {
    throw new ValidationError('Invalid page size');
  }

  if (input.status && !isOperationStatus(input.status)) {
    throw new ValidationError('Invalid status filter');
  }

  return {
    page,
    pageSize: pageSize as UsersPageSize,
    status:
      input.status && isOperationStatus(input.status)
        ? input.status
        : undefined,
  };
}

function isOperationStatus(value: string): value is OperationStatus {
  return (
    value === 'pending' ||
    value === 'scheduled' ||
    value === 'completed_tech' ||
    value === 'completed' ||
    value === 'cancelled'
  );
}

function normalizeNullableDateTime(value: string | null): string | null {
  if (value === null) return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return null;
  if (Number.isNaN(Date.parse(trimmedValue))) {
    throw new ValidationError('Invalid scheduled_at datetime');
  }

  return trimmedValue;
}

function normalizeRequiredDateTime(value: string, fieldName: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue || Number.isNaN(Date.parse(trimmedValue))) {
    throw new ValidationError(`Invalid ${fieldName} datetime`);
  }

  return trimmedValue;
}
