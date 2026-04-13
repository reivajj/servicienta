#!/usr/bin/env node

import { resolveUserRoleCounts } from '../data/users.js'
import { parseCliArgs, readNumberFlag, readStringFlag } from '../lib/cli.js'
import { readSeedEnv } from '../lib/env.js'
import { createLogger } from '../lib/logger.js'
import { createSeedSupabaseClient } from '../lib/supabase-admin.js'
import { seedUsers } from '../seeds/users/seed-users.js'

async function main() {
  const args = parseCliArgs(process.argv.slice(2))
  const count = readNumberFlag(args, 'count')

  if (!count) {
    throw new Error('Missing required flag --count')
  }

  const env = readSeedEnv({
    tagOverride: readStringFlag(args, 'tag'),
    targetOverride: readStringFlag(args, 'target'),
  })
  const logger = createLogger('seed-users')
  const supabase = createSeedSupabaseClient(env)
  const resolvedRoleCounts = resolveUserRoleCounts(count, {
    admins: readNumberFlag(args, 'admins'),
    technicians: readNumberFlag(args, 'technicians'),
    clients: readNumberFlag(args, 'clients'),
  })

  const result = await seedUsers({
    context: { env, logger, supabase },
    count,
    resolvedRoleCounts,
    scenario: readStringFlag(args, 'scenario') ?? null,
  })

  logger.info('Seed finished', result)
}

main().catch((error) => {
  const logger = createLogger('seed-users')
  logger.error(error instanceof Error ? error.message : 'Unexpected error')
  process.exitCode = 1
})
