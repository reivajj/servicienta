import type {
  UpdateMeInput,
  User,
} from '@servicienta/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { UnauthorizedError } from '../core/errors.js'
import type { AuthenticatedUser } from './types.js'
import { mapUserRow } from './mapper.js'
import { validateUpdateMeInput } from './validators.js'

export async function authenticateUser(
  supabase: SupabaseClient,
  accessToken: string | null,
): Promise<AuthenticatedUser> {
  if (!accessToken) throw new UnauthorizedError('Missing bearer token')

  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error || !data.user?.email) throw new UnauthorizedError('Invalid access token')

  return {
    id: data.user.id,
    email: data.user.email,
  }
}

export async function getCurrentUser(
  supabase: SupabaseClient,
  authenticatedUser: AuthenticatedUser,
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, surname, role, created_at')
    .eq('id', authenticatedUser.id)
    .single()

  if (error) throw new Error(error.message)

  return mapUserRow(data)
}

export async function updateCurrentUser(
  supabase: SupabaseClient,
  authenticatedUser: AuthenticatedUser,
  input: UpdateMeInput,
): Promise<User> {
  const payload = validateUpdateMeInput(input)

  const { data, error } = await supabase
    .from('users')
    .update({
      email: authenticatedUser.email,
      name: payload.name,
      surname: payload.surname,
      role: payload.role,
    })
    .eq('id', authenticatedUser.id)
    .select('id, email, name, surname, role, created_at')
    .single()

  if (error) throw new Error(error.message)

  return mapUserRow(data)
}
