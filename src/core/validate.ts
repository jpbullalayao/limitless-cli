import type { z } from 'zod';
import { CliError } from './errors.js';

export function mustParse<T>(schema: z.ZodType<T>, data: unknown, what: string): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw new CliError(`Response validation failed for ${what}: ${r.error.message}`, {
      code: 'validation-error',
    });
  }
  return r.data;
}
