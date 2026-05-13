import { introspect, runTests } from "suitener-core";
import type { CliArgs } from "../args";
import { renderCheck } from "../output/render";

export async function check(args: CliArgs): Promise<number> {
  const project = await introspect(args.target);
  const result = await runTests(project);

  if (args.json) console.log(JSON.stringify(result));
  else console.log(renderCheck(result, project, { quiet: args.quiet, verbose: args.verbose }));

  return result.summary.failed > 0 ? 1 : 0;
}
