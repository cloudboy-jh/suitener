import { basename, join } from "node:path";
import type { ProjectIntrospection, ProjectType, ResolvedSuitenerConfig, ScannedFile, TestCommand } from "./types";
import { scanFiles, isEntrypoint } from "./fs";

const httpImports = ["express", "fastify", "hono", "elysia", "@hono/node-server"];
const httpRoutePattern = /\b(app|router|server)\.(get|post|put|patch|delete|route|use)\s*\(/;
const cliPattern = /\b(process\.argv|Bun\.argv|parseArgs)\b/;
const exportPattern = /\bexport\s+(async\s+)?(function|const|class|default)\b/;

export async function introspect(root = ".", config?: ResolvedSuitenerConfig): Promise<ProjectIntrospection> {
  const { loadConfig } = await import("./config");
  const resolvedConfig = config ?? await loadConfig(root);
  const files = await scanFiles(resolvedConfig);
  const packageJson = await readPackageJson(resolvedConfig.target);
  const indicators: string[] = [];
  const projectType = await detectProjectType(files, packageJson, indicators);
  const testFiles = files.filter((file) => file.kind === "test");
  const testCommand = detectTestCommand(files, packageJson, testFiles);

  return {
    name: detectProjectName(resolvedConfig.target, packageJson),
    root: resolvedConfig.root,
    target: resolvedConfig.target,
    projectType,
    files,
    testFiles,
    packageJson,
    testCommand,
    indicators,
    config: resolvedConfig
  };
}

function detectProjectName(target: string, packageJson: Record<string, unknown> | undefined): string {
  if (typeof packageJson?.name === "string" && packageJson.name.trim()) return packageJson.name;
  return basename(target) || target;
}

async function readPackageJson(root: string): Promise<Record<string, unknown> | undefined> {
  const path = join(root, "package.json");
  if (!await Bun.file(path).exists()) return undefined;
  try {
    return await Bun.file(path).json();
  } catch {
    return undefined;
  }
}

async function detectProjectType(files: ScannedFile[], packageJson: Record<string, unknown> | undefined, indicators: string[]): Promise<ProjectType> {
  if (packageJson?.bin) {
    indicators.push("package.json bin field");
    return "cli";
  }

  let sawCli = false;
  let sawExport = false;

  for (const file of files.filter((item) => item.kind === "source")) {
    const text = await Bun.file(file.path).text().catch(() => "");
    if (httpImports.some((name) => text.includes(`from "${name}"`) || text.includes(`from '${name}'`) || text.includes(`require("${name}")`) || text.includes(`require('${name}')`)) || httpRoutePattern.test(text)) {
      indicators.push(`http indicator in ${file.relativePath}`);
      return "http_server";
    }
    if ((isEntrypoint(file.path) && text.startsWith("#!")) || cliPattern.test(text)) sawCli = true;
    if (exportPattern.test(text)) sawExport = true;
  }

  if (sawCli) {
    indicators.push("argv/shebang indicator");
    return "cli";
  }
  if (sawExport || packageJson?.exports || packageJson?.main || packageJson?.module) {
    indicators.push("exported module indicator");
    return "library";
  }
  return "unknown";
}

export function detectTestCommand(files: ScannedFile[], packageJson: Record<string, unknown> | undefined, testFiles: ScannedFile[]): TestCommand | undefined {
  const scripts = packageJson?.scripts && typeof packageJson.scripts === "object" ? packageJson.scripts as Record<string, unknown> : undefined;
  if (typeof scripts?.test === "string") return shellScript("bun", ["run", "test"], "bun run test", "bun");
  if (typeof scripts?.["test:unit"] === "string") return shellScript("bun", ["run", "test:unit"], "bun run test:unit", "bun");
  if (testFiles.some((file) => /\.[cm]?[jt]sx?$/.test(file.relativePath))) return shellScript("bun", ["test"], "bun test", "bun");
  if (files.some((file) => file.relativePath === "go.mod") || testFiles.some((file) => file.relativePath.endsWith("_test.go"))) return shellScript("go", ["test", "./..."], "go test ./...", "go");
  if (files.some((file) => file.relativePath === "Cargo.toml")) return shellScript("cargo", ["test"], "cargo test", "cargo");
  return undefined;
}

function shellScript(command: string, args: string[], display: string, runtime: TestCommand["runtime"]): TestCommand {
  return { command, args, display, runtime };
}
