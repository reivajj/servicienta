#!/usr/bin/env node

import {
  parseCliArgs,
  readRequiredStringFlag,
  readStringFlag,
} from '../lib/cli.js';
import { readSeedEnv } from '../lib/env.js';
import { createLogger } from '../lib/logger.js';
import { createSeedSupabaseClient } from '../lib/supabase-admin.js';
import { getScenario } from '../scenarios/index.js';

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const scenarioName = readRequiredStringFlag(args, 'scenario');
  const scenario = getScenario(scenarioName);
  const env = readSeedEnv({
    tagOverride: readStringFlag(args, 'tag'),
    targetOverride: readStringFlag(args, 'target'),
  });
  const logger = createLogger('seed-scenario');
  const supabase = createSeedSupabaseClient(env);
  const results = await scenario.seed({ env, logger, supabase });

  logger.info('Scenario seed finished', {
    scenario: scenario.name,
    entities: results.map((result) => result.entity),
  });
}

main().catch((error) => {
  const logger = createLogger('seed-scenario');
  logger.error(error instanceof Error ? error.message : 'Unexpected error');
  process.exitCode = 1;
});
