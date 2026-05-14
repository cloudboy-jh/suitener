<p align="center">
  <img src="./assets/suitener-logo-readme.png" alt="Suitener" width="760" />
</p>

<p align="center">
  <strong>The core library behind Suitener's backend test introspection and reporting.</strong>
</p>

<p align="center">
  Use Suitener programmatically to inspect projects, run tests, generate stubs, and write structured JSON results.
</p>

---

## Install

```bash
bun add suitener-core
```

## Usage

```ts
import { generateStubs, introspect, runTests, writeResults } from "suitener-core";

const project = await introspect("./path/to/backend");

const result = project.testCommand
  ? await runTests(project)
  : await generateStubs(project);

await writeResults(project.target, result);
```

## Config

```ts
import { defineConfig } from "suitener-core";

export default defineConfig({
  target: "./src",
  include: ["**/*.ts"],
  exclude: ["**/*.spec.ts"]
});
```

## API

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

- `defineConfig(config)`: typed helper for `suitener.config.ts`
- `loadConfig(root)`: load and resolve project config
- `introspect(target)`: scan project files and detect project type/test command
- `runTests(project)`: run the detected test command and normalize results
- `generateStubs(project)`: create minimal Bun test stubs when no tests exist
- `writeResults(target, result)`: write timestamped and latest JSON reports
- `wrap(command, options)`: run a passive test check beside a dev command

## Result shape

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
}
```

## Output files

`writeResults` writes to:

```text
suitener-results/
├── run-2026-05-11-143000.json
└── latest.json
```

`latest.json` is overwritten every run so agents and tools can read from a stable path.

## CLI package

The command-line tool is published as [`suitener`](https://www.npmjs.com/package/suitener).

```bash
bun install -g suitener
suitener ./path/to/backend
```

## License

MIT
