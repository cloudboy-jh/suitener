import { readdir } from "node:fs/promises";
import { basename, join, relative, sep } from "node:path";
import type { ResolvedSuitenerConfig, ScannedFile } from "./types";

const ignoredDirs = new Set(["node_modules", ".git", "dist", "build", "suitener-results", "suitener-stubs"]);
const testPattern = /(^|[/\\])(__tests__|tests)([/\\])|\.(test|spec)\.[cm]?[jt]sx?$|_test\.go$/;
const sourcePattern = /\.[cm]?[jt]sx?$|\.go$|\.rs$/;

export async function scanFiles(config: ResolvedSuitenerConfig): Promise<ScannedFile[]> {
  const files: ScannedFile[] = [];
  await walk(config.target, config.target, files);
  return files;
}

async function walk(dir: string, root: string, files: ScannedFile[]): Promise<void> {
  let entries: Awaited<ReturnType<typeof readdir>>;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) await walk(join(dir, entry.name), root, files);
      continue;
    }
    if (!entry.isFile()) continue;

    const path = join(dir, entry.name);
    const relativePath = relative(root, path).split(sep).join("/");
    files.push({ path, relativePath, kind: classify(relativePath, entry.name) });
  }
}

function classify(relativePath: string, name: string): ScannedFile["kind"] {
  if (name === "package.json" || name === "Cargo.toml" || name === "go.mod") return "manifest";
  if (testPattern.test(relativePath)) return "test";
  if (sourcePattern.test(relativePath)) return "source";
  return "other";
}

export function isEntrypoint(path: string): boolean {
  const name = basename(path).toLowerCase();
  return ["index.ts", "index.js", "main.ts", "main.js", "cli.ts", "cli.js", "server.ts", "server.js", "app.ts", "app.js"].includes(name);
}
