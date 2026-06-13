#!/usr/bin/env node
/**
 * netops-mcp — local-first network diagnostics & tunnel/proxy MCP server.
 *
 * Flags:
 *   --local-only     disable all third-party calls (globalping, egress echo)
 *   --enable-write   allow mutating operations (reserved for v0.2 wg writes)
 *   --no-audit       silence the stderr audit log
 *
 * Env: NETOPS_ALLOW, NETOPS_DENY (host/CIDR lists), NETOPS_MAX_PORTS,
 *      NETOPS_LOCAL_ONLY=1, NETOPS_ENABLE_WRITE=1
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { guardFromEnv } from "./guard.js";
import { registerTools } from "./tools.js";

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const guard = guardFromEnv(argv);

  const server = new McpServer({
    name: "netops-mcp",
    version: "0.1.0",
  });

  registerTools(server, guard);

  guard.log("startup", {
    localOnly: guard.cfg.localOnly,
    allowWrite: guard.cfg.allowWrite,
    allow: guard.cfg.allow,
    deny: guard.cfg.deny,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[netops] netops-mcp v0.1.0 ready on stdio\n");
}

main().catch((e) => {
  process.stderr.write(`[netops] fatal: ${e?.stack ?? e}\n`);
  process.exit(1);
});
