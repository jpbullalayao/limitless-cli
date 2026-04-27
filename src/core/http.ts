import { getVersion } from '../util/version.js';
import type { ResolvedAuth } from './auth.js';
import { CliError } from './errors.js';

export const API_BASE = 'https://play.limitlesstcg.com/api';

const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function jitterMs(base: number) {
  return base + Math.floor(Math.random() * 200);
}

export type RequestOptions = {
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  auth: ResolvedAuth;
  requireAuth: boolean;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const u = new URL(base + p);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) {
        continue;
      }
      u.searchParams.set(k, String(v));
    }
  }
  return u.toString();
}

function userAgent(): string {
  return `limitless-cli/${getVersion()} node/${process.version}`;
}

export class ApiClient {
  private headers(auth: ResolvedAuth, requireAuth: boolean): HeadersInit {
    const h: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': userAgent(),
    };
    if (requireAuth) {
      if (!auth.token) {
        throw new CliError(
          'API key is required. Set LIMITLESS_API_TOKEN, use `limitless config`, or pass --api-key.',
          {
            code: 'auth-missing-token',
            hint: 'The /games/{id}/decks endpoint requires an approved API key.',
            docsUrl: 'https://docs.limitlesstcg.com/developer.html',
          },
        );
      }
      h['X-Access-Key'] = auth.token;
    } else if (auth.token) {
      h['X-Access-Key'] = auth.token;
    }
    return h;
  }

  async getJson<T>(opts: RequestOptions, parse: (j: unknown) => T): Promise<T> {
    const url = buildUrl(opts.path, opts.query);
    const signal = opts.signal ?? AbortSignal.timeout(30_000);
    const headers = this.headers(opts.auth, opts.requireAuth);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      let res: Response;
      try {
        res = await fetch(url, { method: 'GET', headers, signal });
      } catch (e) {
        const name = (e as NodeJS.ErrnoException)?.name;
        const isAbort = name === 'AbortError';
        if (isAbort) {
          throw new CliError('Request timed out', { code: 'network-error', cause: e });
        }
        if (attempt >= MAX_RETRIES) {
          throw new CliError(e instanceof Error ? e.message : 'Network error', {
            code: 'network-error',
            cause: e,
          });
        }
        await sleep(jitterMs(200 * 2 ** attempt));
        continue;
      }

      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        if (attempt >= MAX_RETRIES) {
          const body = await this.safeReadText(res);
          throw new CliError(
            `API request failed: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`,
            { code: 'api-error' },
          );
        }
        const ra = res.headers.get('retry-after');
        const waitSec = ra ? Number.parseInt(ra, 10) : Number.NaN;
        const delay =
          Number.isFinite(waitSec) && waitSec > 0 ? waitSec * 1000 : jitterMs(200 * 2 ** attempt);
        await sleep(delay);
        continue;
      }

      if (res.status === 401 || res.status === 403) {
        const body = await this.safeReadText(res);
        throw new CliError(
          `API authentication failed: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`,
          { code: 'auth-invalid', hint: 'Check your API key.' },
        );
      }

      if (!res.ok) {
        const body = await this.safeReadText(res);
        throw new CliError(
          `API error: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`,
          { code: 'api-error' },
        );
      }

      const text = await res.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        throw new CliError('Invalid JSON in API response', { code: 'validation-error', cause: e });
      }
      return parse(data);
    }
    throw new CliError('Request failed after retries', { code: 'network-error' });
  }

  private async safeReadText(res: Response): Promise<string> {
    try {
      return await res.text();
    } catch {
      return '';
    }
  }
}
