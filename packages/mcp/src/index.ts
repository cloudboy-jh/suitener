#!/usr/bin/env bun

import { resolve } from "node:path";
import { introspect, runTests } from "suitener-core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "suitener", version: "0.1.5" });
const mcp = server as any;

mcp.registerTool(
  "suitener_introspect",
  {
    title: "Introspect project tests",
    description: "Detect project type, test files, and test command with Suitener.",
    inputSchema: {
      root: z.string().optional(),
    },
  },
  async ({ root }: { root?: string }) => {
    const project = await introspect(resolve(root ?? process.cwd()));
    return text({
      name: project.name,
      root: project.root,
      target: project.target,
      projectType: project.projectType,
      indicators: project.indicators,
      testFiles: project.testFiles.map((file) => file.relativePath),
      testCommand: project.testCommand?.display ?? null,
    });
  },
);

mcp.registerTool(
  "suitener_run_tests",
  {
    title: "Run test suite",
    description: "Run detected tests with Suitener and return structured results.",
    inputSchema: {
      root: z.string().optional(),
      maxOutputChars: z.number().int().min(500).max(200000).optional(),
    },
  },
  async ({ root, maxOutputChars }: { root?: string; maxOutputChars?: number }) => {
    const project = await introspect(resolve(root ?? process.cwd()));
    const result = await runTests(project);
    const outputLimit = maxOutputChars ?? 30000;

    return text({
      runId: result.run_id,
      projectName: result.project_name,
      target: result.target,
      projectType: result.project_type,
      mode: result.mode,
      summary: result.summary,
      tests: result.tests,
      command: result.raw_output?.command ?? null,
      exitCode: result.raw_output?.exit_code ?? null,
      stdout: limitText(result.raw_output?.stdout ?? "", outputLimit),
      stderr: limitText(result.raw_output?.stderr ?? "", outputLimit),
      outputTruncated: (result.raw_output?.stdout.length ?? 0) > outputLimit || (result.raw_output?.stderr.length ?? 0) > outputLimit,
      resultPaths: result.paths ?? null,
      generatedFiles: result.generated_files ?? [],
    });
  },
);

await server.connect(new StdioServerTransport());

function text(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [{
      type: "text",
      text: JSON.stringify(data, null, 2),
    }],
  };
}

function limitText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n... [truncated ${value.length - maxChars} chars]`;
}
