import { introspect } from "@cloudboyredex/suitener-core";
import type { CliArgs } from "../args";
import { renderInspect } from "../output/render";

export async function inspect(args: CliArgs): Promise<number> {
  const project = await introspect(args.target);
  if (args.json) console.log(JSON.stringify(project));
  else console.log(renderInspect(project, { quiet: args.quiet, verbose: args.verbose }));
  return 0;
}
