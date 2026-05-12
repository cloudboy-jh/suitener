import { expect, test } from "bun:test";
import type { ProjectIntrospection, SuitenerResult } from "@cloudboyredex/suitener-core";
import { parseArgs } from "./args";
import { renderCheck, renderInspect, renderStubs, renderWrapSummary } from "./output/render";

test("parses default command as check", () => {
  const args = parseArgs([], "/repo");
  expect(args.command).toBe("check");
  expect(args.target).toBe("/repo");
});

test("parses target shorthand", () => {
  const args = parseArgs(["./backend", "--json"], "/repo");
  expect(args.command).toBe("check");
  expect(args.target).toBe("./backend");
  expect(args.json).toBe(true);
});

test("parses explicit commands", () => {
  expect(parseArgs(["inspect", "./api"], "/repo").target).toBe("./api");
  expect(parseArgs(["stubs", "./api"], "/repo").command).toBe("stubs");
  expect(parseArgs(["wrap", "bun", "run", "dev"], "/repo").wrapCommand).toBe("bun run dev");
});

test("renders passed check output", () => {
  const output = renderCheck(result({ failed: 0 }), project(), { color: false });
  expect(output).toContain("passed  12 tests / 12 pass / 0 fail");
  expect(output).toContain("summary");
  expect(output).toContain("  project  repo");
  expect(output).toContain("  report   suitener-results/latest.json");
});

test("renders failed check output", () => {
  const output = renderCheck(result({ failed: 2 }), project(), { color: false });
  expect(output).toContain("failed  12 tests / 10 pass / 2 fail");
  expect(output).toContain("summary");
  expect(output).toContain("  error    api.test.ts");
});

test("renders stubs output", () => {
  const output = renderStubs(result({ mode: "generated", total: 1, passed: 0, failed: 0, tests: [{ name: "library-smoke.test.ts", status: "skip", duration_ms: 0 }] }), project({ projectType: "library" }), { color: false });
  expect(output).toContain("stubs   1 generated");
  expect(output).toContain("summary");
  expect(output).toContain("  files    suitener-stubs/library-smoke.test.ts");
});

test("renders inspect output", () => {
  const output = renderInspect(project(), { color: false });
  expect(output).toContain("inspect");
  expect(output).toContain("summary");
  expect(output).toContain("  tests    found");
  expect(output).toContain("  command  bun run test");
});

test("renders verbose dev section", () => {
  const output = renderCheck(result({ failed: 0 }), project(), { color: false, verbose: true });
  expect(output).toContain("dev");
  expect(output).toContain("  target   /repo");
  expect(output).toContain("  signals  express import");
});

test("renders wrap summary", () => {
  const output = renderWrapSummary(result({ failed: 2 }), { color: false });
  expect(output).toContain("suitener  12 tests / 10 pass / 2 fail / last failure api.test.ts");
});

function project(overrides: Partial<ProjectIntrospection> = {}): ProjectIntrospection {
  return {
    name: "repo",
    root: "/repo",
    target: "/repo",
    projectType: "http_server",
    files: [{ path: "/repo/api.test.ts", relativePath: "api.test.ts", kind: "test" }],
    testFiles: [{ path: "/repo/api.test.ts", relativePath: "api.test.ts", kind: "test" }],
    packageJson: { scripts: { test: "bun test" } },
    testCommand: { command: "bun", args: ["run", "test"], display: "bun run test", runtime: "bun" },
    indicators: ["express import"],
    config: { root: "/repo", target: "/repo", include: [], exclude: [] },
    ...overrides
  };
}

function result(overrides: Partial<SuitenerResult> & { total?: number; passed?: number; failed?: number } = {}): SuitenerResult {
  const total = overrides.total ?? 12;
  const failed = overrides.failed ?? 0;
  const passed = overrides.passed ?? total - failed;
  const base: SuitenerResult = {
    run_id: "2026-05-12-000000",
    project_name: "repo",
    target: "/repo",
    project_type: "http_server",
    mode: "existing",
    summary: { total, passed, failed, duration_ms: 290 },
    tests: failed > 0 ? [{ name: "api.test.ts", status: "fail", duration_ms: 290, error: "boom" }] : [{ name: "api.test.ts", status: "pass", duration_ms: 290 }],
    raw_output: { stdout: "", stderr: "", exit_code: failed > 0 ? 1 : 0, command: "bun run test" }
  };
  return { ...base, ...overrides, summary: { total, passed, failed, duration_ms: overrides.summary?.duration_ms ?? 290 } };
}
