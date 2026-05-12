import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { introspect, runTests } from "./index";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "suitener-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

test("detects http server projects", async () => {
  await writeFile(join(dir, "package.json"), JSON.stringify({ type: "module" }));
  await writeFile(join(dir, "server.ts"), `import express from "express";\nconst app = express();\napp.get("/health", () => {});`);

  const project = await introspect(dir);

  expect(project.projectType).toBe("http_server");
});

test("detects package test command", async () => {
  await writeFile(join(dir, "package.json"), JSON.stringify({ scripts: { test: "bun test" } }));
  await writeFile(join(dir, "thing.test.ts"), `import { test, expect } from "bun:test";\ntest("x", () => expect(1).toBe(1));`);

  const project = await introspect(dir);

  expect(project.testCommand?.display).toBe("bun run test");
});

test("generates stubs when no tests exist", async () => {
  await mkdir(join(dir, "src"));
  await writeFile(join(dir, "src", "index.ts"), `export function x() { return 1; }`);

  const project = await introspect(dir);
  const result = await runTests(project);

  expect(result.mode).toBe("generated");
  expect(result.summary.total).toBe(1);
  expect(await Bun.file(join(dir, "suitener-results", "latest.json")).exists()).toBe(true);
});

test("runs existing bun tests", async () => {
  await writeFile(join(dir, "package.json"), JSON.stringify({ scripts: { test: "bun test" } }));
  await writeFile(join(dir, "ok.test.ts"), `import { test, expect } from "bun:test";\ntest("ok", () => expect(true).toBe(true));`);

  const project = await introspect(dir);
  const result = await runTests(project);

  expect(result.mode).toBe("existing");
  expect(result.summary.failed).toBe(0);
});
