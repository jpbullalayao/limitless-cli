import type { Command } from 'commander';
import { CliError } from '../core/errors.js';
import type { CliContext } from '../core/context.js';
import { printData, tableFromRows, resolveOutputFormat } from '../core/output.js';
import { z } from 'zod';
import {
  pairingsSchema,
  standingsSchema,
  tournamentDetailsSchema,
  tournamentListSchema,
} from '../core/schemas/tournament.js';
function mustParse<T>(schema: z.ZodType<T>, data: unknown, what: string): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw new CliError(`Response validation failed for ${what}: ${r.error.message}`, {
      code: 'validation-error',
    });
  }
  return r.data;
}

// TODO(per-game): refine when testing API calls for PTCG/VGC/POCKET; see NEXT_STEPS.md
function validateGameFilter(s: string | undefined): void {
  if (s && !/^[A-Z0-9_]{1,32}$/i.test(s)) {
    throw new CliError(
      `Invalid --game value: use letters, digits, or underscore (e.g. PTCG)`,
      { code: 'usage-error' },
    );
  }
}

// TODO(per-game): refine when testing API calls for PTCG/VGC/POCKET; see NEXT_STEPS.md
function validateFormatFilter(s: string | undefined): void {
  if (s && s.length > 64) {
    throw new CliError(`Invalid --format value: too long`, { code: 'usage-error' });
  }
}

export function registerTournament(
  program: Command,
  getCtx: () => Promise<CliContext>,
  getOutputFlag: () => string | undefined,
) {
  const t = program
    .command('tournament')
    .description('Tournament API: list events, details, standings, and pairings');

  t.command('list')
    .description('List tournaments (GET /tournaments)')
    .option('--game <code>', 'filter by game id (e.g. PTCG, VGC)', undefined)
    .option('--format <fmt>', 'filter by format id', undefined)
    .option('--organizerId <n>', 'filter by organizer id', undefined)
    .option('--limit <n>', 'max results (default 50 on API)', undefined)
    .option('--page <n>', 'page number (1-indexed)', undefined)
    .addHelpText(
      'after',
      `
Examples:
  $ limitless tournament list --game PTCG --limit 25
  $ limitless tournament list --organizerId 1 --page 2
`,
    )
    .action(
      async (cmdOpts: {
        game?: string;
        format?: string;
        organizerId?: string;
        limit?: string;
        page?: string;
      }) => {
        const ctx = await getCtx();
        const out = resolveOutputFormat(getOutputFlag(), process.env.LIMITLESS_OUTPUT);
        validateGameFilter(cmdOpts.game);
        validateFormatFilter(cmdOpts.format);
        const organizerId = cmdOpts.organizerId
          ? Number.parseInt(cmdOpts.organizerId, 10)
          : undefined;
        const limit = cmdOpts.limit ? Number.parseInt(cmdOpts.limit, 10) : undefined;
        const page = cmdOpts.page ? Number.parseInt(cmdOpts.page, 10) : undefined;
        if (cmdOpts.organizerId && Number.isNaN(organizerId!)) {
          throw new CliError('Invalid --organizerId', { code: 'usage-error' });
        }
        if (cmdOpts.limit && (Number.isNaN(limit!) || limit! < 1)) {
          throw new CliError('Invalid --limit', { code: 'usage-error' });
        }
        if (cmdOpts.page && (Number.isNaN(page!) || page! < 1)) {
          throw new CliError('Invalid --page', { code: 'usage-error' });
        }
        const query: Record<string, string | number | undefined> = {};
        if (cmdOpts.game) {
          query.game = cmdOpts.game;
        }
        if (cmdOpts.format) {
          query.format = cmdOpts.format;
        }
        if (organizerId !== undefined) {
          query.organizerId = organizerId;
        }
        if (limit !== undefined) {
          query.limit = limit;
        }
        if (page !== undefined) {
          query.page = page;
        }
        const data = await ctx.http.getJson(
          { path: '/tournaments', query, auth: ctx.auth, requireAuth: false },
          (j) => mustParse(tournamentListSchema, j, 'tournament list'),
        );
        printData(
          out,
          data,
          (color) => {
            const rows = data.map((x) => [
              x.id,
              x.game,
              x.name,
              x.date,
              x.players ?? '—',
            ]);
            return tableFromRows(
              ['id', 'game', 'name', 'date', 'players'],
              rows,
              color,
            );
          },
          ctx.global.noColor,
        );
      },
    );

  t.command('get <id>')
    .description('Tournament details (GET /tournaments/{id}/details)')
    .addHelpText(
      'after',
      `
Example:
  $ limitless tournament get 63fcb6d32fb42a11441fb777 --output json
`,
    )
    .action(async (id: string) => {
      const ctx = await getCtx();
      const out = resolveOutputFormat(getOutputFlag(), process.env.LIMITLESS_OUTPUT);
      const data = await ctx.http.getJson(
        { path: `/tournaments/${encodeURIComponent(id)}/details`, auth: ctx.auth, requireAuth: false },
        (j) => mustParse(tournamentDetailsSchema, j, 'tournament details'),
      );
      printData(
        out,
        data,
        (color) => {
          const ph = (data.phases ?? [])
            .map((p) => `${p.type} r${p.rounds} ${p.mode}`)
            .join('; ');
          const rows: (string | number)[][] = [
            ['id', data.id],
            ['game', data.game],
            ['name', data.name],
            ['date', data.date],
            ['players', data.players ?? '—'],
            ['organizer', data.organizer ? `${data.organizer.name} (#${data.organizer.id})` : '—'],
            ['phases', ph || '—'],
          ];
          return tableFromRows(
            ['field', 'value'],
            rows,
            color,
          );
        },
        ctx.global.noColor,
      );
    });

  t.command('standings <id>')
    .description('Tournament standings (GET /tournaments/{id}/standings)')
    .action(async (id: string) => {
      const ctx = await getCtx();
      const out = resolveOutputFormat(getOutputFlag(), process.env.LIMITLESS_OUTPUT);
      const data = await ctx.http.getJson(
        { path: `/tournaments/${encodeURIComponent(id)}/standings`, auth: ctx.auth, requireAuth: false },
        (j) => mustParse(standingsSchema, j, 'standings'),
      );
      printData(
        out,
        data,
        (color) => {
          const rows = data.map((s) => {
            const deckInfo =
              s.deck && typeof s.deck === 'object' && 'name' in s.deck
                ? String((s.deck as { name?: string }).name)
                : '—';
            return [s.placing ?? '—', s.player, s.name ?? '—', s.record ? `${s.record.wins}-${s.record.losses}` : '—', deckInfo];
          });
          return tableFromRows(
            ['#', 'player', 'name', 'record', 'deck'],
            rows,
            color,
          );
        },
        ctx.global.noColor,
      );
    });

  t.command('pairings <id>')
    .description('Tournament pairings (GET /tournaments/{id}/pairings)')
    .action(async (id: string) => {
      const ctx = await getCtx();
      const out = resolveOutputFormat(getOutputFlag(), process.env.LIMITLESS_OUTPUT);
      const data = await ctx.http.getJson(
        { path: `/tournaments/${encodeURIComponent(id)}/pairings`, auth: ctx.auth, requireAuth: false },
        (j) => mustParse(pairingsSchema, j, 'pairings'),
      );
      printData(
        out,
        data,
        (color) => {
          const rows = data.map((m) => [
            m.phase,
            m.round,
            m.table ?? m.match ?? '—',
            m.player1 ?? '—',
            m.player2 ?? '—',
            String(m.winner ?? '—'),
          ]);
          return tableFromRows(
            ['phase', 'round', 'table', 'p1', 'p2', 'winner'],
            rows,
            color,
          );
        },
        ctx.global.noColor,
      );
    });
}
