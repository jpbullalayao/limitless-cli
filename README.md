# limitless

Command-line interface for the [Limitless TCG](https://play.limitlesstcg.com) public API: tournaments, games, and related data.

- **API documentation:** <https://docs.limitlesstcg.com/developer.html>
- **Install:** `npm i -g limitless` or `pnpm add -g limitless` or `yarn global add limitless`
- **Run without install:** `npx limitless --help`

## Quick start

```bash
# Version
limitless --version

# List supported games (no API key required)
limitless game list

# List recent tournaments
limitless tournament list --limit 10

# Filter tournaments
limitless tournament list --game PTCG --format STANDARD --page 1

# Tournament details, standings, pairings
limitless tournament get <tournament-id>
limitless tournament standings <tournament-id>
limitless tournament pairings <tournament-id>

# Deck categorization rules (requires an approved API key)
export LIMITLESS_API_TOKEN=...   # or: limitless config --token ...
limitless game decks PTCG --output json
```

## Config (optional)

Most endpoints work **without** an API key. A key is required for `GET /games/{id}/decks` and may increase rate limits.

```bash
# Interactive: save API token
limitless config

# Non-interactive
limitless config --token YOUR_KEY
limitless config --show    # redacted
limitless config --path     # show config file path
limitless config --unset
```

**Auth precedence (highest first):** `--api-key` → `LIMITLESS_API_TOKEN` → saved config from `limitless config`.  
The flag does **not** write to disk.

## Global options

| Option | Description |
|--------|-------------|
| `--api-key <key>` | API key for this run only (not saved) |
| `-o, --output <fmt>` | `json` \| `table` \| `raw` (default: `json`) |
| `--no-color` | Disable ANSI colors |
| `-V, --version` | Print CLI version |
| `-h, --help` | Help (also `limitless help` and `limitless <cmd> --help`) |

## Environment

| Variable | Purpose |
|----------|---------|
| `LIMITLESS_API_TOKEN` | Default API key when `--api-key` is not set |
| `LIMITLESS_CONFIG_HOME` | Override directory for the config file |
| `LIMITLESS_OUTPUT` | `json` \| `table` \| `raw` (overrides default when not using `-o`) |
| `LIMITLESS_LOG` | `debug` \| `info` \| `warn` \| `error` \| `silent` |
| `LIMITLESS_NONINTERACTIVE` | Set to `1` to skip prompts; use `limitless config --token` in CI |
| `CI` | Treated as non-interactive; default output is `json` when using `auto` |

## Troubleshooting

- **`Error: API key is required` on `game decks`:** Request a key on [API settings](https://play.limitlesstcg.com/account/settings/api), then `limitless config --token` or set `LIMITLESS_API_TOKEN` / `limitless game decks PTCG --api-key ...`.
- **Empty or unexpected JSON shape:** The API is game-specific for some fields; see [NEXT_STEPS.md](NEXT_STEPS.md) and `src/core/schemas/`.
- **Rate limits:** The CLI retries `429` responses with backoff. Consider an API key for higher limits.

## License

MIT
