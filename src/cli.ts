#!/usr/bin/env node
import { Command } from 'commander';
import { registerConfigCommand } from './commands/config.js';
import { getEnvToken, resolveAuth } from './core/auth.js';
import { loadConfig } from './core/config.js';
import type { CliContext, OutputFormat } from './core/context.js';
import { isCliError, writeCliError } from './core/errors.js';
import { ApiClient } from './core/http.js';
import { resolveOutputFormat } from './core/output.js';
import { registerGame } from './resources/game.js';
import { registerTournament } from './resources/tournament.js';
import { getVersion } from './util/version.js';

const program = new Command();

program.version(getVersion(), '-V, --version');

program
  .name('ltcg')
  .description(
    'Command-line interface for the Limitless TCG public API (tournaments, games, and more).\n\nDocs: https://docs.limitlesstcg.com/developer.html',
  )
  .option(
    '--api-key <key>',
    'API key for this request only (not saved; precedence over env and config)',
  )
  .option('-o, --output <fmt>', 'output: json | table | raw (default: json)')
  .option('--no-color', 'disable ANSI colors', false);

function getRootOpts() {
  return program.opts() as {
    apiKey?: string;
    output?: string;
    color?: boolean;
    noColor?: boolean;
  };
}

function getResolvedOutput(): OutputFormat {
  const o = getRootOpts();
  return resolveOutputFormat(o.output);
}

async function getCtx(): Promise<CliContext> {
  const opts = getRootOpts();
  const config = await loadConfig();
  const auth = resolveAuth(opts.apiKey, getEnvToken(), config);
  const output = getResolvedOutput();
  const http = new ApiClient();
  return {
    config,
    auth,
    global: {
      apiKey: opts.apiKey,
      output,
      noColor: opts.noColor,
    },
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

Auth order: --api-key > LIMITLESS_API_TOKEN > saved token from \`ltcg config\`.
Most endpoints work without a key. \`ltcg game decks <id>\` requires an approved API key.
`,
);

program
  .command('help [topic]')
  .description('Show help (alias: ltcg --help)')
  .action((topic?: string) => {
    if (topic) {
      process.stderr.write(`Use: ltcg ${topic} --help (or: ltcg --help ${topic})\n`);
    }
    program.help();
  });

program.action(() => {
  program.help();
});

function printError(e: unknown, asJson: boolean) {
  if (isCliError(e)) {
    writeCliError(e, asJson);
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
  const asJson = out === 'json';
  printError(e, asJson);
  if (process.exitCode == null || process.exitCode === undefined) {
    process.exitCode = 1;
  }
  process.exit(process.exitCode);
}
