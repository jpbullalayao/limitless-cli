import type { ConfigFile } from './config.js';
import type { ResolvedAuth } from './auth.js';
import { ApiClient } from './http.js';
import { Logger } from './logger.js';
import { useColorEnabled } from '../util/tty.js';

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

export type OutputFormat = 'json' | 'table' | 'raw';

export type GlobalRuntime = {
  apiKey?: string;
  output: OutputFormat;
  quiet: boolean;
  verbose: boolean;
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
  const color = useColorEnabled(!!noColor, process.env.FORCE_COLOR);
  return new Logger(level, color);
}
