import type { SeedLogger } from './types.js';

function formatDetails(details?: unknown) {
  if (details === undefined) {
    return '';
  }

  if (
    typeof details === 'object' &&
    details !== null &&
    Object.keys(details).length === 0
  ) {
    return '';
  }

  return ` ${JSON.stringify(details)}`;
}

export function createLogger(scope: string): SeedLogger {
  function write(
    level: 'INFO' | 'WARN' | 'ERROR',
    message: string,
    details?: unknown,
  ) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${scope}] [${level}] ${message}${formatDetails(details)}`;

    if (level === 'ERROR') {
      console.error(line);
      return;
    }

    console.log(line);
  }

  return {
    info: (message, details) => write('INFO', message, details),
    warn: (message, details) => write('WARN', message, details),
    error: (message, details) => write('ERROR', message, details),
  };
}
