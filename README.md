# limitless-cli (ltcg)

Command-line interface for the [Limitless TCG](https://play.limitlesstcg.com) public API: tournaments, games, and related data.

- **API documentation:** <https://docs.limitlesstcg.com/developer.html>
- **Install** (npm package `limitless-cli`; binary on your PATH is `ltcg`):
  - `npm i -g limitless-cli` or `pnpm add -g limitless-cli` or `yarn global add limitless-cli`
- **Run without install:** `npx -p limitless-cli ltcg --help`

## Quick start

```bash
# Version
ltcg --version

# List supported games (no API key required)
ltcg game list

# List recent tournaments
ltcg tournament list --limit 10

# Filter tournaments
ltcg tournament list --game PTCG --format STANDARD --page 1

# Tournament details, standings, pairings
ltcg tournament get <tournament-id>
ltcg tournament standings <tournament-id>
ltcg tournament pairings <tournament-id>

# Deck categorization rules (requires an approved API key)
export LIMITLESS_API_TOKEN=...   # or: ltcg config --token ...
ltcg game decks PTCG --output json
```

## Config (optional)

Most endpoints work **without** an API key. A key is required for `GET /games/{id}/decks` and may increase rate limits.

```bash
# Interactive: save API token
ltcg config

# Non-interactive
ltcg config --token YOUR_KEY
ltcg config --show    # redacted
ltcg config --path     # show config file path
ltcg config --unset
```

**Auth precedence (highest first):** `--api-key` → `LIMITLESS_API_TOKEN` → saved config from `ltcg config`.  
The flag does **not** write to disk.

## Global options

| Option | Description |
|--------|-------------|
| `--api-key <key>` | API key for this run only (not saved) |
| `-o, --output <fmt>` | `json` \| `table` \| `raw` (default: `json`) |
| `--no-color` | Disable ANSI colors |
| `-V, --version` | Print CLI version |
| `-h, --help` | Help (also `ltcg help` and `ltcg <cmd> --help`) |

## Environment

| Variable | Purpose |
|----------|---------|
| `LIMITLESS_API_TOKEN` | Default API key when `--api-key` is not set |
| `LIMITLESS_CONFIG_HOME` | Override directory for the config file |
| `LIMITLESS_OUTPUT` | `json` \| `table` \| `raw` (used when `-o` is not set) |
| `LIMITLESS_LOG` | `debug` \| `info` \| `warn` \| `error` \| `silent` |
| `LIMITLESS_NONINTERACTIVE` | Set to `1` or `true` to skip prompts; use `ltcg config --token` in CI |
| `CI` | Treated as non-interactive (skips prompts) |

## Troubleshooting

- **`Error: API key is required` on `game decks`:** Request a key on [API settings](https://play.limitlesstcg.com/account/settings/api), then `ltcg config --token` or set `LIMITLESS_API_TOKEN` / `ltcg game decks PTCG --api-key ...`.
- **Empty or unexpected JSON shape:** The API is game-specific for some fields; see [NEXT_STEPS.md](NEXT_STEPS.md) and `src/core/schemas/`.
- **Rate limits:** The CLI retries `429` responses with backoff. Consider an API key for higher limits.

## License

MIT
