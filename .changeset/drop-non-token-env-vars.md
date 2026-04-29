---
"limitless-cli": major
---

Remove all environment variable support except `LIMITLESS_API_TOKEN`. `LIMITLESS_CONFIG_HOME`, `LIMITLESS_OUTPUT`, `LIMITLESS_LOG`, `LIMITLESS_NONINTERACTIVE`, plus the standard `CI` and `FORCE_COLOR` reads, are no longer honored. Use `--output`, `--no-color`, and `--api-key` flags (or `ltcg config --token`) instead.
