import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { SeedRuntimeEnv } from './types.js'

export function createSeedSupabaseClient(
  env: SeedRuntimeEnv,
): SupabaseClient {
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

export async function listAllAuthUsers(
  supabase: SupabaseClient,
): Promise<User[]> {
  const users: User[] = []
  const perPage = 1000
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw new Error(`Could not list auth users: ${error.message}`)
    }

    users.push(...data.users)

    if (data.users.length < perPage) {
      return users
    }

    page += 1
  }
}
