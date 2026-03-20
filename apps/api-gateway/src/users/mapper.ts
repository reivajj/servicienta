import type { User } from '@servicienta/types'
import type { UserRow } from './types.js'
import { isUserRole } from './validators.js'

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    surname: row.surname,
    role: isUserRole(row.role) ? row.role : 'client',
    created_at: row.created_at,
  }
}
