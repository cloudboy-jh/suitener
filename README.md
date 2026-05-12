<p align="center">
  <img src="./suitener-logo-readme.png" alt="Suitener" width="760" />
</p>

<p align="center">
  <strong>A Bun-native test suite tool for agentic backend development.</strong>
</p>

<p align="center">
  Introspect a backend, run its existing tests, or generate minimal test stubs agents can build from.
</p>

---

## What is Suitener?

Suitener is a TypeScript CLI and core library built on Bun. It inspects a backend codebase, detects what kind of project it is, finds existing tests, runs them, and writes structured JSON results for agents or tooling to consume.

If no test suite exists, Suitener generates deliberately minimal stubs into `./suitener-stubs/` instead of pretending it knows your business logic.

It also includes a `wrap` mode for dev scripts, so you can prepend passive test-health context before starting a server.

```bash
suitener wrap "bun run dev"
```

## Install

```bash
bun install -g suitener
```

Library usage:

```bash
bun add @suitener/core
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

Emit JSON only:

```bash
suitener --json
```

Wrap a dev command:

```bash
suitener wrap "bun run dev"
```

## What it detects

Suitener detects basic backend shape:

- CLI tools
- Libraries
- HTTP servers
- Unknown projects

It also detects existing test suites from common conventions:

- `*.test.ts`
- `*.spec.ts`
- `__tests__/**`
- `tests/**`
- `*_test.go`
- `package.json` test scripts
- `go test ./...`
- `cargo test`

For JS/TS projects, Bun is preferred:

```bash
bun test
bun run test
```

## Output

Suitener writes results into:

```text
suitener-results/
├── run-2026-05-11-143000.json
└── latest.json
```

`latest.json` is overwritten every run for stable agent polling.

Example result:

```json
{
  "run_id": "2026-05-11-143000",
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
    },
    {
      "name": "POST /enrich",
      "status": "fail",
      "duration_ms": 80,
      "error": "..."
    }
  ]
}
```

## Generated stubs

When no tests exist, Suitener writes minimal Bun test stubs to:

```text
suitener-stubs/
```

Stub philosophy:

- HTTP endpoint: does this respond at all?
- Library function: does this import or run without throwing?
- CLI command: does `--help` exit cleanly?

Suitener does not guess real assertions. That gets noisy fast and makes agents ignore the output.

## Config

Config is optional. If present, Suitener loads `suitener.config.ts` natively through Bun.

```ts
import { defineConfig } from "@suitener/core";

export default defineConfig({
  target: "./src",
  include: ["**/*.ts"],
  exclude: ["**/*.spec.ts"]
});
```

Defaults are enough for the v1 happy path.

## Core API

```ts
import { introspect, runTests, generateStubs, wrap } from "@suitener/core";

const project = await introspect("./");
const results = await runTests(project);

const handle = await wrap("bun run dev", {
  onTestComplete(result) {
    console.log(result.summary);
  }
});
```

Exported API:

- `defineConfig`
- `loadConfig`
- `introspect`
- `runTests`
- `generateStubs`
- `writeResults`
- `wrap`

## CLI behavior

Normal output uses a minimal pink, blue, and green ANSI colorway.

```text
suitener http_server /path/to/backend
existing 12 tests, 10 passing, 2 failed
failed in 340ms → suitener-results/latest.json
```

`--json` disables decoration and prints only machine-readable JSON.

## Wrap mode

```bash
suitener wrap "bun run dev"
```

Wrap mode starts a passive test run and launches the wrapped command with normal stdio. Results are still written to `./suitener-results/latest.json`.

Signals propagate to the child process, so Ctrl-C behaves like it should.

## Development

Install dependencies:

```bash
bun install
```

Run tests:

```bash
bun test
```

Typecheck:

```bash
bun run typecheck
```

Build packages:

```bash
bun run build
```

Run the CLI locally:

```bash
bun run packages/cli/src/index.ts --json
```

Build the standalone binary:

```bash
bun build packages/cli/src/index.ts --compile --outfile dist/suitener
```

## Package layout

```text
suitener/
├── packages/
│   ├── core/   # @suitener/core
│   └── cli/    # suitener binary
├── Spec.md
└── suitener-logo.png
```

## Scope

In scope for v0.1:

- Bun-native TypeScript CLI
- Single compiled binary via `bun build --compile`
- Core library at `@suitener/core`
- Backend type detection
- Existing test suite detection
- Existing test execution
- Generated test stubs
- Structured JSON output
- Dev-command wrapping

Out of scope:

- Auto-fixes
- Suggested fixes
- Agent orchestration
- Plugin system
- Web dashboard
- CI/CD integrations
- Secrets or env management

## License

MIT
