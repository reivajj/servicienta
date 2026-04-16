import type {
  ListUsersInput,
  UpdateCurrentUserInput,
  UpdateUserInput,
  UserRole,
  UsersPageSize,
  UserStatus,
} from '@servicienta/types';
import { ValidationError } from '../core/errors.js';

const ALLOWED_PAGE_SIZES: UsersPageSize[] = [25, 50, 100];

export function validateUpdateCurrentUserInput(
  input: UpdateCurrentUserInput,
): UpdateCurrentUserInput {
  return validateUserInput(input);
}

export function validateUpdateUserInput(
  input: UpdateUserInput,
): UpdateUserInput {
  return validateUserInput(input);
}

function validateUserInput<
  T extends {
    name: string;
    surname: string;
    role: UserRole;
  },
>(input: T): T {
  const name = input.name.trim();
  const surname = input.surname.trim();

  if (!name) throw new ValidationError('Name is required');

  if (!surname) throw new ValidationError('Surname is required');

  if (!isUserRole(input.role)) throw new ValidationError('Invalid role');

  return {
    name,
    surname,
    role: input.role,
  } as T;
}

export function isUserRole(value: string): value is UserRole {
  return value === 'admin' || value === 'client' || value === 'technician';
}

export function isUserStatus(value: string): value is UserStatus {
  return value === 'ACTIVE' || value === 'DELETED';
}

export function validateListUsersInput(input: {
  page?: string;
  pageSize?: string;
  status?: string;
  role?: string;
  search?: string;
}): ListUsersInput {
  const page = input.page ? Number(input.page) : 1;
  const pageSize = input.pageSize ? Number(input.pageSize) : 25;
  const search = input.search?.trim() || undefined;

  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError('Invalid page');
  }

  if (!ALLOWED_PAGE_SIZES.includes(pageSize as UsersPageSize)) {
    throw new ValidationError('Invalid page size');
  }

  if (input.status && !isUserStatus(input.status)) {
    throw new ValidationError('Invalid status filter');
  }

  if (input.role && !isUserRole(input.role)) {
    throw new ValidationError('Invalid role filter');
  }

  const status =
    input.status && isUserStatus(input.status) ? input.status : undefined;
  const role = input.role && isUserRole(input.role) ? input.role : undefined;

  return {
    page,
    pageSize: pageSize as UsersPageSize,
    status,
    role,
    search,
  };
}
