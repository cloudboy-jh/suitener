# suitener-mcp

MCP server exposing Suitener as tools any agent can call over stdio.

## Tools

- `suitener_introspect`
  - Detects project type, test files, and test command.
  - Input: `{ root?: string }`
- `suitener_run_tests`
  - Runs tests with Suitener and returns structured summary + logs.
  - Input: `{ root?: string, maxOutputChars?: number }`

## Run

```bash
bun run packages/mcp/src/index.ts
```

## Example MCP config

```json
{
  "mcpServers": {
    "suitener": {
      "command": "bun",
      "args": ["run", "C:/absolute/path/to/suitener/packages/mcp/src/index.ts"]
    }
  }
}
```
