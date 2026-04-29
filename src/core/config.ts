import { constants } from 'node:fs';
import { access, chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import envPaths from 'env-paths';
import { CliError } from './errors.js';

const SCHEMA_VERSION = 1;

export type ConfigFile = {
  version: number;
  token?: string;
};

function getConfigFilePath(): string {
  const paths = envPaths('limitless-cli', { suffix: 'config' });
  return join(paths.config, 'config.json');
}

export function getConfigPath(): string {
  return getConfigFilePath();
}

function parseConfig(raw: string): ConfigFile {
  try {
    const j = JSON.parse(raw) as ConfigFile;
    if (j.version !== SCHEMA_VERSION) {
      return { version: SCHEMA_VERSION, token: j.token };
    }
    return j;
  } catch {
    return { version: SCHEMA_VERSION };
  }
}

export async function loadConfig(): Promise<ConfigFile> {
  const path = getConfigFilePath();
  try {
    const raw = await readFile(path, 'utf8');
    return parseConfig(raw);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err?.code === 'ENOENT') {
      return { version: SCHEMA_VERSION };
    }
    throw new CliError(`Cannot read config at ${path}`, {
      code: 'config-io-error',
      cause: e,
    });
  }
}

export async function saveConfig(config: ConfigFile): Promise<void> {
  const path = getConfigFilePath();
  try {
    await mkdir(dirname(path), { recursive: true });
    const body: ConfigFile = {
      version: SCHEMA_VERSION,
      ...(config.token !== undefined ? { token: config.token } : {}),
    };
    const data = JSON.stringify(body, null, 2);
    await writeFile(path, data, { mode: 0o600, encoding: 'utf8' });
    await chmod(path, 0o600);
  } catch (e) {
    throw new CliError(`Cannot write config at ${path}`, {
      code: 'config-io-error',
      cause: e,
    });
  }
}

export async function unsetConfigFile(): Promise<void> {
  const path = getConfigFilePath();
  try {
    await access(path, constants.F_OK);
  } catch {
    return;
  }
  const { unlink } = await import('node:fs/promises');
  try {
    await unlink(path);
  } catch (e) {
    throw new CliError(`Cannot remove config at ${path}`, {
      code: 'config-io-error',
      cause: e,
    });
  }
}

export function redactToken(token: string | undefined): string {
  if (!token) {
    return '(not set)';
  }
  if (token.length <= 8) {
    return '****';
  }
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}
