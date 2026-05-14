<p align="center">
  <img src="./assets/suitener-logo-readme.png" alt="Suitener" width="760" />
</p>

<p align="center">
  <strong>A Bun-native CLI for backend test discovery, execution, and agent-readable reports.</strong>
</p>

<p align="center">
  Run existing tests, generate minimal stubs when tests are missing, and write stable JSON output for agent workflows.
</p>

---

## Install

```bash
bun install -g suitener
```

Run without installing:

```bash
bunx suitener
```

## Usage

Run against the current directory:

```bash
suitener
```

Run against a specific backend:

```bash
suitener ./path/to/backend
```

Inspect a project without running tests:

```bash
suitener inspect ./path/to/backend
```

Force stub generation:

```bash
suitener stubs ./path/to/backend
```

Print machine-readable JSON:

```bash
suitener --json
```

Wrap a dev command with a passive test check:

```bash
suitener wrap "bun run dev"
```

## Commands

```text
suitener [target] [--json] [--quiet] [--verbose]
suitener check [target]
suitener inspect [target]
suitener stubs [target]
suitener wrap "bun run dev"
```

- `check`: introspect the target, then run existing tests or generate stubs
- `inspect`: detect project shape and test command without running tests
- `stubs`: generate minimal Bun test stubs
- `wrap`: run a test check before starting another command

## What Suitener detects

Suitener detects basic backend shape:

- CLI tools
- Libraries
- HTTP servers
- Unknown projects

It also detects tests from common conventions:

- `*.test.ts`
- `*.spec.ts`
- `__tests__/**`
- `tests/**`
- `*_test.go`
- `package.json` test scripts
- `go test ./...`
- `cargo test`

For JS and TS projects, Bun is preferred:

```bash
bun test
bun run test
```

## Output

Suitener writes results into the target project:

```text
suitener-results/
├── run-2026-05-11-143000.json
└── latest.json
```

`latest.json` is overwritten every run so tools and agents have one stable file to poll.

Example result:

```json
{
  "run_id": "2026-05-11-143000",
  "project_name": "backend",
  "target": "/path/to/project",
  "project_type": "http_server",
  "mode": "existing",
  "summary": {
    "total": 12,
    "passed": 10,
    "failed": 2,
    "duration_ms": 340
  },
  "tests": [
    {
      "name": "GET /health",
      "status": "pass",
      "duration_ms": 12
    }
  ]
}
```

## Generated stubs

When no test suite exists, Suitener writes minimal Bun test stubs to:

```text
suitener-stubs/
```

Stub philosophy:

- HTTP endpoint: does this respond at all?
- Library function: does this import or run without throwing?
- CLI command: does `--help` exit cleanly?

Suitener does not invent business assertions.

## Config

Config is optional. If present, Suitener loads `suitener.config.ts` through Bun.

```ts
import { defineConfig } from "suitener-core";

export default defineConfig({
  target: "./src",
  include: ["**/*.ts"],
  exclude: ["**/*.spec.ts"]
});
```

## License

MIT
