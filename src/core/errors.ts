export type ErrorCode =
  | 'generic-error'
  | 'usage-error'
  | 'auth-missing-token'
  | 'auth-invalid'
  | 'validation-error'
  | 'api-error'
  | 'network-error'
  | 'config-io-error';

export const exitCodeByKind: Record<
  ErrorCode,
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 130
> = {
  'generic-error': 1,
  'usage-error': 2,
  'auth-missing-token': 3,
  'auth-invalid': 3,
  'validation-error': 4,
  'api-error': 5,
  'network-error': 6,
  'config-io-error': 7,
};

export class CliError extends Error {
  readonly code: ErrorCode;
  readonly exit: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 130;
  readonly hint?: string;
  readonly docsUrl?: string;
  readonly cause?: unknown;

  constructor(
    message: string,
    options: {
      code: ErrorCode;
      hint?: string;
      docsUrl?: string;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = 'CliError';
    this.code = options.code;
    this.hint = options.hint;
    this.docsUrl = options.docsUrl;
    this.cause = options.cause;
    this.exit = exitCodeByKind[options.code] as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 130;
  }
}

export function isCliError(e: unknown): e is CliError {
  return e instanceof CliError;
}

export function formatJsonError(
  e: CliError,
): { error: { code: string; message: string; hint?: string; exit: number; docs?: string } } {
  return {
    error: {
      code: e.code,
      message: e.message,
      ...(e.hint ? { hint: e.hint } : {}),
      exit: e.exit,
      ...(e.docsUrl ? { docs: e.docsUrl } : {}),
    },
  };
}
