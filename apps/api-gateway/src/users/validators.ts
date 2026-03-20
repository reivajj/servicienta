import type {
  UpdateMeInput,
  UserRole,
} from '@servicienta/types'
import { ValidationError } from '../core/errors.js'

export function validateUpdateMeInput(input: UpdateMeInput): UpdateMeInput {
  const name = input.name.trim()
  const surname = input.surname.trim()

  if (!name) throw new ValidationError('Name is required')

  if (!surname) throw new ValidationError('Surname is required')

  if (!isUserRole(input.role)) throw new ValidationError('Invalid role')

  return {
    name,
    surname,
    role: input.role,
  }
}

export function isUserRole(value: string): value is UserRole {
  return value === 'admin' || value === 'client' || value === 'technician'
}
