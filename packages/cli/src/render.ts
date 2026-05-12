import type { ProjectIntrospection, SuitenerResult } from "@suitener/core";

const colors = {
  pink: "\x1b[95m",
  blue: "\x1b[94m",
  green: "\x1b[92m",
  reset: "\x1b[0m"
};

export function render(result: SuitenerResult, project: ProjectIntrospection): string {
  const status = result.summary.failed > 0 ? `${colors.pink}failed${colors.reset}` : `${colors.green}passing${colors.reset}`;
  return [
    `${colors.blue}suitener${colors.reset} ${project.projectType} ${project.target}`,
    `${colors.green}${result.mode}${colors.reset} ${result.summary.total} tests, ${result.summary.passed} passing, ${result.summary.failed} failed`,
    `${status} in ${result.summary.duration_ms}ms → suitener-results/latest.json`
  ].join("\n");
}

export function renderWrapSummary(result: SuitenerResult): string {
  const failed = result.summary.failed > 0 ? `${colors.pink}${result.summary.failed} failed${colors.reset}` : `${colors.green}all passing${colors.reset}`;
  const lastFailure = result.tests.find((test) => test.status === "fail")?.name;
  return `${colors.blue}suitener${colors.reset} ${result.summary.total} tests, ${result.summary.passed} passing, ${failed}${lastFailure ? `, last failure in ${lastFailure}` : ""}`;
}
