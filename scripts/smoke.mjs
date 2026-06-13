#!/usr/bin/env node
// Smoke test: boot the built server, run the MCP initialize + tools/list
// handshake over stdio, and assert the expected tool surface. Exit non-zero
// on any failure so CI fails loudly. Runs with --local-only so it never
// touches the network.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_TOOLS = 19;

const child = spawn("node", [join(root, "dist/index.js"), "--local-only"], {
  stdio: ["pipe", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";
const responses = new Map();

child.stdout.on("data", (d) => {
  stdout += d.toString();
  let i;
  while ((i = stdout.indexOf("\n")) >= 0) {
    const line = stdout.slice(0, i).trim();
    stdout = stdout.slice(i + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id !== undefined) responses.set(msg.id, msg);
    } catch {
      // stray non-JSON line on stdout — ignore
    }
  }
});
child.stderr.on("data", (d) => (stderr += d.toString()));

const send = (obj) => child.stdin.write(JSON.stringify(obj) + "\n");

const waitFor = (id, timeoutMs = 8000) =>
  new Promise((resolve, reject) => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (responses.has(id)) {
        clearInterval(iv);
        resolve(responses.get(id));
      } else if (Date.now() - t0 > timeoutMs) {
        clearInterval(iv);
        reject(new Error(`timeout waiting for response id=${id}`));
      }
    }, 25);
  });

const die = (msg) => {
  console.error(`✗ smoke failed: ${msg}`);
  if (stderr.trim()) console.error(`--- server stderr ---\n${stderr}`);
  try { child.kill("SIGKILL"); } catch {}
  process.exit(1);
};

child.on("error", (e) => die(`could not spawn server: ${e.message}`));

(async () => {
  send({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "smoke", version: "0.0.0" },
    },
  });
  const init = await waitFor(1).catch(die);
  if (!init?.result?.serverInfo?.name) die(`bad initialize result: ${JSON.stringify(init)}`);

  send({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
  send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  const list = await waitFor(2).catch(die);

  const tools = list?.result?.tools;
  if (!Array.isArray(tools)) die(`tools/list returned no tools array: ${JSON.stringify(list)}`);
  if (tools.length !== EXPECTED_TOOLS)
    die(`expected ${EXPECTED_TOOLS} tools, got ${tools.length}: ${tools.map((t) => t.name).join(", ")}`);

  console.log(`✓ ${init.result.serverInfo.name} v${init.result.serverInfo.version} — ${tools.length} tools listed over stdio`);
  try { child.kill("SIGTERM"); } catch {}
  setTimeout(() => { try { child.kill("SIGKILL"); } catch {} process.exit(0); }, 300);
})();

setTimeout(() => die("overall timeout (15s)"), 15000);
