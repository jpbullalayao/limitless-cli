import type { OutputFormat } from '../core/output.js';

export function getOutputFromEnv(): OutputFormat | 'auto' {
  const o = process.env.LIMITLESS_OUTPUT;
  if (o === 'json' || o === 'table' || o === 'raw') {
    return o;
  }
  return 'auto';
}

export function getLogLevel(
  env: string | undefined,
): 'silent' | 'error' | 'warn' | 'info' | 'debug' {
  if (env === 'debug' || env === 'info' || env === 'warn' || env === 'error' || env === 'silent') {
    return env;
  }
  return 'info';
}
