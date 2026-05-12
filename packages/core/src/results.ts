import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProjectIntrospection, SuitenerResult } from "./types";

export function createRunId(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export async function writeResults(project: ProjectIntrospection, result: SuitenerResult): Promise<void> {
  const dir = join(project.root, "suitener-results");
  await mkdir(dir, { recursive: true });
  const body = `${JSON.stringify(result, null, 2)}\n`;
  await writeFile(join(dir, `run-${result.run_id}.json`), body, "utf8");
  await writeFile(join(dir, "latest.json"), body, "utf8");
}
