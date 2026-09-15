import { OPERATION_SCHEDULE_STEP_MINUTES } from '@servicienta/types';
import type {
  CreateOperationInput,
  CreateTechnicianReviewInput,
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

  if (!technicianId)
    throw new ValidationError('El ID del técnico es obligatorio');

  return {
    technician_id: technicianId,
    scheduled_at: normalizeNullableDateTime(input.scheduled_at),
  };
}

export function validateCreateTechnicianReviewInput(
  input: CreateTechnicianReviewInput,
): CreateTechnicianReviewInput {
  const rating = Number(input.rating);
  const comment = normalizeNullableText(input.comment);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ValidationError('La calificación debe estar entre 1 y 5');
  }

  return {
    rating,
    comment,
  };
}

export function validateUpdateAdminOperationInput(
  input: UpdateAdminOperationInput,
): UpdateAdminOperationInput {
  if (!isOperationStatus(input.status)) {
    throw new ValidationError('El estado de la visita no es válido');
  }

  const scheduledAt = normalizeNullableDateTime(input.scheduled_at);
  const completedAt = normalizeNullableDateTime(input.completed_at);
  const technicianCompletedAt = normalizeNullableDateTime(
    input.technician_completed_at,
  );

  validateDateOrder({
    earlierValue: scheduledAt,
    earlierField: 'scheduled_at',
    laterValue: technicianCompletedAt,
    laterField: 'technician_completed_at',
  });
  validateDateOrder({
    earlierValue: scheduledAt,
    earlierField: 'scheduled_at',
    laterValue: completedAt,
    laterField: 'completed_at',
  });
  validateDateOrder({
    earlierValue: technicianCompletedAt,
    earlierField: 'technician_completed_at',
    laterValue: completedAt,
    laterField: 'completed_at',
  });

  return {
    status: input.status,
    scheduled_at: scheduledAt,
    description: input.description?.trim() || null,
    completed_at: completedAt,
    technician_completed_at: technicianCompletedAt,
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

  if (!description) throw new ValidationError('La descripción es obligatoria');
  if (isPastDateTime(scheduledAt)) {
    throw new ValidationError('La fecha programada debe ser futura');
  }
  if (!isAlignedToStep(scheduledAt, OPERATION_SCHEDULE_STEP_MINUTES)) {
    throw new ValidationError(
      `La fecha programada debe usar intervalos de ${OPERATION_SCHEDULE_STEP_MINUTES} minutos`,
    );
  }

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
  clientId?: string;
}): ListAdminOperationsInput {
  const paginatedInput = validatePaginatedOperationsInput(input);

  return {
    ...paginatedInput,
    order_id: input.orderId ? validateOrderId(input.orderId) : undefined,
    technician_id: input.technicianId
      ? validateTechnicianId(input.technicianId)
      : undefined,
    client_id: input.clientId ? validateClientId(input.clientId) : undefined,
  };
}

export function validateOperationId(
  value: string | string[] | undefined,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('El ID de la visita no es válido');
  }

  return value.trim();
}

export function validateOrderId(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('El ID del pedido no es válido');
  }

  return value.trim();
}

export function validateTechnicianId(
  value: string | string[] | undefined,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('El ID del técnico no es válido');
  }

  return value.trim();
}

export function validateClientId(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('El ID del cliente no es válido');
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
    throw new ValidationError('La página no es válida');
  }

  if (!ALLOWED_PAGE_SIZES.includes(pageSize as UsersPageSize)) {
    throw new ValidationError('El tamaño de página no es válido');
  }

  if (input.status && !isOperationStatus(input.status)) {
    throw new ValidationError('El filtro de estado no es válido');
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
    throw new ValidationError('La fecha programada no es válida');
  }

  return trimmedValue;
}

function normalizeNullableText(value: string | null): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeRequiredDateTime(value: string, fieldName: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue || Number.isNaN(Date.parse(trimmedValue))) {
    throw new ValidationError(`La fecha de ${fieldName} no es válida`);
  }

  return trimmedValue;
}

function isPastDateTime(value: string) {
  return new Date(value).getTime() < Date.now();
}

function isAlignedToStep(value: string, stepMinutes: number) {
  const date = new Date(value);

  return (
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0 &&
    date.getUTCMinutes() % stepMinutes === 0
  );
}

function validateDateOrder({
  earlierValue,
  earlierField,
  laterValue,
  laterField,
}: {
  earlierValue: string | null;
  earlierField: string;
  laterValue: string | null;
  laterField: string;
}) {
  if (!earlierValue || !laterValue) return;
  if (new Date(earlierValue).getTime() <= new Date(laterValue).getTime())
    return;

  throw new ValidationError(
    `${earlierField} debe ser anterior o igual a ${laterField}`,
  );
}
