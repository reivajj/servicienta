import {
  getBrowserSupabaseClient,
  readSupabaseBrowserEnv,
} from '@servicienta/supabase'

export function getSupabaseBrowserClient() {
  return getBrowserSupabaseClient(readSupabaseBrowserEnv(import.meta.env))
}
