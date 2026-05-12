import { introspect } from "./detect";
import { runTests } from "./run";
import type { SuitenerResult, WrapOptions } from "./types";

export interface WrapHandle {
  child: Bun.Subprocess;
  testRun: Promise<SuitenerResult>;
  exited: Promise<number>;
}

export async function wrap(command: string, options: WrapOptions = {}): Promise<WrapHandle> {
  const cwd = options.cwd ?? process.cwd();
  const testRun = introspect(cwd).then(runTests);
  testRun.then((result) => options.onTestComplete?.(result));

  const child = Bun.spawn(shellCommand(command), {
    cwd,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit"
  });

  const forward = () => child.kill();
  process.once("SIGINT", forward);
  process.once("SIGTERM", forward);

  const exited = child.exited.finally(() => {
    process.off("SIGINT", forward);
    process.off("SIGTERM", forward);
  });

  return { child, testRun, exited };
}

function shellCommand(command: string): string[] {
  if (process.platform === "win32") return ["cmd", "/d", "/s", "/c", command];
  return ["sh", "-c", command];
}
