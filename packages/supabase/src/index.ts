import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.js'

export type { Session, User } from '@supabase/supabase-js'
export type { Database } from './database.js'

export interface BrowserSupabaseEnv {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
}

export interface BrowserSupabaseConfig {
  url: string
  anonKey: string
  options?: Parameters<typeof createClient<Database>>[2]
}

export type BrowserSupabaseClient = SupabaseClient<Database>

let browserClient: BrowserSupabaseClient | undefined

export function readSupabaseBrowserEnv(
  env: BrowserSupabaseEnv,
): BrowserSupabaseConfig {
  const url = env.VITE_SUPABASE_URL?.trim()
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
    )
  }

  return { url, anonKey }
}

export function createBrowserSupabaseClient(
  config: BrowserSupabaseConfig,
): BrowserSupabaseClient {
  return createClient<Database>(config.url, config.anonKey, {
    ...config.options,
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      ...config.options?.auth,
    },
  })
}

export function getBrowserSupabaseClient(
  config: BrowserSupabaseConfig,
): BrowserSupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient(config)
  }

  return browserClient
}
