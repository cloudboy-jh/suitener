import { generateStubs, introspect } from "@cloudboyredex/suitener-core";
import type { CliArgs } from "../args";
import { renderStubs } from "../output/render";

export async function stubs(args: CliArgs): Promise<number> {
  const project = await introspect(args.target);
  const result = await generateStubs(project);
  if (args.json) console.log(JSON.stringify(result));
  else console.log(renderStubs(result, project, { quiet: args.quiet, verbose: args.verbose }));
  return 0;
}
