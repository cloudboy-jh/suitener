#!/usr/bin/env bun
import { CliUsageError, helpText, parseArgs } from "./args";
import { check } from "./commands/check";
import { inspect } from "./commands/inspect";
import { stubs } from "./commands/stubs";
import { wrapCommand } from "./commands/wrap";
import { printVersion } from "./commands/version";

async function main(): Promise<void> {
  const args = parseArgs(Bun.argv.slice(2));
  let code = 0;

  switch (args.command) {
    case "check":
      code = await check(args);
      break;
    case "inspect":
      code = await inspect(args);
      break;
    case "stubs":
      code = await stubs(args);
      break;
    case "wrap":
      code = await wrapCommand(args);
      break;
    case "version":
      code = printVersion(args.json);
      break;
    case "help":
      console.log(helpText);
      code = 0;
      break;
  }

  process.exit(code);
}

main().catch((error) => {
  if (error instanceof CliUsageError) {
    console.error(error.message);
    console.error(helpText);
    process.exit(2);
  }
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(3);
});
