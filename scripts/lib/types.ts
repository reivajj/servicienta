import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole, UserStatus } from '@servicienta/types'

export type SeedTarget = 'local' | 'remote'

export interface SeedRuntimeEnv {
  supabaseUrl: string
  serviceRoleKey: string
  seedTag: string
  defaultPassword: string
  target: SeedTarget
}

export interface SeedLogger {
  info: (message: string, details?: unknown) => void
  warn: (message: string, details?: unknown) => void
  error: (message: string, details?: unknown) => void
}

export interface SeedContext {
  env: SeedRuntimeEnv
  supabase: SupabaseClient
  logger: SeedLogger
}

export interface SeederResult {
  entity: string
  created: number
  updated: number
  deleted: number
  skipped: number
}

export interface SeededUserSpec {
  email: string
  name: string
  surname: string
  role: UserRole
  status: UserStatus
  index: number
  scenario: string | null
}
