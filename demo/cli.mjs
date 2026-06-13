#!/usr/bin/env node
// Scripted demo that drives the REAL netops-mcp server end-to-end so VHS can
// record an authentic terminal session. The config_correlate punchline is a
// genuine tool call against demo/hosts.fixture; the two probe rows are scripted
// to keep the recording deterministic offline.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const c = {
  r: "\x1b[0m", dim: "\x1b[2m",
  cyan: "\x1b[38;5;75m", green: "\x1b[38;5;42m", red: "\x1b[38;5;203m",
  amber: "\x1b[38;5;179m", gray: "\x1b[38;5;245m", white: "\x1b[97m",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = (s) => process.stdout.write(s);
async function type(s, d = 45) { for (const ch of s) { out(ch); await sleep(d); } }

// --- minimal MCP stdio client ---
const srv = spawn("node", [join(root, "dist/index.js")], {
  stdio: ["pipe", "pipe", "ignore"],
  env: { ...process.env, NETOPS_HOSTS_FILE: join(root, "demo/hosts.fixture"), NETOPS_LOCAL_ONLY: "1" },
});
let buf = ""; const pending = new Map(); let id = 0;
srv.stdout.on("data", (d) => {
  buf += d.toString(); let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    try { const m = JSON.parse(line); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } } catch {}
  }
});
const rpc = (method, params) => new Promise((res) => {
  const myId = ++id; pending.set(myId, res);
  srv.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: myId, method, params }) + "\n");
});
const notify = (method, params) => srv.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");

await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "demo", version: "0" } });
notify("notifications/initialized", {});

// --- the money shot ---
out("\n");
out(`${c.green}❯${c.r} `);
await type(`${c.white}why can't I reach api.acme.dev?${c.r}`);
out("\n\n");
await sleep(500);

out(`${c.cyan}net_diagnose${c.r}     ${c.gray}DNS ${c.green}✓${c.gray}  TCP ${c.red}✗ timeout @10.0.0.5${c.r}\n`);
await sleep(650);
out(`${c.cyan}net_triangulate${c.r}  ${c.gray}you ${c.red}✗${c.gray}   US ${c.green}✓${c.gray}  EU ${c.green}✓${c.gray}  Asia ${c.green}✓${c.r}\n`);
await sleep(650);

const cc = await rpc("tools/call", { name: "config_correlate", arguments: { domain: "api.acme.dev" } });
const finding = (cc.result?.structuredContent?.findings?.[0]) || cc.result?.content?.[0]?.text || "";
out(`${c.cyan}config_correlate${c.r} ${c.gray}/etc/hosts:2  api.acme.dev → ${c.amber}10.0.0.5${c.r}\n`);
await sleep(800);

out("\n");
out(`${c.amber}┃ ❯ It's your side.${c.r}\n`);
out(`${c.amber}┃${c.r} ${c.white}${finding.replace(/\s+/g, " ").slice(0, 78)}${c.r}\n`);
out(`${c.amber}┃${c.r} ${c.white}It's live from US, EU & Asia — remove that line.${c.r}\n`);
out(`${c.amber}┃${c.r} ${c.gray}— one diagnosis · local-first · zero telemetry${c.r}\n\n`);

await sleep(400);
srv.kill();
process.exit(0);
