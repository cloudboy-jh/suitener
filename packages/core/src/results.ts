import { mkdir, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { ProjectIntrospection, SuitenerResult } from "./types";

export interface WrittenResultPaths {
  run: string;
  latest: string;
}

export function createRunId(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export async function writeResults(project: ProjectIntrospection, result: SuitenerResult): Promise<WrittenResultPaths> {
  const dir = join(project.root, "suitener-results");
  await mkdir(dir, { recursive: true });
  const runPath = join(dir, `run-${result.run_id}.json`);
  const latestPath = join(dir, "latest.json");
  const paths = {
    run: relativePath(project.root, runPath),
    latest: relativePath(project.root, latestPath)
  };
  result.paths = paths;
  const body = `${JSON.stringify(result, null, 2)}\n`;
  await writeFile(runPath, body, "utf8");
  await writeFile(latestPath, body, "utf8");
  return paths;
}

export function relativePath(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}
