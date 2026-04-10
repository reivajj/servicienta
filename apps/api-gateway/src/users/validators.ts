import type {
  UpdateCurrentUserInput,
  UpdateUserInput,
  UserRole,
  UserStatus,
} from '@servicienta/types'
import { ValidationError } from '../core/errors.js'

export function validateUpdateCurrentUserInput(
  input: UpdateCurrentUserInput,
): UpdateCurrentUserInput {
  return validateUserInput(input)
}

export function validateUpdateUserInput(
  input: UpdateUserInput,
): UpdateUserInput {
  return validateUserInput(input)
}

function validateUserInput<
  T extends {
    name: string
    surname: string
    role: UserRole
  },
>(input: T): T {
  const name = input.name.trim()
  const surname = input.surname.trim()

  if (!name) throw new ValidationError('Name is required')

  if (!surname) throw new ValidationError('Surname is required')

  if (!isUserRole(input.role)) throw new ValidationError('Invalid role')

  return {
    name,
    surname,
    role: input.role,
  } as T
}

export function isUserRole(value: string): value is UserRole {
  return value === 'admin' || value === 'client' || value === 'technician'
}

export function isUserStatus(value: string): value is UserStatus {
  return value === 'ACTIVE' || value === 'DELETED'
}
