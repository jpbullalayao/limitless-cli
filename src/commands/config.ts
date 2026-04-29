import * as clack from '@clack/prompts';
import type { Command } from 'commander';
import {
  getConfigPath,
  loadConfig,
  redactToken,
  saveConfig,
  unsetConfigFile,
} from '../core/config.js';
import type { OutputFormat } from '../core/context.js';
import { CliError, formatJsonError, isCliError } from '../core/errors.js';
import { isInteractive } from '../util/tty.js';

function jsonErrMode(output: OutputFormat): boolean {
  return output === 'json';
}

export function registerConfigCommand(program: Command, getOutput: () => OutputFormat) {
  const cmd = program
    .command('config')
    .description(
      'Save or inspect the optional API token for higher rate limits and /games/{id}/decks',
    )
    .option('--token <key>', 'set API token non-interactively')
    .option('--show', 'print config (token redacted)')
    .option('--unset', 'remove saved config file')
    .option('--path', 'print config file path')
    .action(async (opts: { token?: string; show?: boolean; unset?: boolean; path?: boolean }) => {
      const outMode = getOutput();
      const json = jsonErrMode(outMode);
      try {
        if (opts.path) {
          process.stdout.write(`${getConfigPath()}\n`);
          return;
        }
        if (opts.unset) {
          await unsetConfigFile();
          if (!json) {
            process.stderr.write('Config removed.\n');
          }
          return;
        }
        if (opts.show) {
          const c = await loadConfig();
          if (json) {
            process.stdout.write(
              `${JSON.stringify(
                { version: c.version, token: c.token ? redactToken(c.token) : null },
                null,
                2,
              )}\n`,
            );
            return;
          }
          process.stdout.write(`config: ${getConfigPath()}\n`);
          process.stdout.write(`token: ${c.token ? redactToken(c.token) : '(not set)'}\n`);
          return;
        }

        let token = opts.token;
        if (!token) {
          if (!isInteractive()) {
            throw new CliError('Non-interactive: pass --token <key> or set LIMITLESS_API_TOKEN', {
              code: 'usage-error',
            });
          }

          token = (await clack.text({
            message: 'Please specify your Limitless API token',
          })) as string;

          if (!token || token.trim() === '') {
            clack.outro('No token saved.');
            return;
          }
        }

        const current = await loadConfig();
        await saveConfig({ ...current, token: token.trim() });
        if (json) {
          process.stdout.write(
            `${JSON.stringify(
              { ok: true, path: getConfigPath(), token: redactToken(token.trim()) },
              null,
              2,
            )}\n`,
          );
        } else {
          clack.outro(`Saved to ${getConfigPath()}`);
        }
      } catch (e) {
        if (isCliError(e)) {
          if (json) {
            process.stderr.write(`${JSON.stringify(formatJsonError(e), null, 2)}\n`);
          } else {
            process.stderr.write(`Error: ${e.message}\n`);
            if (e.hint) {
              process.stderr.write(`  ${e.hint}\n`);
            }
            process.stderr.write(`  Code: ${e.code}\n`);
          }
          process.exitCode = e.exit;
        } else {
          throw e;
        }
      }
    });
  return cmd;
}
