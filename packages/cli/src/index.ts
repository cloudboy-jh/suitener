#!/usr/bin/env bun
import { introspect, runTests, wrap } from "@suitener/core";
import { render, renderWrapSummary } from "./render";

interface Args {
  target: string;
  json: boolean;
  wrapCommand?: string;
}

async function main(): Promise<void> {
  const args = parseArgs(Bun.argv.slice(2));

  if (args.wrapCommand) {
    const handle = await wrap(args.wrapCommand, {
      cwd: args.target,
      onTestComplete: (result) => {
        if (args.json) console.log(JSON.stringify(result));
        else console.log(renderWrapSummary(result));
      }
    });
    const code = await handle.exited;
    process.exit(code);
  }

  const project = await introspect(args.target);
  const result = await runTests(project);

  if (args.json) console.log(JSON.stringify(result));
  else console.log(render(result, project));

  if (result.summary.failed > 0) process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const json = argv.includes("--json");
  const clean = argv.filter((arg) => arg !== "--json");

  if (clean[0] === "wrap") {
    const command = clean.slice(1).join(" ").trim();
    if (!command) usage("Missing command for wrap");
    return { target: process.cwd(), json, wrapCommand: command };
  }

  if (clean.includes("--help") || clean.includes("-h")) {
    console.log(`suitener\n\nUsage:\n  suitener [target] [--json]\n  suitener wrap "bun run dev" [--json]`);
    process.exit(0);
  }

  return { target: clean[0] ?? process.cwd(), json };
}

function usage(message: string): never {
  console.error(message);
  console.error(`Usage: suitener [target] [--json] | suitener wrap "bun run dev"`);
  process.exit(2);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
