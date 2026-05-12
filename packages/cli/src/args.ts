export type Command = "check" | "inspect" | "stubs" | "wrap" | "version" | "help";

export interface CliArgs {
  command: Command;
  target: string;
  json: boolean;
  quiet: boolean;
  verbose: boolean;
  wrapCommand?: string;
}

const commands = new Set<Command>(["check", "inspect", "stubs", "wrap", "version", "help"]);

export function parseArgs(argv: string[], cwd = process.cwd()): CliArgs {
  const json = argv.includes("--json");
  const quiet = argv.includes("--quiet") || argv.includes("-q");
  const verbose = argv.includes("--verbose") || argv.includes("-v");
  const help = argv.includes("--help") || argv.includes("-h");
  const version = argv.includes("--version") || argv.includes("-V");
  const clean = argv.filter((arg) => !["--json", "--quiet", "-q", "--verbose", "-v", "--help", "-h", "--version", "-V"].includes(arg));

  if (help) return base("help", cwd, json, quiet, verbose);
  if (version) return base("version", cwd, json, quiet, verbose);

  const first = clean[0];
  const command = commands.has(first as Command) ? first as Command : "check";

  if (command === "wrap") {
    const wrapCommand = clean.slice(1).join(" ").trim();
    if (!wrapCommand) throw new CliUsageError("Missing command for wrap");
    return { command, target: cwd, json, quiet, verbose, wrapCommand };
  }

  if (command === "version" || command === "help") return base(command, cwd, json, quiet, verbose);

  const target = command === "check" && first && !commands.has(first as Command)
    ? first
    : clean[1] ?? cwd;

  return { command, target, json, quiet, verbose };
}

function base(command: Command, target: string, json: boolean, quiet: boolean, verbose: boolean): CliArgs {
  return { command, target, json, quiet, verbose };
}

export class CliUsageError extends Error {
  override name = "CliUsageError";
}

export const helpText = `suitener

Usage:
  suitener [target] [--json] [--quiet] [--verbose]
  suitener check [target]
  suitener inspect [target]
  suitener stubs [target]
  suitener wrap "bun run dev"

Commands:
  check    introspect, then run tests or generate stubs
  inspect  introspect only
  stubs    force stub generation
  wrap     run passive test check beside a dev command
`;
