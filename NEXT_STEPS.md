# Next steps (post-MVP)

This file is the backlog for work **not** included in the initial MVP. Update it as you validate real API responses per game.

## Per-game refinement TODOs

Search the codebase for `TODO(per-game)` (or run `rg "TODO\\(per-game\\)" src/`). Current hits:

| Location | Field / area | Current handling | What to verify |
|----------|----------------|------------------|----------------|
| [src/resources/tournament.ts](src/resources/tournament.ts) ~L22 | `--game` filter validation | Regex `^[A-Z0-9_]{1,32}$` (case-insensitive) | Confirm allowed game ids with `/games` for PTCG, VGC, POCKET, etc. |
| [src/resources/tournament.ts](src/resources/tournament.ts) ~L32 | `--format` filter validation | Max length 64 | Confirm format string rules from API errors / docs |
| [src/core/schemas/tournament.ts](src/core/schemas/tournament.ts) ~L42–44 | `bannedCards`, `specialRules` on details | `z.array(z.unknown())`, `z.array(z.string())` | Pin real payloads per game under `docs/samples/<game>/details.json` |
| [src/core/schemas/tournament.ts](src/core/schemas/tournament.ts) ~L69–71 | `decklist`, `deck` on standings | `z.unknown()`, loose object | Game-specific shapes (PTCG vs VGC vs POCKET); tighten zod or split by `game` |
| [src/core/schemas/game.ts](src/core/schemas/game.ts) ~L7–9 | `formats`, `platforms` on game list | `z.record(z.string())` | Confirm empty vs missing; large maps in table view |
| [src/resources/game.ts](src/resources/game.ts) (table branch) | Game list table columns | Counts of format/platform keys only | Consider per-game columns or `raw`/`json` as default for wide data |

## Production hardening backlog

- **Shell completion** — `limitless completion bash|zsh|fish` (Commander built-in + dynamic action lists).
- **Telemetry** — off by default; opt-in via `LIMITLESS_TELEMETRY=1`; document privacy.
- **OS keychain** — optional `keytar` (lazy `import`) for token storage instead of plain file.
- **`--all` pagination** — for `tournament list`, iterate `page` until empty with a sane cap.
- **`--watch` / polling** — live tournament updates with backoff; webhooks later ([webhooks docs](https://docs.limitlesstcg.com/developer/webhooks)).
- **`update-notifier`** — notify on newer npm version (Vercel-style).
- **`limitless doctor`** — Node version, config file permissions, network, token smoke test.
- **Typo suggestions** — Levenshtein on unknown subcommands/actions (Cobra-style).
- **i18n** — centralize strings; English-only at first.
- **`limitless listen`** — local webhook forwarder (Stripe CLI–style) if needed.
- **OpenAPI / codegen** — if Limitless publishes an OpenAPI spec, generate clients and resource commands.
- **`esbuild` bundle** — optional single-file `bin` for faster cold start (keep `tsc` as default).
- **Signed releases** — npm provenance (see release workflow) + GitHub Releases attestations.
- **Testing** — unit (auth, config, schemas), integration (mocked HTTP), e2e (spawned CLI), CI matrix (deliberately deferred for MVP).

## Open API questions

Track validation against live responses:

1. **Decklist field shape varies by game.** Official docs: `decklist` in standings is "(game specific)". Current: `z.unknown()`; table shows summary via `deck` when possible. **Check off** when samples exist for each game.
2. **`bannedCards` / `specialRules` shapes are game-specific.** Current: loose arrays. **Check off** after sampling tournament details per game.
3. **Error body schema** not fully documented. Current: status + first 200 chars of body. **Check off** when non-2xx JSON shape is documented or captured.
4. **Anonymous rate-limit ceiling** not specified. Current: 429 retries with backoff. **Check off** under load testing.
5. **`game list` formats/platforms maps are open-ended.** Current: `z.record(z.string())`; table shows counts. **Check off** after UX review.
6. **`--game` validation.** Current: no hard-coded enum; regex + API rejection. **Check off** if `/games` discovery is added for autocomplete.

## Validation log

When you call the API for each game, save **redacted** samples here and under `docs/samples/<game>/`:

| Date | Game | Endpoint | Notes |
|------|------|----------|-------|
| _add rows_ | | | |

Suggested filenames: `docs/samples/PTCG/tournaments-list.json`, `docs/samples/PTCG/standings.json`, etc.

## Release / changesets

- Use [Changesets](https://github.com/changesets/changesets): `pnpm changeset` → merge “Version Packages” PR → tag → publish.
- Post-publish smoke: `npx -y limitless@<version> --version` and `npx -y limitless@<version> game list`.
