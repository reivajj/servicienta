import type {
  CreateChatMessageInput,
  ListChatMessagesInput,
  ListCurrentChatConversationsInput,
  ScheduleOperationFromChatInput,
  UsersPageSize,
} from '@servicienta/types';
import { ValidationError } from '../core/errors.js';
import {
  validateOperationId,
  validateScheduleOperationInput,
} from '../operations/validators.js';

const ALLOWED_PAGE_SIZES: UsersPageSize[] = [25, 50, 100];

export function validateListCurrentChatConversationsInput(input: {
  page?: string;
  pageSize?: string;
}): ListCurrentChatConversationsInput {
  return validatePagination(input);
}

export function validateListChatMessagesInput(input: {
  page?: string;
  pageSize?: string;
}): ListChatMessagesInput {
  return validatePagination(input);
}

export function validateCreateChatMessageInput(
  input: CreateChatMessageInput,
): CreateChatMessageInput {
  const body = input.body?.trim();

  if (!body) throw new ValidationError('El mensaje es obligatorio');
  if (body.length > 2000) {
    throw new ValidationError('El mensaje no puede superar los 2000 caracteres');
  }

  return { body };
}

export function validateScheduleOperationFromChatInput(
  input: ScheduleOperationFromChatInput,
): ScheduleOperationFromChatInput {
  return {
    operation_id: validateOperationId(input.operation_id),
    ...validateScheduleOperationInput(input),
  };
}

export function validateConversationId(value: string | string[] | undefined) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('El ID de la conversación no es válido');
  }

  return value.trim();
}

export function validateOrderId(value: string | string[] | undefined) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('El ID del pedido no es válido');
  }

  return value.trim();
}

function validatePagination(input: {
  page?: string;
  pageSize?: string;
}): ListCurrentChatConversationsInput {
  const page = Number(input.page ?? '1');
  const pageSize = Number(input.pageSize ?? '25') as UsersPageSize;

  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError('La página debe ser un número entero positivo');
  }

  if (!ALLOWED_PAGE_SIZES.includes(pageSize)) {
    throw new ValidationError('El tamaño de página no es válido');
  }

  return { page, pageSize };
}
