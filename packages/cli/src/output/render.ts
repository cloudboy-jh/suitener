import type { ProjectIntrospection, SuitenerResult } from "suitener-core";
import { color } from "./colors";
import { devDetails, errorLine, projectName, reportPath, row, section, statusIcon, stubPath, testLine, testRatio, type RenderOptions } from "./format";

export function renderCheck(result: SuitenerResult, project: ProjectIntrospection, options: RenderOptions = {}): string {
  const enabled = options.color ?? true;
  if (options.quiet) return renderQuietResult(result, enabled);
  if (result.mode === "generated") return renderStubs(result, project, options);

  const failed = result.summary.failed > 0;
  const icon = statusIcon(failed ? "fail" : "pass", enabled);
  const heading = color(enabled, failed ? "failed" : "passed", failed ? "pink" : "green");
  const lines = [
    `${icon} ${heading}   ${testRatio(result, enabled)}`,
    "",
    section("summary", enabled),
    row("project", projectName(project), enabled),
    row("suite", result.mode, enabled),
    row("report", reportPath(result), enabled),
    ""
  ];

  for (const test of result.tests) {
    lines.push(testLine(test, enabled));
    if (test.status === "fail" && test.error) {
      lines.push(errorLine(test, enabled));
    }
  }

  if (options.verbose) lines.push(...devDetails(project, enabled));
  return lines.join("\n");
}

export function renderStubs(result: SuitenerResult, project: ProjectIntrospection, options: RenderOptions = {}): string {
  const enabled = options.color ?? true;
  if (options.quiet) return `${statusIcon("skip", enabled)} stubs ${result.summary.total}`;
  const lines = [
    `${statusIcon("skip", enabled)} ${color(enabled, "stubs", "blue")}   ${result.summary.total} generated`,
    "",
    section("summary", enabled),
    row("project", projectName(project), enabled),
    row("suite", result.mode, enabled),
    row("files", stubPath(result), enabled),
    row("report", reportPath(result), enabled),
    ""
  ];

  for (const test of result.tests) {
    lines.push(testLine(test, enabled));
  }

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
  if (result.mode === "generated") return `${statusIcon("skip", enabled)} ${color(enabled, "suitener", "blue")}  ${result.summary.total} stub generated / ${reportPath(result)}`;
  const failed = result.summary.failed > 0;
  const icon = statusIcon(failed ? "fail" : "pass", enabled);
  const lines = [
    `${icon} ${color(enabled, "suitener", "blue")}  ${testRatio(result, enabled)}`
  ];

  for (const test of result.tests) {
    if (test.status === "fail") {
      lines.push(`  ${statusIcon("fail", enabled)} ${test.name}${test.error ? `: ${test.error.split("\n")[0]}` : ""}`);
    }
  }

  return lines.join("\n");
}

function renderQuietResult(result: SuitenerResult, enabled: boolean): string {
  if (result.mode === "generated") return `${statusIcon("skip", enabled)} stubs ${result.summary.total}`;
  const failed = result.summary.failed > 0;
  const icon = statusIcon(failed ? "fail" : "pass", enabled);
  const status = color(enabled, failed ? "failed" : "passed", failed ? "pink" : "green");
  return `${icon} ${status} ${result.summary.passed}/${result.summary.total}`;
}
