# suitener-core

Core library for Suitener: project introspection, test execution, stub generation, and structured JSON results.

## Install

```bash
bun add suitener-core
```

## Quick use

```ts
import { introspect, runTests } from "suitener-core";

const project = await introspect("./path/to/backend");
const result = await runTests(project);
console.log(result.summary);
```

## API

```ts
import {
  defineConfig,
  loadConfig,
  introspect,
  runTests,
  generateStubs,
  writeResults,
  wrap,
} from "suitener-core";
```

- `defineConfig(config)` — typed helper for `suitener.config.ts`
- `loadConfig(root)` — resolves config/defaults
- `introspect(root)` — detects project type, files, and test command
- `runTests(project)` — runs detected suite or falls back to stubs
- `generateStubs(project)` — force stub generation
- `writeResults(project, result)` — writes `suitener-results/run-*.json` and `latest.json`
- `wrap(command, options)` — runs a passive Suitener check before a dev command

## Config example

```ts
import { defineConfig } from "suitener-core";

export default defineConfig({
  target: "./src",
  include: ["**/*.ts"],
  exclude: ["**/*.spec.ts"],
});
```

## Notes

- Runtime: Bun
- Output mode: existing tests or generated stubs
- JSON reports: `suitener-results/latest.json`

## License

MIT
