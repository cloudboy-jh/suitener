# Suitener

> A Bun-native test suite tool for agentic backend development.

## What

Suitener is a TypeScript CLI built on Bun that introspects a backend codebase and either runs its existing test suite or generates sensible test stubs from the folder structure and interface shape. It can also wrap dev scripts to surface a passive test-health summary on every start. Built for speed, structured output, and easy agent ingestion.

Ships as a single compiled binary via `bun build --compile`, plus a library at `@cloudboyredex/suitener-core` for programmatic use.

The name: test **suite** + sw**eetener** — makes testing less bitter.

## Why

Existing test frameworks (Jest, Vitest, Jenkins, pytest, etc.) were built around human-paced, deterministic development. They don't fit the actual shape of work today:

- Agentic coding generates and iterates code at volumes existing frameworks weren't designed for.
- Backend interfaces shift fast — schema-first, interface-agnostic testing matters more than rigid assertion frameworks.
- Agents need fast feedback loops with structured, parseable output, not pretty terminal reports.

Same move as gittrix: don't accept the constraints of pre-agentic tooling, rebuild the primitive for how development actually works now.

Active use case: validate gittrix and glib-code's backend processes without coupling test logic to the server code, and without slowing down active feature development.

## Why Bun (and why not Rust or Go)

Suitener is a thin orchestration layer over filesystem walking, command execution, and JSON output. It has no perf, safety, or concurrency requirements that would justify Rust. Go would work but offers nothing distinct from glib's existing stack.

Bun is load-bearing here, not decorative:

- **Native TypeScript runtime.** Config files (`suitener.config.ts`) are first-class. No transpile step, no tsx, no ts-node.
- **Test execution for JS/TS backends.** When Suitener targets a TS/JS backend — which is most of what gittrix and glib-code are — Bun is the runtime that actually executes the user's tests. Fast startup, native TS, built-in test primitives.
- **Process supervision for `wrap`.** `Bun.spawn` with streaming stdio is the right tool for wrapping dev scripts. Faster startup matters when the harness runs on every dev session.
- **Single-binary distribution.** `bun build --compile` produces one standalone executable. No runtime install, no postinstall scripts, no node-gyp.
- **One install command.** `bun install -g suitener`. That's the whole distribution story.

Cargo isn't in the picture. npm-via-Node isn't in the picture. Bun is the runtime, the build tool, and the distribution channel.

## Scope (v1)

**In scope:**

- TypeScript CLI compiled to a single binary via `bun build --compile`
- `@cloudboyredex/suitener-core` library for programmatic use; CLI is a thin wrapper around it
- Backend type detection (CLI tool, library, HTTP server)
- Existing test suite detection and execution
- Generated test stubs when no suite exists, written to `./suitener-stubs/`
- `suitener wrap <cmd>` subcommand: runs the wrapped command and prepends a passive test-health summary on start, with results written to `./suitener-results/`
- Structured JSON output to `./suitener-results/`
- Minimal pink/blue/green colorway in the terminal output
- Lucide flask icon on moss green (#2D7A3E) for any visual surface

**Out of scope (v1):**

- Auto-fix or suggested fixes
- Agent orchestration / feedback loops
- Secrets / env management abstractions
- Plugin system for custom test generators
- Web UI or dashboard
- CI/CD integrations
- Non-JS/TS backend test execution beyond shelling to detected commands

## How it works

### Invocation

```bash
suitener                    # introspect cwd, run or generate
suitener ./path/to/backend  # target a specific directory
suitener --json             # emit structured output only, no decorated terminal output
suitener wrap "bun run dev" # wrap a dev script with passive test summary
```

### Flow

1. **Introspect** — walk the target directory, identify the project type:
   - CLI tool (binary entry point + arg parsing)
   - Library (exposed functions/modules, no entry point)
   - HTTP server (route definitions, framework imports)
2. **Detect existing tests** — look for conventional test directories (`tests/`, `__tests__/`, `*_test.go`, `*.test.ts`, etc.) and a runnable test command (package.json scripts, Cargo.toml, go test).
3. **Run or generate**:
   - If tests exist → run them. For TS/JS, Bun executes them directly. For other languages, shell to the detected command.
   - If no tests exist → generate minimal stubs to `./suitener-stubs/` based on the detected interface.
4. **Emit results** — write structured JSON to `./suitener-results/` plus a summary line to stdout.

### Generated stub philosophy

Stubs are deliberately minimal — scaffolding for humans/agents to fill in real assertions, not guesses at intent:

- **HTTP endpoint:** "does this respond at all"
- **Library function:** "does this not throw with default args"
- **CLI command:** "does it exit cleanly with `--help`"

Anything more ambitious means Suitener is guessing at intent, which gets wrong fast and trains agents to ignore the output.

### Wrap behavior

```bash
suitener wrap "bun run dev"
```

Runs a test check first, prints a one-line summary on start (`12 tests, 10 passing, last failure in POST /enrich`), then runs the wrapped command transparently. Results land in `./suitener-results/latest.json`. Agents poll that file.

Signal handling (Ctrl-C, SIGTERM) propagates cleanly to the wrapped process. Output is not interleaved — wrap output prints once on start, then the wrapped command takes over the terminal normally.

### Output shape

Results folder: `./suitener-results/`

```
suitener-results/
├── run-2026-05-11-1430.json    # full run output
└── latest.json                  # symlink to most recent run
```

JSON schema (sketch):

```json
{
  "run_id": "2026-05-11-1430",
  "target": "/path/to/project",
  "project_type": "http_server",
  "mode": "existing | generated",
  "summary": { "total": 12, "passed": 10, "failed": 2, "duration_ms": 340 },
  "tests": [
    { "name": "GET /health", "status": "pass", "duration_ms": 12 },
    { "name": "POST /enrich", "status": "fail", "duration_ms": 80, "error": "..." }
  ]
}
```

### Config

Optional `suitener.config.ts` at the project root, loaded natively by Bun:

```ts
import { defineConfig } from "@cloudboyredex/suitener-core";

export default defineConfig({
  target: "./src",
  include: ["**/*.ts"],
  exclude: ["**/*.spec.ts"],
});
```

If absent, Suitener uses sensible defaults. No config required for v1 happy path.

### Terminal output

Pink, blue, green only — no other colors. ANSI codes, no TUI framework. Three-line summary at minimum: project info, test results, summary stats. `--json` skips decoration entirely.

## Architecture

```
suitener/
├── packages/
│   ├── core/           → @cloudboyredex/suitener-core   (library, the actual logic)
│   └── cli/            → suitener          (CLI binary, thin wrapper around core)
```

`@cloudboyredex/suitener-core` exports:

```ts
import { introspect, runTests, generateStubs, wrap } from "@cloudboyredex/suitener-core";

const project = await introspect("./");
const results = await runTests(project);
// or for the wrap use case:
const handle = await wrap("bun run dev", { onTestComplete: (r) => ... });
```

Core defines two extension interfaces from day one:

- **Detectors** — project type detectors, test framework detectors
- **Runners** — how to execute tests for a given project type

v1 ships one concrete implementation of each. Defining the interfaces upfront keeps the architecture honest and gives Suitener the same composability story gittrix has with its adapter pattern.

## Stack

- **Language:** TypeScript
- **Runtime / build / distribution:** Bun
- **CLI parsing:** Bun's built-in `parseArgs` or a minimal wrapper (no commander/yargs)
- **Test execution:** `Bun.spawn` for shelling to existing test commands; direct Bun test API for TS/JS
- **Process supervision:** `Bun.spawn` with streaming stdio for `wrap`
- **Output:** native JSON serialization, ANSI escape codes for terminal color

No dependencies beyond Bun's standard library if possible.

## Distribution

```bash
bun install -g suitener           # CLI binary
bun add @cloudboyredex/suitener-core   # library consumers
```

Build pipeline: `bun build --compile` on tag push, attach binaries to GitHub Releases for direct download fallback. Both `suitener` and `@cloudboyredex/suitener-core` published to npm. Bun handles platform resolution at install time.

## Repo and packages

- GitHub: `cloudboy-jh/suitener`
- npm CLI: `suitener`
- npm library: `@cloudboyredex/suitener-core`
- License: MIT
- Versioning: semver, start at `0.1.0`, stay in `0.x` until the core API feels stable

## Success criteria

- Runs against gittrix and glib-code's backend on day one and produces useful output.
- An agent in a fresh environment can `suitener --json`, parse the result, and know what's broken without further explanation.
- `suitener wrap "bun run dev"` becomes a habitual prefix in dev scripts because the passive summary is genuinely useful.
- Doesn't slow down active glib-code / gittrix development — Suitener is a tool, not another project competing for attention.
- The pitch fits in one sentence: "Bun-native test suite tool for agentic backends."

## Brand

- **Name:** Suitener (test **suite** + sw**eetener**)
- **Icon:** Lucide flask-conical, light cream stroke (#F0F9E8) on moss green background (#2D7A3E), rounded square (Apple icon corner radius spec)
- **Wordmark:** Familjen Grotesk Bold, lowercase, tighter tracking (~4%), square tittle on the `i` to echo the brutalist geometry
- **Colorway:** pink, blue, green (terminal output); moss green (#2D7A3E) and cream (#F0F9E8) (brand)
