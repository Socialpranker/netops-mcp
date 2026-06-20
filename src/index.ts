#!/usr/bin/env node
/**
 * netops-mcp — local-first network diagnostics & tunnel/proxy MCP server.
 *
 * Flags:
 *   --local-only     disable all third-party calls (globalping, egress echo)
 *   --enable-write   allow mutating WireGuard ops (wg_peer_add/remove; still dry-run
 *                    unless confirm:true)
 *   --no-audit       silence the stderr audit log
 *
 * Env: NETOPS_ALLOW, NETOPS_DENY (host/CIDR lists), NETOPS_MAX_PORTS,
 *      NETOPS_LOCAL_ONLY, NETOPS_ENABLE_WRITE (truthy: 1/true/yes/on)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { guardFromEnv } from "./guard.js";
import { registerTools } from "./tools.js";

/** Single source of the version string within this file. Keep in sync with package.json. */
const VERSION = "0.1.0";

/**
 * Server-level guidance handed to the model on connect, so it knows when to reach
 * for which tool instead of guessing. Kept in the same voice as the tool descriptions.
 */
const INSTRUCTIONS = `netops-mcp runs network diagnostics locally, on the user's own machine —
it sees their /etc/hosts, VPN, WireGuard and local resolvers, which remote/cloud probes cannot.

Start with net_diagnose for any "why can't I reach X" question: it walks DNS -> ping -> TCP -> TLS -> HTTP
and returns a verdict on where the failure is, instead of raw output. For "is it me or them?", use
net_triangulate — it compares the local result against worldwide Globalping probes. To produce a
shareable bug-ticket report, use diagnosis_bundle. Reach for the single probes (dns_lookup, net_ping,
tcp_port_check, tls_inspect, http_probe, traceroute, mtu_blackhole, cert_sweep) only when you need one
specific layer. For tunnels: tunnel_diff and dns_leak_check catch split-tunnel/DNS leaks; wg_status and
net_overview give a read-only WireGuard snapshot.

Prefer the orchestrators (net_diagnose, net_triangulate, diagnosis_bundle) over chaining single probes by
hand. Every verdict ships with the raw probe data beneath it — surface that data, do not ask the user to
trust the verdict on its own. The server is read-only by default; the WireGuard write tools (wg_peer_add,
wg_peer_remove) are gated behind a flag and dry-run unless explicitly confirmed.`;

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const guard = guardFromEnv(argv);

  const server = new McpServer(
    {
      name: "netops-mcp",
      version: VERSION,
    },
    { instructions: INSTRUCTIONS },
  );

  registerTools(server, guard);

  guard.log("startup", {
    localOnly: guard.cfg.localOnly,
    allowWrite: guard.cfg.allowWrite,
    allow: guard.cfg.allow,
    deny: guard.cfg.deny,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`[netops] netops-mcp v${VERSION} ready on stdio\n`);
}

main().catch((e) => {
  process.stderr.write(`[netops] fatal: ${e?.stack ?? e}\n`);
  process.exit(1);
});
