# suitener

Bun-native CLI for backend test discovery and execution with agent-readable JSON results.

## Install

```bash
bun install -g suitener
```

Or run directly:

```bash
bunx suitener
```

## Usage

```text
suitener [target] [--json] [--quiet] [--verbose]
suitener check [target]
suitener inspect [target]
suitener stubs [target]
suitener wrap "bun run dev"
```

## Commands

- `check` — introspect target and run existing tests (or generate stubs)
- `inspect` — introspect only
- `stubs` — force stub generation
- `wrap` — run a Suitener check before a dev command

## Examples

```bash
suitener
suitener check . --json
suitener inspect ./services/api
suitener stubs ./services/api
suitener wrap "bun run dev"
```

## Output

Suitener writes:

```text
suitener-results/
  run-YYYY-MM-DD-HHMMSS.json
  latest.json
```

`latest.json` is overwritten every run for stable polling by tools/agents.

## JSON result shape (trimmed)

```json
{
  "run_id": "2026-05-23-170238",
  "project_name": "suitener",
  "project_type": "cli",
  "mode": "existing",
  "summary": { "total": 2, "passed": 2, "failed": 0, "duration_ms": 163 },
  "tests": [{ "name": "packages/core/src/core.test.ts", "status": "pass", "duration_ms": 163 }]
}
```

## Related

- Library package: `suitener-core`

## License

MIT
