import type { RequestedUserRoleCounts, ResolvedUserRoleCounts } from '../../data/users.js'
import type { SeedContext, SeederResult } from '../../lib/types.js'

export interface SeedUsersInput {
  count: number
  roleCounts: RequestedUserRoleCounts
  scenario?: string | null
}

export interface SeedUsersExecutionInput {
  context: SeedContext
  count: number
  resolvedRoleCounts: ResolvedUserRoleCounts
  scenario: string | null
}

export interface UsersSeedResult extends SeederResult {
  byRole: ResolvedUserRoleCounts
}
