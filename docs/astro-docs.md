---
title: Suitener
description: Bun-native test suite tooling for agentic backend development.
---

<p align="center">
  <img src="./suitener-logo-readme.png" alt="Suitener" width="760" />
</p>

Suitener is a Bun-native TypeScript CLI and core library for backend test discovery, execution, stub generation, and structured JSON reporting.

It is built for agentic backend development: fast feedback loops, minimal terminal noise, and output that tools can parse without scraping human-formatted logs.

## Packages

Suitener ships as two npm packages:

| Package | Purpose |
| --- | --- |
| `suitener` | CLI package. Provides the `suitener` command. |
| `suitener-core` | Programmatic library used by the CLI. |

Current repo version: `0.1.5`.

## Install

Install the CLI globally with Bun:

```bash
bun install -g suitener
```

Run the CLI without a global install:

```bash
bunx suitener
```

Install the core library:

```bash
bun add suitener-core
```

## Core idea

Suitener does four things:

1. Scans a backend project.
2. Detects the project shape and existing test setup.
3. Runs existing tests, or generates minimal test stubs when tests are missing.
4. Writes stable JSON results to `suitener-results/latest.json`.

It does not attempt to auto-fix code, invent business assertions, orchestrate agents, or replace a real test framework. It wraps the test surface a project already has and produces agent-readable output.

## CLI quickstart

Run against the current directory:

```bash
suitener
```

Run against a specific project:

```bash
suitener ./path/to/backend
```

Run the explicit check command:

```bash
suitener check ./path/to/backend
```

Inspect a project without running tests:

```bash
suitener inspect ./path/to/backend
```

Force stub generation:

```bash
suitener stubs ./path/to/backend
```

Emit JSON only:

```bash
suitener --json
```

Use quieter terminal output:

```bash
suitener --quiet
```

Include dev/debug details:

```bash
suitener --verbose
```

Wrap a dev command:

```bash
suitener wrap "bun run dev"
```

## CLI syntax

```text
suitener [target] [--json] [--quiet] [--verbose]
suitener check [target]
suitener inspect [target]
suitener stubs [target]
suitener wrap "bun run dev"
suitener --help
suitener --version
```

## Commands

### `check`

`check` is the default command.

```bash
suitener check ./path/to/backend
```

Flow:

1. Introspects the target project.
2. Detects test files and a runnable test command.
3. Runs the existing tests if both tests and a command exist.
4. Generates stubs if tests or a command are missing.
5. Writes results to `suitener-results/`.
6. Prints either decorated terminal output or raw JSON.

Exit code:

- `0` when no tests fail.
- `1` when existing tests fail.
- `2` for CLI usage errors.
- `3` for internal/runtime errors.

### `inspect`

```bash
suitener inspect ./path/to/backend
```

`inspect` scans the target and reports what Suitener sees without running tests or generating stubs.

It reports:

- project name
- project type
- whether test files were found
- detected test command, if any
- file/signaling details with `--verbose`

### `stubs`

```bash
suitener stubs ./path/to/backend
```

`stubs` forces stub generation even if a project has existing tests. It writes generated files to `suitener-stubs/` and writes a generated-mode report to `suitener-results/`.

### `wrap`

```bash
suitener wrap "bun run dev"
```

`wrap` runs a Suitener check first, prints one Suitener summary line, then starts the wrapped command with normal terminal IO.

Behavior:

- The test check runs before the child command starts.
- The child command inherits stdin, stdout, and stderr.
- Results still land in `suitener-results/latest.json`.
- `SIGINT` and `SIGTERM` are forwarded to the child process.
- The child process exit code becomes the CLI exit code.

Example wrap output:

```text
suitener  2 tests / 2 pass / 0 fail
```

For generated stubs:

```text
suitener  1 stub generated / suitener-results/latest.json
```

## Flags

### `--json`

Prints machine-readable JSON only.

```bash
suitener --json
```

No colors, headings, banners, or extra logs are printed.

### `--quiet` / `-q`

Prints the shortest human-readable summary.

Examples:

```text
passed 2/2
failed 1/2
stubs 1
```

### `--verbose` / `-v`

Adds a dev block to human-readable output.

Example:

```text
dev
  target   /absolute/path/to/backend
  files    24
  signals  http indicator in server.ts
```

### `--help` / `-h`

Prints CLI help.

### `--version` / `-V`

Prints the CLI version.

## Project detection

Suitener classifies a project as one of:

| Type | Meaning |
| --- | --- |
| `cli` | Command-line tool. |
| `library` | Exported module/library. |
| `http_server` | HTTP server or route-based backend. |
| `unknown` | No strong signal found. |

Detection signals include:

- `package.json` with a `bin` field → `cli`
- source files with a shebang in common entrypoint files → `cli`
- `process.argv`, `Bun.argv`, or `parseArgs` usage → `cli`
- imports from `express`, `fastify`, `hono`, `elysia`, or `@hono/node-server` → `http_server`
- route calls like `app.get(...)`, `router.post(...)`, `server.use(...)` → `http_server`
- exported functions, classes, constants, default exports, `package.json` `exports`, `main`, or `module` → `library`

HTTP detection wins while scanning source files. CLI package detection via `package.json` `bin` wins before source scanning.

## Test detection

Suitener treats these as test files:

- files under `tests/`
- files under `__tests__/`
- `*.test.ts`, `*.test.tsx`, `*.test.js`, `*.test.jsx`, `*.test.mts`, `*.test.cts`
- `*.spec.ts`, `*.spec.tsx`, `*.spec.js`, `*.spec.jsx`, `*.spec.mts`, `*.spec.cts`
- `*_test.go`

Suitener detects test commands in this order:

1. `package.json` `scripts.test` → `bun run test`
2. `package.json` `scripts.test:unit` → `bun run test:unit`
3. JS/TS test files → `bun test`
4. `go.mod` or Go test files → `go test ./...`
5. `Cargo.toml` → `cargo test`

If no runnable command is detected, `check` falls back to stub generation.

## File scanning

Suitener recursively scans the configured target directory.

Ignored directories:

- `node_modules`
- `.git`
- `dist`
- `build`
- `suitener-results`
- `suitener-stubs`

Recognized source extensions:

- `.ts`
- `.tsx`
- `.js`
- `.jsx`
- `.mjs`
- `.cjs`
- `.go`
- `.rs`

Recognized manifests:

- `package.json`
- `Cargo.toml`
- `go.mod`

## Running tests

When existing tests are found, Suitener shells out to the detected command with `Bun.spawn`.

The command runs from the target project directory. stdout and stderr are captured and included in `raw_output` inside the JSON result.

Current result normalization is file-level:

- If the test command exits `0`, every detected test file is marked `pass`.
- If the test command exits non-zero, every detected test file is marked `fail`.
- The first error is taken from stderr, or stdout if stderr is empty, capped to the first 8 lines.

This keeps the output stable without parsing every framework's custom reporter format.

## Generated stubs

When Suitener cannot run an existing suite, it generates minimal Bun test stubs into:

```text
suitener-stubs/
```

Generated stubs are scaffolding, not real assertions. They are deliberately small so humans or agents can replace placeholders with project-specific tests.

Stub behavior by project type:

| Project type | Generated file | Purpose |
| --- | --- | --- |
| `http_server` | `http-smoke.test.ts` | Placeholder fetch against `/health`. |
| `cli` | `cli-help.test.ts` | Checks a CLI-style help command exits cleanly. |
| `library` | `library-smoke.test.ts` | Checks the library import does not throw. |
| `unknown` | `smoke.test.ts` | Generic smoke placeholder. |

Generated-stub results use:

```json
"mode": "generated"
```

Generated test entries currently use `skip` status because the files are written but not executed.

## Result output

Suitener writes every run to:

```text
suitener-results/
├── run-2026-05-11-143000.json
└── latest.json
```

`latest.json` is overwritten every run so tools and agents can poll a stable path.

The timestamp format is:

```text
YYYY-MM-DD-HHMMSS
```

## JSON result shape

```ts
interface SuitenerResult {
  run_id: string;
  project_name: string;
  target: string;
  project_type: "cli" | "library" | "http_server" | "unknown";
  mode: "existing" | "generated";
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration_ms: number;
  };
  tests: Array<{
    name: string;
    status: "pass" | "fail" | "skip";
    duration_ms: number;
    error?: string;
  }>;
  paths?: {
    run: string;
    latest: string;
  };
  generated_files?: string[];
  raw_output?: {
    stdout: string;
    stderr: string;
    exit_code: number | null;
    command?: string;
  };
}
```

Example existing-test result:

```json
{
  "run_id": "2026-05-11-143000",
  "project_name": "backend",
  "target": "/path/to/backend",
  "project_type": "http_server",
  "mode": "existing",
  "summary": {
    "total": 2,
    "passed": 2,
    "failed": 0,
    "duration_ms": 155
  },
  "tests": [
    {
      "name": "api.test.ts",
      "status": "pass",
      "duration_ms": 155
    }
  ],
  "paths": {
    "run": "suitener-results/run-2026-05-11-143000.json",
    "latest": "suitener-results/latest.json"
  },
  "raw_output": {
    "stdout": "...",
    "stderr": "",
    "exit_code": 0,
    "command": "bun run test"
  }
}
```

Example generated-stub result:

```json
{
  "run_id": "2026-05-11-143000",
  "project_name": "demo-api",
  "target": "/path/to/demo-api",
  "project_type": "http_server",
  "mode": "generated",
  "summary": {
    "total": 1,
    "passed": 0,
    "failed": 0,
    "duration_ms": 4
  },
  "tests": [
    {
      "name": "http-smoke.test.ts",
      "status": "skip",
      "duration_ms": 0
    }
  ],
  "generated_files": [
    "suitener-stubs/http-smoke.test.ts"
  ],
  "paths": {
    "run": "suitener-results/run-2026-05-11-143000.json",
    "latest": "suitener-results/latest.json"
  }
}
```

## Human-readable output

Passing existing tests:

```text
passed  2 tests / 2 pass / 0 fail

summary
  project  suitener
  suite    existing
  time     155ms
  report   suitener-results/latest.json
```

Failing existing tests:

```text
failed  2 tests / 1 pass / 1 fail

summary
  project  suitener
  suite    existing
  time     155ms
  error    api.test.ts
  report   suitener-results/latest.json
```

Generated stubs:

```text
stubs   1 generated

summary
  project  demo-api
  suite    generated
  files    suitener-stubs/library-smoke.test.ts
  report   suitener-results/latest.json
```

Inspect output:

```text
inspect

summary
  project  demo-api
  kind     http_server
  tests    found
  command  bun run test
```

The normal terminal colorway uses pink, blue, and green ANSI coloring. `--json` disables decoration entirely.

## Config

Config is optional. Suitener looks for `suitener.config.ts` at the project root and loads it directly through Bun.

```ts
import { defineConfig } from "suitener-core";

export default defineConfig({
  target: "./src",
  include: ["**/*.ts"],
  exclude: ["**/*.spec.ts"]
});
```

Config shape:

```ts
interface SuitenerConfig {
  target?: string;
  include?: string[];
  exclude?: string[];
}
```

Defaults:

```ts
{
  target: ".",
  include: [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx",
    "**/*.mjs",
    "**/*.cjs",
    "**/*.go",
    "**/*.rs",
    "package.json",
    "Cargo.toml",
    "go.mod"
  ],
  exclude: [
    "node_modules/**",
    "dist/**",
    "build/**",
    ".git/**",
    "suitener-results/**",
    "suitener-stubs/**",
    "*.test.*",
    "*.spec.*",
    "__tests__/**",
    "tests/**"
  ]
}
```

Note: the current scanner has built-in ignored directories and file classification. The config object is resolved and exposed, but include/exclude glob filtering is intentionally minimal in the current implementation.

## Programmatic API

Install:

```bash
bun add suitener-core
```

Import:

```ts
import {
  defineConfig,
  generateStubs,
  introspect,
  loadConfig,
  runTests,
  wrap,
  writeResults
} from "suitener-core";
```

### `defineConfig(config)`

Typed helper for `suitener.config.ts`.

```ts
import { defineConfig } from "suitener-core";

export default defineConfig({
  target: "./src"
});
```

### `loadConfig(root)`

Loads and resolves `suitener.config.ts` from a root directory.

```ts
const config = await loadConfig(process.cwd());
```

Returns:

```ts
interface ResolvedSuitenerConfig {
  root: string;
  target: string;
  include: string[];
  exclude: string[];
}
```

### `introspect(target)`

Scans a target project and returns a `ProjectIntrospection` object.

```ts
const project = await introspect("./path/to/backend");
```

Result shape:

```ts
interface ProjectIntrospection {
  name: string;
  root: string;
  target: string;
  projectType: "cli" | "library" | "http_server" | "unknown";
  files: ScannedFile[];
  testFiles: ScannedFile[];
  packageJson?: Record<string, unknown>;
  testCommand?: TestCommand;
  indicators: string[];
  config: ResolvedSuitenerConfig;
}
```

### `runTests(project)`

Runs the detected test command for an introspected project.

```ts
const project = await introspect("./path/to/backend");
const result = await runTests(project);
```

If no test command or no test files exist, `runTests` delegates to `generateStubs(project)`.

### `generateStubs(project)`

Writes minimal Bun test stubs and returns a generated-mode result.

```ts
const project = await introspect("./path/to/backend");
const result = await generateStubs(project);
```

### `writeResults(project, result)`

Writes a run file and `latest.json`.

```ts
await writeResults(project, result);
```

### `wrap(command, options)`

Runs a Suitener check, then launches a child command.

```ts
const handle = await wrap("bun run dev", {
  cwd: process.cwd(),
  onTestComplete(result) {
    console.log(result.summary);
  }
});

const exitCode = await handle.exited;
```

Return shape:

```ts
interface WrapHandle {
  child: Bun.Subprocess;
  testRun: Promise<SuitenerResult>;
  exited: Promise<number>;
}
```

## Types

Core project type:

```ts
type ProjectType = "cli" | "library" | "http_server" | "unknown";
```

Run mode:

```ts
type RunMode = "existing" | "generated";
```

Test status:

```ts
type TestStatus = "pass" | "fail" | "skip";
```

Test command:

```ts
interface TestCommand {
  command: string;
  args: string[];
  display: string;
  runtime: "bun" | "go" | "cargo" | "shell";
}
```

Scanned file:

```ts
interface ScannedFile {
  path: string;
  relativePath: string;
  kind: "source" | "test" | "manifest" | "other";
}
```

## Repo layout

```text
suitener/
├── packages/
│   ├── cli/              # suitener CLI package
│   │   ├── src/
│   │   ├── README.md
│   │   └── package.json
│   └── core/             # suitener-core package
│       ├── src/
│       ├── README.md
│       └── package.json
├── README.md
├── Spec.md
├── Testing-guide.md
├── astro-docs.md
└── suitener-logo-readme.png
```

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

Run the source CLI locally:

```bash
bun run packages/cli/src/index.ts
```

Run JSON mode locally:

```bash
bun run packages/cli/src/index.ts --json
```

Run inspect locally:

```bash
bun run packages/cli/src/index.ts inspect
```

Build the standalone CLI binary:

```bash
bun build packages/cli/src/index.ts --compile --outfile packages/cli/dist/suitener
```

On Windows the compiled output is expected at:

```text
packages/cli/dist/suitener.exe
```

## Full local validation

```bash
bun test
bun run typecheck
bun run build
bun run packages/cli/src/index.ts --json
bun run packages/cli/src/index.ts inspect --quiet
```

## Manual fixtures

Stub generation fixture:

```bash
mkdir -p tmp-fixture/src
printf 'export function add(a: number, b: number) { return a + b; }\n' > tmp-fixture/src/index.ts
bun run packages/cli/src/index.ts stubs ./tmp-fixture
rm -rf tmp-fixture
```

Passing test fixture:

```bash
mkdir -p tmp-tested
printf '{"scripts":{"test":"bun test"}}\n' > tmp-tested/package.json
printf 'import { test, expect } from "bun:test"; test("ok", () => expect(true).toBe(true));\n' > tmp-tested/ok.test.ts
bun run packages/cli/src/index.ts check ./tmp-tested --json
rm -rf tmp-tested
```

Failing test fixture:

```bash
mkdir -p tmp-failing
printf '{"scripts":{"test":"bun test"}}\n' > tmp-failing/package.json
printf 'import { test, expect } from "bun:test"; test("fail", () => expect(true).toBe(false));\n' > tmp-failing/fail.test.ts
bun run packages/cli/src/index.ts check ./tmp-failing
rm -rf tmp-failing
```

HTTP inspect fixture:

```bash
mkdir -p tmp-http
printf '{"type":"module"}\n' > tmp-http/package.json
printf 'import express from "express"; const app = express(); app.get("/health", () => {});\n' > tmp-http/server.ts
bun run packages/cli/src/index.ts inspect ./tmp-http
rm -rf tmp-http
```

## Publishing

The repo is a Bun workspace with packages under `packages/*`.

Patch versioning should keep these in sync:

- root `package.json`
- `packages/cli/package.json`
- `packages/core/package.json`
- `packages/cli` dependency on `suitener-core`

Publish packages:

```bash
npm publish packages/core
npm publish packages/cli
```

Publish core first so the CLI dependency exists when npm resolves `suitener-core`.

## Scope

In scope for the current tool:

- Bun-native TypeScript CLI
- core library for programmatic use
- backend type detection
- test suite detection
- test execution through detected commands
- generated Bun test stubs
- structured JSON reports
- stable `latest.json`
- dev command wrapping
- minimal ANSI terminal output

Out of scope:

- auto-fixes
- suggested fixes
- agent orchestration
- plugin system
- web dashboard
- CI/CD integration layer
- secrets or env management
- replacing Jest, Vitest, Bun test, Go test, Cargo test, or other real test runners

## Brand

Name: Suitener, from test suite + sweetener.

Visual identity:

- flask logo
- moss green background
- cream wordmark
- pink, blue, and green terminal colorway

## License

MIT
