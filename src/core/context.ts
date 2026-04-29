import { useColorEnabled } from '../util/tty.js';
import type { ResolvedAuth } from './auth.js';
import type { ConfigFile } from './config.js';
import type { ApiClient } from './http.js';
import { Logger } from './logger.js';

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

export type OutputFormat = 'json' | 'table' | 'raw';

export type GlobalRuntime = {
  apiKey?: string;
  output: OutputFormat;
  noColor?: boolean;
};

export type CliContext = {
  config: ConfigFile;
  auth: ResolvedAuth;
  global: GlobalRuntime;
  log: Logger;
  http: ApiClient;
};

export function createLogger(level: LogLevel, noColor?: boolean): Logger {
  const color = useColorEnabled(!!noColor);
  return new Logger(level, color);
}
