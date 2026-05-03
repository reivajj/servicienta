#!/usr/bin/env node

import { parseCliArgs, readStringFlag } from '../lib/cli.js';
import { readSeedEnv } from '../lib/env.js';
import { createLogger } from '../lib/logger.js';
import { createSeedSupabaseClient } from '../lib/supabase-admin.js';
import { resetOperationalSeedData } from '../seeds/operational/reset-operational-data.js';

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const env = readSeedEnv({
    tagOverride: readStringFlag(args, 'tag'),
    targetOverride: readStringFlag(args, 'target'),
  });
  const logger = createLogger('seed-reset-operational');
  const supabase = createSeedSupabaseClient(env);
  const result = await resetOperationalSeedData({ env, logger, supabase });

  logger.info('Operational reset finished', result);
}

main().catch((error) => {
  const logger = createLogger('seed-reset-operational');
  logger.error(error instanceof Error ? error.message : 'Unexpected error');
  process.exitCode = 1;
});
