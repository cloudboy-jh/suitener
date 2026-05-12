import { wrap as coreWrap } from "@cloudboyredex/suitener-core";
import type { CliArgs } from "../args";
import { renderWrapSummary } from "../output/render";

export async function wrapCommand(args: CliArgs): Promise<number> {
  const handle = await coreWrap(args.wrapCommand!, {
    cwd: args.target,
    onTestComplete: (result) => {
      if (args.json) console.log(JSON.stringify(result));
      else if (!args.quiet) console.log(renderWrapSummary(result));
    }
  });
  return handle.exited;
}
