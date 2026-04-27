import Table from 'cli-table3';
import p from 'picocolors';
import { useColorEnabled } from '../util/tty.js';
import type { OutputFormat } from './context.js';

export type { OutputFormat };

export function resolveOutputFormat(
  flag: string | undefined,
  envOverride: string | undefined,
): OutputFormat {
  if (flag === 'json' || flag === 'table' || flag === 'raw') {
    return flag;
  }
  const e = envOverride;
  if (e === 'json' || e === 'table' || e === 'raw') {
    return e;
  }
  return 'json';
}

export function printData(
  format: OutputFormat,
  data: unknown,
  renderTable: (color: boolean) => string,
  noColor?: boolean,
): void {
  const color = useColorEnabled(!!noColor, process.env.FORCE_COLOR);
  if (format === 'json') {
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
    return;
  }
  if (format === 'raw') {
    process.stdout.write(`${typeof data === 'string' ? data : JSON.stringify(data)}\n`);
    return;
  }
  process.stdout.write(`${renderTable(color)}\n`);
}

export function tableFromRows(
  headers: string[],
  rows: (string | number)[][],
  color: boolean,
): string {
  const t = new Table({
    head: headers.map((h) => (color ? p.bold(h) : h)),
  });
  for (const row of rows) {
    t.push(row);
  }
  return t.toString();
}
