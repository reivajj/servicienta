export interface ParsedCliArgs {
  flags: Map<string, string | boolean>;
  positionals: string[];
}

export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const flags = new Map<string, string | boolean>();
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--') {
      continue;
    }

    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }

    const trimmed = token.slice(2);
    const [key, inlineValue] = trimmed.split('=', 2);

    if (!key) {
      throw new Error(`Invalid CLI option: ${token}`);
    }

    if (inlineValue !== undefined) {
      flags.set(key, inlineValue);
      continue;
    }

    const nextToken = argv[index + 1];

    if (!nextToken || nextToken.startsWith('--')) {
      flags.set(key, true);
      continue;
    }

    flags.set(key, nextToken);
    index += 1;
  }

  return { flags, positionals };
}

export function readStringFlag(
  args: ParsedCliArgs,
  key: string,
): string | undefined {
  const value = args.flags.get(key);

  if (typeof value === 'string') {
    return value;
  }

  return undefined;
}

export function readRequiredStringFlag(
  args: ParsedCliArgs,
  key: string,
): string {
  const value = readStringFlag(args, key);

  if (!value) {
    throw new Error(`Missing required flag --${key}`);
  }

  return value;
}

export function readNumberFlag(
  args: ParsedCliArgs,
  key: string,
): number | undefined {
  const value = readStringFlag(args, key);

  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Flag --${key} must be a non-negative integer`);
  }

  return parsed;
}
