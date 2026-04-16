import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SeedRuntimeEnv, SeedTarget } from './types.js';
import { normalizeSeedTag } from './seed-tag.js';

interface ReadSeedEnvOptions {
  tagOverride?: string;
  targetOverride?: string;
}

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseDotEnvFile(path: string) {
  const content = readFileSync(path, 'utf8');
  const entries = new Map<string, string>();

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const equalsIndex = line.indexOf('=');

    if (equalsIndex <= 0) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = stripWrappingQuotes(line.slice(equalsIndex + 1).trim());

    if (!key) {
      continue;
    }

    entries.set(key, value);
  }

  return entries;
}

function loadScriptsEnvFiles() {
  const rootDir = process.cwd();
  const envPaths = [
    resolve(rootDir, 'scripts', '.env'),
    resolve(rootDir, 'scripts', '.env.local'),
  ];

  for (const envPath of envPaths) {
    if (!existsSync(envPath)) {
      continue;
    }

    const parsed = parseDotEnvFile(envPath);

    for (const [key, value] of parsed) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function readRequiredEnv(key: string) {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required env var ${key}`);
  }

  return value;
}

function readSeedTarget(value: string | undefined): SeedTarget {
  if (!value) {
    return 'local';
  }

  if (value === 'local' || value === 'remote') {
    return value;
  }

  throw new Error('SEED_TARGET must be either "local" or "remote"');
}

export function readSeedEnv(options: ReadSeedEnvOptions = {}): SeedRuntimeEnv {
  loadScriptsEnvFiles();

  const seedTag = normalizeSeedTag(
    options.tagOverride ?? process.env.SEED_TAG ?? 'local-seed',
  );
  const target = readSeedTarget(
    options.targetOverride ?? process.env.SEED_TARGET,
  );

  return {
    supabaseUrl: readRequiredEnv('SUPABASE_URL'),
    serviceRoleKey: readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    seedTag,
    defaultPassword:
      process.env.SEED_DEFAULT_PASSWORD?.trim() || 'servicienta123',
    target,
  };
}
