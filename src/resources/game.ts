import type { Command } from 'commander';
import type { CliContext } from '../core/context.js';
import { printData, resolveOutputFormat, tableFromRows } from '../core/output.js';
import { gameDecksSchema, gameListSchema } from '../core/schemas/game.js';
import { mustParse } from '../core/validate.js';

export function registerGame(
  program: Command,
  getCtx: () => Promise<CliContext>,
  getOutputFlag: () => string | undefined,
) {
  const g = program
    .command('game')
    .description('Games API: supported games and deck categorization rules');

  g.command('list')
    .description('List games (GET /games)')
    .addHelpText(
      'after',
      `
Example:
  $ ltcg game list
`,
    )
    .action(async () => {
      const ctx = await getCtx();
      const out = resolveOutputFormat(getOutputFlag());
      const data = await ctx.http.getJson(
        { path: '/games', auth: ctx.auth, requireAuth: false },
        (j) => mustParse(gameListSchema, j, 'games list'),
      );
      printData(
        out,
        data,
        (color) => {
          // TODO(per-game): refine when validating live API responses for PTCG/VGC/POCKET
          const rows = data.map((x) => {
            const fmtCount = x.formats ? Object.keys(x.formats).length : 0;
            const platCount = x.platforms ? Object.keys(x.platforms).length : 0;
            return [x.id, x.name, String(fmtCount), String(platCount), x.metagame ? 'yes' : 'no'];
          });
          return tableFromRows(['id', 'name', 'formats', 'platforms', 'metagame'], rows, color);
        },
        ctx.global.noColor,
      );
    });

  g.command('decks <id>')
    .description('Deck categorization rules (GET /games/{id}/decks; requires API key)')
    .addHelpText(
      'after',
      `
Example:
  $ ltcg config --token YOUR_KEY && ltcg game decks PTCG
`,
    )
    .action(async (id: string) => {
      const ctx = await getCtx();
      const out = resolveOutputFormat(getOutputFlag());
      const data = await ctx.http.getJson(
        {
          path: `/games/${encodeURIComponent(id)}/decks`,
          auth: ctx.auth,
          requireAuth: true,
        },
        (j) => mustParse(gameDecksSchema, j, 'game decks'),
      );
      printData(
        out,
        data,
        (color) => {
          const rows = data.map((d) => [
            d.identifier ?? '—',
            d.name ?? '—',
            String((d.variants?.length ?? 0) + (d.cards?.length ? 1 : 0)),
          ]);
          return tableFromRows(['id', 'name', 'rules~'], rows, color);
        },
        ctx.global.noColor,
      );
    });
}
