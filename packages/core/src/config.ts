import { join, resolve } from "node:path";
import type { ResolvedSuitenerConfig, SuitenerConfig } from "./types";

export const defaultConfig = {
  target: ".",
  include: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs", "**/*.go", "**/*.rs", "package.json", "Cargo.toml", "go.mod"],
  exclude: ["node_modules/**", "dist/**", "build/**", ".git/**", "suitener-results/**", "suitener-stubs/**", "*.test.*", "*.spec.*", "__tests__/**", "tests/**"]
} satisfies Required<SuitenerConfig>;

export function defineConfig(config: SuitenerConfig): SuitenerConfig {
  return config;
}

export async function loadConfig(root: string): Promise<ResolvedSuitenerConfig> {
  const absoluteRoot = resolve(root);
  const configPath = join(absoluteRoot, "suitener.config.ts");
  let userConfig: SuitenerConfig = {};

  if (await Bun.file(configPath).exists()) {
    const imported = await import(`${configPath}?t=${Date.now()}`);
    userConfig = imported.default ?? imported.config ?? {};
  }

  const target = resolve(absoluteRoot, userConfig.target ?? defaultConfig.target);

  return {
    root: absoluteRoot,
    target,
    include: userConfig.include ?? defaultConfig.include,
    exclude: userConfig.exclude ?? defaultConfig.exclude
  };
}
