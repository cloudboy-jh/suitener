import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProjectIntrospection, SuitenerResult, TestResult } from "./types";
import { createRunId, relativePath, writeResults } from "./results";

export async function generateStubs(project: ProjectIntrospection): Promise<SuitenerResult> {
  const start = performance.now();
  const dir = join(project.root, "suitener-stubs");
  await mkdir(dir, { recursive: true });

  const stubs = buildStubs(project);
  const generatedFiles: string[] = [];
  for (const stub of stubs) {
    const path = join(dir, stub.name);
    await writeFile(path, stub.content, "utf8");
    generatedFiles.push(relativePath(project.root, path));
  }

  const tests: TestResult[] = stubs.map((stub) => ({ name: stub.name, status: "skip", duration_ms: 0 }));
  const result: SuitenerResult = {
    run_id: createRunId(),
    project_name: project.name,
    target: project.target,
    project_type: project.projectType,
    mode: "generated",
    summary: { total: tests.length, passed: 0, failed: 0, duration_ms: Math.round(performance.now() - start) },
    tests,
    generated_files: generatedFiles
  };
  await writeResults(project, result);
  return result;
}

function buildStubs(project: ProjectIntrospection): Array<{ name: string; content: string }> {
  if (project.projectType === "http_server") {
    return [{ name: "http-smoke.test.ts", content: `import { test, expect } from "bun:test";\n\ntest("HTTP server responds", async () => {\n  // Start/import your server, then replace this URL with a live route.\n  const res = await fetch("http://localhost:3000/health").catch(() => undefined);\n  expect(res).toBeDefined();\n});\n` }];
  }
  if (project.projectType === "cli") {
    return [{ name: "cli-help.test.ts", content: `import { test, expect } from "bun:test";\n\ntest("CLI exits cleanly with --help", async () => {\n  const proc = Bun.spawn(["bun", "run", "--help"], { stdout: "pipe", stderr: "pipe" });\n  const code = await proc.exited;\n  expect(code).toBe(0);\n});\n` }];
  }
  if (project.projectType === "library") {
    return [{ name: "library-smoke.test.ts", content: `import { test, expect } from "bun:test";\n\ntest("library import does not throw", async () => {\n  const load = async () => import("../src/index");\n  expect(load()).resolves.toBeDefined();\n});\n` }];
  }
  return [{ name: "smoke.test.ts", content: `import { test, expect } from "bun:test";\n\ntest("project has a smoke test placeholder", () => {\n  expect(true).toBe(true);\n});\n` }];
}
