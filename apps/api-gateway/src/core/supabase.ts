import { createClient } from '@supabase/supabase-js'
import type { ApiGatewayEnv } from '../env.js'

export function createServiceSupabaseClient(env: ApiGatewayEnv) {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
