#!/usr/bin/env node
import { Command } from 'commander';
import { getVersion } from './util/version.js';
import { loadConfig } from './core/config.js';
import { resolveAuth, getEnvToken } from './core/auth.js';
import { getLogLevel } from './util/env.js';
import { createLogger } from './core/context.js';
import { resolveOutputFormat } from './core/output.js';
import { ApiClient } from './core/http.js';
import { formatJsonError, isCliError } from './core/errors.js';
import { registerConfigCommand } from './commands/config.js';
import { registerTournament } from './resources/tournament.js';
import { registerGame } from './resources/game.js';
import type { CliContext, LogLevel, OutputFormat } from './core/context.js';

const program = new Command();

program.version(getVersion(), '-V, --version');

program
  .name('limitless')
  .description(
    'Command-line interface for the Limitless TCG public API (tournaments, games, and more).\n\nDocs: https://docs.limitlesstcg.com/developer.html',
  )
  .option('--api-key <key>', 'API key for this request only (not saved; precedence over env and config)')
  .option('-o, --output <fmt>', 'output: json | table | raw (default: json)')
  .option('--quiet', 'only print errors', false)
  .option('--verbose', 'verbose logging (e.g. rate limit headers)', false)
  .option('--no-color', 'disable ANSI colors', false);

function getRootOpts() {
  return program.opts() as {
    apiKey?: string;
    output?: string;
    quiet?: boolean;
    verbose?: boolean;
    color?: boolean;
    noColor?: boolean;
  };
}

function getResolvedOutput(): OutputFormat {
  const o = getRootOpts();
  return resolveOutputFormat(o.output, process.env.LIMITLESS_OUTPUT);
}

async function getCtx(): Promise<CliContext> {
  const opts = getRootOpts();
  const config = await loadConfig();
  const auth = resolveAuth(opts.apiKey, getEnvToken(), config);
  const logLevel: LogLevel = getLogLevel(process.env.LIMITLESS_LOG, !!opts.verbose, !!opts.quiet);
  const log = createLogger(logLevel, opts.noColor);
  log.setColorFromFlags({ noColor: opts.noColor });
  const output = getResolvedOutput();
  const http = new ApiClient(log, !!opts.verbose);
  return {
    config,
    auth,
    global: {
      apiKey: opts.apiKey,
      output,
      quiet: !!opts.quiet,
      verbose: !!opts.verbose,
      noColor: opts.noColor,
    },
    log,
    http,
  };
}

registerConfigCommand(program, getResolvedOutput);
registerTournament(program, getCtx, () => getRootOpts().output);
registerGame(program, getCtx, () => getRootOpts().output);

program.addHelpText(
  'after',
  `
Environment:
  LIMITLESS_API_TOKEN   Optional. Used when --api-key is not set. Precedence: --api-key > env > saved config.
  LIMITLESS_CONFIG_HOME Directory for config file (default: per-OS app config).
  LIMITLESS_OUTPUT      json | table | raw (overrides TTY default when not using -o)
  LIMITLESS_LOG         debug | info | warn | error | silent
  LIMITLESS_NONINTERACTIVE=1  Disable prompts; use flags for config.

Auth order: --api-key > LIMITLESS_API_TOKEN > saved token from \`limitless config\`.
Most endpoints work without a key. \`limitless game decks <id>\` requires an approved API key.
`,
);

program
  .command('help [topic]')
  .description('Show help (alias: limitless --help)')
  .action((topic?: string) => {
    if (topic) {
      process.stderr.write('Use: limitless ' + topic + ' --help (or: limitless --help ' + topic + ')\n');
    }
    program.help();
  });

program
  .action(() => {
    program.help();
  });

function printError(e: unknown, asJson: boolean) {
  if (isCliError(e)) {
    if (asJson) {
      process.stderr.write(`${JSON.stringify(formatJsonError(e), null, 2)}\n`);
    } else {
      process.stderr.write(`Error: ${e.message}\n`);
      if (e.hint) {
        process.stderr.write(`  ${e.hint}\n`);
      }
      process.stderr.write(`  Code: ${e.code}\n`);
      if (e.docsUrl) {
        process.stderr.write(`  Docs: ${e.docsUrl}\n`);
      }
    }
    process.exitCode = e.exit;
    return;
  }
  if (e instanceof Error) {
    process.stderr.write(`Error: ${e.message}\n`);
  } else {
    process.stderr.write('Error: unknown error\n');
  }
  process.exitCode = 1;
}

try {
  await program.parseAsync(process.argv, { from: 'node' });
} catch (e) {
  const out = getResolvedOutput();
  const asJson = out === 'json' || process.env.LIMITLESS_OUTPUT === 'json';
  printError(e, asJson);
  if (process.exitCode == null || process.exitCode === undefined) {
    process.exitCode = 1;
  }
  process.exit(process.exitCode);
}
