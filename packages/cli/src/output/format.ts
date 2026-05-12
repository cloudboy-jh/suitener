import type { ProjectIntrospection, SuitenerResult } from "@cloudboyredex/suitener-core";
import { color } from "./colors";

export interface RenderOptions {
  color?: boolean;
  quiet?: boolean;
  verbose?: boolean;
}

export function label(name: string, enabled = true): string {
  return color(enabled, name.padEnd(8), "blue");
}

export function section(name: string, enabled = true): string {
  return color(enabled, name, "blue");
}

export function row(name: string, value: string | number, enabled = true): string {
  return `  ${label(name, enabled)} ${value}`;
}

export function projectName(project: ProjectIntrospection): string {
  return project.name;
}

export function testRatio(result: SuitenerResult, enabled = true): string {
  const total = `${result.summary.total} tests`;
  const pass = color(enabled, `${result.summary.passed} pass`, "green");
  const fail = result.summary.failed > 0
    ? color(enabled, `${result.summary.failed} fail`, "pink")
    : `${result.summary.failed} fail`;
  return `${total} / ${pass} / ${fail}`;
}

export function firstError(result: SuitenerResult): string | undefined {
  const failed = result.tests.find((test) => test.status === "fail");
  return failed?.name ?? failed?.error?.split("\n")[0];
}

export function stubPath(result: SuitenerResult): string {
  return result.generated_files?.[0] ?? `suitener-stubs/${result.tests[0]?.name ?? "smoke.test.ts"}`;
}

export function reportPath(result: SuitenerResult): string {
  return result.paths?.latest ?? "suitener-results/latest.json";
}

export function devDetails(project: ProjectIntrospection, enabled = true): string[] {
  return [
    "",
    section("dev", enabled),
    row("target", project.target, enabled),
    row("files", project.files.length, enabled),
    row("signals", project.indicators.join(", ") || "none", enabled)
  ];
}
