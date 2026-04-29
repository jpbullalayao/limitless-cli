---
name: limitless-cli
description: >-
  Limitless TCG CLI reference for tournaments, games, standings,
  pairings, deck categorization rules, and optional API token configuration
  against the Limitless TCG public API (`play.limitlesstcg.com`). Use when the
  user mentions Limitless TCG, `ltcg`, `limitless-cli`, tournament lookups,
  pairings or standings, PTCG/VGC/POCKET events, deck rules from the API, or
  querying Limitless from the command line or CI.
---

# Limitless TCG CLI (`ltcg`)

Command-line interface for the [Limitless TCG](https://play.limitlesstcg.com) public API: tournaments, games, standings, pairings, and related data.

**API documentation:** [docs.limitlesstcg.com/developer.html](https://docs.limitlesstcg.com/developer.html)

**Package:** `limitless-cli` on npm · **Binary:** `ltcg` · **Current version:** 0.1.0 (see `ltcg --version` after install)

---

## Prerequisites

### Installation

```bash
# Global install (pick one)
npm i -g limitless-cli
pnpm add -g limitless-cli
yarn global add limitless-cli

# Run without global install
npx -p limitless-cli ltcg --help
```

### Runtime

- **Node.js** >= 18.17 (see package `engines`).

### Verify

```bash
ltcg --version
ltcg --help
```

---

## Authentication

Most endpoints work **without** an API key. A key is **required** for `GET /games/{id}/decks` (`ltcg game decks <id>`) and may improve rate limits for other calls.

### Where credentials come from (precedence, highest first)

1. **`--api-key <key>`** — applies to this run only; **not** written to disk.
2. **`LIMITLESS_API_TOKEN`** — environment variable.
3. **Saved config** — token from `ltcg config` (stored in the app config file).

### Obtain an API key

Request or manage keys under **Account → API**:  
[play.limitlesstcg.com/account/settings/api](https://play.limitlesstcg.com/account/settings/api)

### Non-interactive agents / CI

- Prefer **`LIMITLESS_API_TOKEN`** or **`ltcg … --api-key …`**.
- Interactive `ltcg config` without `--token` requires a TTY; use **`ltcg config --token YOUR_KEY`** in automation.

---

## CLI structure

```
ltcg                              # Root (default action shows help)
├── config                        # Save / inspect optional API token
├── tournament                    # List events; details; standings; pairings
│   ├── list
│   ├── get <id>
│   ├── standings <id>
│   └── pairings <id>
├── game                          # Supported games; deck categorization rules
│   ├── list
│   └── decks <id>
└── help [topic]                  # Alias → delegates to full help
```

---

## Global options

| Option | Description |
|--------|-------------|
| `--api-key <key>` | API key for this run only (not saved); overrides env and saved config |
| `-o, --output <fmt>` | `json` \| `table` \| `raw` (invalid values fall back to **`json`**) |
| `--no-color` | Disable ANSI colors in table output |
| `-V, --version` | Print CLI version |
| `-h, --help` | Help (also `ltcg help` and `ltcg <cmd> --help`) |

Default output format is **`json`** when `-o`/`--output` is omitted.

---

## Environment

| Variable | Purpose |
|----------|---------|
| `LIMITLESS_API_TOKEN` | Default API key when `--api-key` is not set |

**Note:** Older releases honored extra `LIMITLESS_*` variables (e.g. output defaults, config path overrides). Those are **removed**; use `--output`, `--no-color`, `--api-key`, and `ltcg config` instead.

---

## Configuration (`ltcg config`)

Saves an optional token for higher rate limits and for **`game decks`**.

```bash
# Interactive (TTY): prompts for token
ltcg config

# Non-interactive: set token
ltcg config --token YOUR_KEY

# Show config path and redacted token (text or JSON via global -o)
ltcg config --show
ltcg config --show -o json

# Print config file path only
ltcg config --path

# Remove saved config file
ltcg config --unset
```

Config is stored under the OS application config directory via `env-paths` with app id **`limitless-cli`** (typically `config.json` under that namespace).

---

## Tournaments (`ltcg tournament`)

Base path: **`GET /tournaments`** and related routes (see official API docs).

### List — `ltcg tournament list`

Lists tournaments (`GET /tournaments`).

| Option | Description |
|--------|-------------|
| `--game <code>` | Filter by game id (e.g. `PTCG`, `VGC`) |
| `--format <fmt>` | Filter by format id |
| `--organizerId <n>` | Filter by organizer id |
| `--limit <n>` | Max results (API default often 50 if omitted) |
| `--page <n>` | Page number (1-indexed) |

`--game` must match `^[A-Z0-9_]{1,32}$` (case-insensitive). `--format` max length 64.

```bash
ltcg tournament list --limit 10
ltcg tournament list --game PTCG --format STANDARD --page 1
ltcg tournament list --organizerId 1 --page 2 -o table
```

### Get details — `ltcg tournament get <id>`

`GET /tournaments/{id}/details`

```bash
ltcg tournament get 63fcb6d32fb42a11441fb777
ltcg tournament get 63fcb6d32fb42a11441fb777 -o table
```

Table mode summarizes: id, game, name, date, players, organizer, phases.

### Standings — `ltcg tournament standings <id>`

`GET /tournaments/{id}/standings`

Table columns: **`#`**, **player**, **name**, **record**, **deck** (summary when available).

```bash
ltcg tournament standings 63fcb6d32fb42a11441fb777 -o json
```

### Pairings — `ltcg tournament pairings <id>`

`GET /tournaments/{id}/pairings`

Table columns: **phase**, **round**, **table**, **p1**, **p2**, **winner** (`table` may show match identifier when table number absent).

```bash
ltcg tournament pairings 63fcb6d32fb42a11441fb777 -o table
```

---

## Games (`ltcg game`)

### List — `ltcg game list`

`GET /games` — **no API key required.**

Table columns: **id**, **name**, counts of **formats** / **platforms** keys, **metagame** (yes/no).

```bash
ltcg game list
ltcg game list -o json | jq '.[].id'
```

### Deck categorization rules — `ltcg game decks <id>`

`GET /games/{id}/decks` — **requires an approved API key.**

```bash
export LIMITLESS_API_TOKEN=...
ltcg game decks PTCG -o json

# Or one-shot
ltcg game decks PTCG --api-key YOUR_KEY -o json
```

---

## Output formatting

### `json` (default)

Pretty-printed JSON to stdout. Best for scripting and `jq`.

### `table`

Human-readable tables (cli-table3). Use **`--no-color`** when piping or capturing logs without ANSI codes.

### `raw`

If the underlying data is a string, prints it as-is; otherwise JSON-stringifies. Useful when the pipeline expects a single-line JSON blob.

### Examples

```bash
ltcg tournament list --game PTCG --limit 5 -o json | jq '.[].id'
ltcg game list -o table --no-color
```

---

## HTTP client behavior

- **Base URL:** `https://play.limitlesstcg.com/api`
- **Auth header:** `X-Access-Key` when a token is present; required for `game decks`.
- **Retries:** Up to **3** retries on **429** and **5xx**, with backoff and optional `Retry-After` handling.
- **Timeout:** Request abort after **30s** unless overridden in code.

---

## Errors and exit codes

### Text mode (`-o table` or default text paths)

`CliError` prints `Error: …`, optional hint, and **`Code:`** with the error kind.

### JSON mode (`-o json`)

Structured errors on stderr:

```json
{
  "error": {
    "code": "auth-missing-token",
    "message": "...",
    "hint": "...",
    "exit": 3,
    "docs": "https://docs.limitlesstcg.com/developer.html"
  }
}
```

(`hint` and `docs` appear when set.)

### Exit code mapping (representative)

| Code kind | Typical exit |
|-----------|----------------|
| `generic-error` | 1 |
| `usage-error` | 2 |
| `auth-missing-token`, `auth-invalid` | 3 |
| `validation-error` | 4 |
| `api-error` | 5 |
| `network-error` | 6 |
| `config-io-error` | 7 |

---

## Common workflows

### Discover games → find tournaments → inspect event

```bash
ltcg game list
ltcg tournament list --game PTCG --limit 25
ltcg tournament get <id>
ltcg tournament standings <id>
ltcg tournament pairings <id>
```

### Persist token once, then query deck rules

```bash
ltcg config --token YOUR_KEY
ltcg game decks PTCG -o json | jq '.'
```

### CI secret without writing config

```bash
ltcg game decks PTCG --api-key "$LIMITLESS_API_TOKEN" -o json
```

### Pagination

Use **`--limit`** and **`--page`** on `tournament list`. There is **no** `--all` flag yet (iterate pages in your script if needed); see project `NEXT_STEPS.md`.

---

## Troubleshooting

| Symptom | What to do |
|---------|------------|
| **`API key is required`** on `game decks` | Set `LIMITLESS_API_TOKEN`, run `ltcg config --token …`, or pass `--api-key`. |
| **401 / 403** | Invalid or revoked key; verify at API settings. |
| **Empty or unexpected JSON** on standings (`decklist`, etc.) | Shapes are **game-specific** per API; see `NEXT_STEPS.md` and `src/core/schemas/` in the CLI repo. |
| **Rate limits** | CLI retries 429; consider an approved API key for higher limits. |

---

## References

- Limitless developer docs: [docs.limitlesstcg.com/developer.html](https://docs.limitlesstcg.com/developer.html)
- npm package: [npmjs.com/package/limitless-cli](https://www.npmjs.com/package/limitless-cli)
- Limitless play site: [play.limitlesstcg.com](https://play.limitlesstcg.com)
