import type { ProjectIntrospection, SuitenerResult, TestResult } from "./types";
import { createRunId, writeResults } from "./results";
import { generateStubs } from "./stubs";

export async function runTests(project: ProjectIntrospection): Promise<SuitenerResult> {
  if (!project.testCommand || project.testFiles.length === 0) return generateStubs(project);

  const start = performance.now();
  const proc = Bun.spawn([project.testCommand.command, ...project.testCommand.args], {
    cwd: project.target,
    stdout: "pipe",
    stderr: "pipe"
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited
  ]);
  const duration = Math.round(performance.now() - start);
  const status = exitCode === 0 ? "pass" : "fail";
  const tests: TestResult[] = project.testFiles.length > 0
    ? project.testFiles.map((file) => ({ name: file.relativePath, status, duration_ms: duration, ...(status === "fail" ? { error: firstError(stderr, stdout) } : {}) }))
    : [{ name: project.testCommand.display, status, duration_ms: duration, ...(status === "fail" ? { error: firstError(stderr, stdout) } : {}) }];
  const failed = status === "fail" ? tests.length : 0;
  const passed = status === "pass" ? tests.length : 0;
  const result: SuitenerResult = {
    run_id: createRunId(),
    project_name: project.name,
    target: project.target,
    project_type: project.projectType,
    mode: "existing",
    summary: { total: tests.length, passed, failed, duration_ms: duration },
    tests,
    raw_output: { stdout, stderr, exit_code: exitCode, command: project.testCommand.display }
  };
  await writeResults(project, result);
  return result;
}

function firstError(stderr: string, stdout: string): string {
  const text = stderr.trim() || stdout.trim();
  return text.split("\n").slice(0, 8).join("\n");
}
