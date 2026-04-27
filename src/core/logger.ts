import p from 'picocolors';
import { useColorEnabled } from '../util/tty.js';
import type { LogLevel } from './context.js';

const levels: LogLevel[] = ['silent', 'error', 'warn', 'info', 'debug'];
const order = (l: LogLevel) => levels.indexOf(l);

export class Logger {
  constructor(
    private level: LogLevel,
    private color: boolean,
  ) {}

  setLevel(level: LogLevel) {
    this.level = level;
  }

  setColorFromFlags(opts: { noColor?: boolean }) {
    this.color = useColorEnabled(!!opts.noColor, process.env.FORCE_COLOR);
  }

  private shouldLog(level: LogLevel): boolean {
    return order(level) <= order(this.level) && this.level !== 'silent';
  }

  error(msg: string) {
    if (!this.shouldLog('error')) {
      return;
    }
    const out = this.color ? p.red(msg) : msg;
    process.stderr.write(`${out}\n`);
  }

  warn(msg: string) {
    if (!this.shouldLog('warn')) {
      return;
    }
    const out = this.color ? p.yellow(msg) : msg;
    process.stderr.write(`${out}\n`);
  }

  info(msg: string) {
    if (!this.shouldLog('info')) {
      return;
    }
    const out = this.color ? p.dim(msg) : msg;
    process.stderr.write(`${out}\n`);
  }

  debug(msg: string) {
    if (!this.shouldLog('debug')) {
      return;
    }
    const out = this.color ? p.cyan(msg) : msg;
    process.stderr.write(`${out}\n`);
  }
}
