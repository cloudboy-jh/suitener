import type { ProjectIntrospection, SuitenerResult } from "@cloudboyredex/suitener-core";
import { color } from "./colors";
import { devDetails, firstError, projectName, reportPath, row, section, stubPath, testRatio, type RenderOptions } from "./format";

export function renderCheck(result: SuitenerResult, project: ProjectIntrospection, options: RenderOptions = {}): string {
  const enabled = options.color ?? true;
  if (options.quiet) return renderQuietResult(result, enabled);
  if (result.mode === "generated") return renderStubs(result, project, options);

  const failed = result.summary.failed > 0;
  const heading = color(enabled, failed ? "failed" : "passed", failed ? "pink" : "green");
  const lines = [
    `${heading}  ${testRatio(result, enabled)}`,
    "",
    section("summary", enabled),
    row("project", projectName(project), enabled),
    row("suite", result.mode, enabled),
    row("time", `${result.summary.duration_ms}ms`, enabled)
  ];

  if (failed) {
    lines.push(row("error", firstError(result) ?? "see JSON output", enabled));
  }

  lines.push(row("report", reportPath(result), enabled));
  if (options.verbose) lines.push(...devDetails(project, enabled));
  return lines.join("\n");
}

export function renderStubs(result: SuitenerResult, project: ProjectIntrospection, options: RenderOptions = {}): string {
  const enabled = options.color ?? true;
  if (options.quiet) return `${color(enabled, "stubs", "blue")} ${result.summary.total}`;
  const lines = [
    `${color(enabled, "stubs", "blue")}   ${result.summary.total} generated`,
    "",
    section("summary", enabled),
    row("project", projectName(project), enabled),
    row("suite", result.mode, enabled),
    row("files", stubPath(result), enabled),
    row("report", reportPath(result), enabled)
  ];
  if (options.verbose) lines.push(...devDetails(project, enabled));
  return lines.join("\n");
}

export function renderInspect(project: ProjectIntrospection, options: RenderOptions = {}): string {
  const enabled = options.color ?? true;
  const tests = project.testFiles.length > 0 ? "found" : "missing";
  if (options.quiet) return `${project.projectType} tests:${tests}`;
  const lines = [
    color(enabled, "inspect", "blue"),
    "",
    section("summary", enabled),
    row("project", projectName(project), enabled),
    row("kind", project.projectType, enabled),
    row("tests", tests, enabled),
    row("command", project.testCommand?.display ?? "none", enabled)
  ];
  if (options.verbose) lines.push(...devDetails(project, enabled));
  return lines.join("\n");
}

export function renderWrapSummary(result: SuitenerResult, options: RenderOptions = {}): string {
  const enabled = options.color ?? true;
  if (result.mode === "generated") return `${color(enabled, "suitener", "blue")}  ${result.summary.total} stub generated / ${reportPath(result)}`;
  const lastFailure = result.tests.find((test) => test.status === "fail")?.name;
  return `${color(enabled, "suitener", "blue")}  ${testRatio(result, enabled)}${lastFailure ? ` / last failure ${lastFailure}` : ""}`;
}

function renderQuietResult(result: SuitenerResult, enabled: boolean): string {
  if (result.mode === "generated") return `${color(enabled, "stubs", "blue")} ${result.summary.total}`;
  const failed = result.summary.failed > 0;
  const status = color(enabled, failed ? "failed" : "passed", failed ? "pink" : "green");
  return `${status} ${result.summary.passed}/${result.summary.total}`;
}
