import type { ResolvedAuth } from './auth.js';
import type { ConfigFile } from './config.js';
import type { ApiClient } from './http.js';

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
  http: ApiClient;
};
