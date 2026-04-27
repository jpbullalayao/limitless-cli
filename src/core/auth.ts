import type { ConfigFile } from './config.js';

export type AuthSource = 'flag' | 'env' | 'config' | 'none';

export type ResolvedAuth = {
  token: string | undefined;
  source: AuthSource;
};

export function resolveAuth(
  apiKeyFromFlag: string | undefined,
  envValue: string | undefined,
  config: ConfigFile,
): ResolvedAuth {
  if (apiKeyFromFlag) {
    return { token: apiKeyFromFlag, source: 'flag' };
  }
  if (envValue) {
    return { token: envValue, source: 'env' };
  }
  if (config.token) {
    return { token: config.token, source: 'config' };
  }
  return { token: undefined, source: 'none' };
}

export function getEnvToken(): string | undefined {
  return process.env.LIMITLESS_API_TOKEN;
}
