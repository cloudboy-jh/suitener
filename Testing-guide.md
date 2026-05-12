# Testing Guide

Local testing is split into two tracks:

- **DEV** — testing Suitener itself while working in this repo.
- **USER** — testing the CLI the way someone would use it on a project.

---

## DEV

Install:

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

Build:

```bash
bun run build
```

Expected build output:

```text
packages/core/dist/index.js
packages/cli/dist/suitener.exe
```

Run the source CLI against this repo:

```bash
bun run packages/cli/src/index.ts
```

Quiet dev check:

```bash
bun run packages/cli/src/index.ts --quiet
```

Verbose dev check:

```bash
bun run packages/cli/src/index.ts --verbose
```

JSON dev check:

```bash
bun run packages/cli/src/index.ts --json
```

Inspect this repo:

```bash
bun run packages/cli/src/index.ts inspect
```

Run compiled CLI on Windows:

```powershell
.\packages\cli\dist\suitener.exe --quiet
```

Run compiled CLI on macOS/Linux:

```bash
./packages/cli/dist/suitener --quiet
```

Full dev validation:

```bash
bun test
bun run typecheck
bun run build
bun run packages/cli/src/index.ts --json
bun run packages/cli/src/index.ts inspect --quiet
```

DEV output should include a `dev` section only with `--verbose`:

```text
passed  2 tests / 2 pass / 0 fail

summary
  project  suitener
  suite    existing
  time     155ms
  report   suitener-results/latest.json

dev
  target   C:\Users\johns\OneDrive\Desktop\Proj\suitener
  files    24
  signals  argv/shebang indicator
```

---

## USER

Default check:

```bash
suitener
```

Explicit check:

```bash
suitener check
```

Check another project:

```bash
suitener ./path/to/project
```

Inspect without running tests:

```bash
suitener inspect ./path/to/project
```

Force stub generation:

```bash
suitener stubs ./path/to/project
```

Wrap a dev command:

```bash
suitener wrap "bun run dev"
```

JSON only:

```bash
suitener --json
```

Quiet output:

```bash
suitener --quiet
```

Verbose output:

```bash
suitener --verbose
```

---

## USER output

Passing tests:

```text
passed  2 tests / 2 pass / 0 fail

summary
  project  suitener
  suite    existing
  time     155ms
  report   suitener-results/latest.json
```

Failing tests:

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

Inspect:

```text
inspect

summary
  project  demo-api
  kind     http_server
  tests    found
  command  bun run test
```

Quiet:

```text
passed 2/2
```

Wrap:

```text
suitener  2 tests / 2 pass / 0 fail
```

---

## JSON output

`--json` prints machine-readable JSON only. No colors, no banners, no extra logs.

```bash
suitener --json
```

Latest report:

```text
suitener-results/latest.json
```

Read it on PowerShell:

```powershell
Get-Content .\suitener-results\latest.json
```

Read it on Bash:

```bash
cat suitener-results/latest.json
```

---

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
bun run packages/cli/src/index.ts check ./tmp-failing; echo $?
rm -rf tmp-failing
```

Inspect fixture:

```bash
mkdir -p tmp-http
printf '{"type":"module"}\n' > tmp-http/package.json
printf 'import express from "express"; const app = express(); app.get("/health", () => {});\n' > tmp-http/server.ts
bun run packages/cli/src/index.ts inspect ./tmp-http
rm -rf tmp-http
```

---

## Exit codes

```text
0  success
1  tests failed
2  CLI usage error
3  internal/runtime error
```

---

## Cleanup

PowerShell:

```powershell
Remove-Item -Recurse -Force .\suitener-results, .\suitener-stubs -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\tmp-fixture, .\tmp-tested, .\tmp-failing, .\tmp-http -ErrorAction SilentlyContinue
```

Bash:

```bash
rm -rf suitener-results suitener-stubs tmp-fixture tmp-tested tmp-failing tmp-http
```
