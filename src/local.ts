/**
 * Local-system readers: /etc/hosts, resolv.conf, WireGuard status, interfaces.
 * This is the part no remote service (globalping) can ever do — and where the
 * config<->live-behaviour correlation wow lives.
 */

import os from "node:os";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { run, runWithInput, hasBinary } from "./runner.js";

export interface HostsEntry {
  ip: string;
  hostnames: string[];
  line: number;
}

export async function readHostsFile(): Promise<HostsEntry[]> {
  const path =
    process.env.NETOPS_HOSTS_FILE ??
    (process.platform === "win32"
      ? "C:\\Windows\\System32\\drivers\\etc\\hosts"
      : "/etc/hosts");
  try {
    const text = await readFile(path, "utf8");
    const out: HostsEntry[] = [];
    text.split(/\r?\n/).forEach((raw, i) => {
      const line = raw.replace(/#.*$/, "").trim();
      if (!line) return;
      const parts = line.split(/\s+/);
      const [ip, ...names] = parts;
      if (ip && names.length) out.push({ ip, hostnames: names, line: i + 1 });
    });
    return out;
  } catch {
    return [];
  }
}

export async function readResolvers(): Promise<string[]> {
  if (process.platform === "win32") {
    const r = await run("powershell", [
      "-NoProfile",
      "-Command",
      "Get-DnsClientServerAddress | Select-Object -ExpandProperty ServerAddresses",
    ], 5000);
    return r.ok ? uniq(r.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)) : [];
  }
  try {
    const text = await readFile("/etc/resolv.conf", "utf8");
    return text
      .split(/\r?\n/)
      .filter((l) => l.trim().startsWith("nameserver"))
      .map((l) => l.split(/\s+/)[1])
      .filter(Boolean);
  } catch {
    return [];
  }
}

export interface WgPeer {
  publicKey: string;
  endpoint?: string;
  allowedIps?: string;
  latestHandshake?: string;
  handshakeAgeSec?: number;
  transfer?: string;
}
export interface WgInterface {
  name: string;
  publicKey?: string;
  listenPort?: string;
  peers: WgPeer[];
}

/** Parse `wg show all dump` if available; otherwise return null (not installed / no perms). */
export async function wgStatus(): Promise<{ interfaces: WgInterface[]; available: boolean; note?: string }> {
  if (!(await hasBinary("wg"))) {
    return { interfaces: [], available: false, note: "wireguard-tools (`wg`) not found on PATH" };
  }
  const r = await run("wg", ["show", "all", "dump"], 5000);
  if (!r.ok) {
    return {
      interfaces: [],
      available: false,
      note: r.stderr.trim() || "could not read wg status (root may be required)",
    };
  }
  const ifaces = new Map<string, WgInterface>();
  for (const line of r.stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const f = line.split("\t");
    const name = f[0];
    // Interface line has 5 fields; peer line has 9 (after the iface name).
    if (f.length === 5) {
      ifaces.set(name, { name, publicKey: f[2], listenPort: f[3], peers: [] });
    } else if (f.length >= 8) {
      const iface = ifaces.get(name) ?? { name, peers: [] };
      const hs = Number(f[5]);
      iface.peers.push({
        publicKey: f[1],
        endpoint: f[3] !== "(none)" ? f[3] : undefined,
        allowedIps: f[4],
        latestHandshake: hs ? new Date(hs * 1000).toISOString() : "never",
        handshakeAgeSec: hs ? Math.round(Date.now() / 1000 - hs) : undefined,
        transfer: `rx ${f[6]} / tx ${f[7]}`,
      });
      ifaces.set(name, iface);
    }
  }
  return { interfaces: [...ifaces.values()], available: true };
}

export interface DomainHit {
  domain: string;
  source: string;
}

const DOMAIN_RE = /\b((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,})\b/gi;
const SKIP = new Set(["example.org", "example.net", "localhost.localdomain"]);
// Last labels that signal a config key / filename, not a real TLD.
const BAD_LAST_LABEL = new Set([
  "rule", "conf", "yml", "yaml", "json", "toml", "ini", "lock", "pid",
  "sock", "bak", "tmpl", "tpl", "dist", "log", "svc", "middlewares",
  "routers", "services", "loadbalancer", "entrypoints",
]);

/** Extract candidate hostnames from nginx / Caddy / Traefik / compose configs. */
export async function extractDomains(paths: string[]): Promise<DomainHit[]> {
  const files: string[] = [];
  for (const p of paths) {
    try {
      const st = await stat(p);
      if (st.isDirectory()) {
        for (const name of await readdir(p)) {
          if (/\.(conf|ya?ml|caddyfile)$/i.test(name) || /caddyfile/i.test(name)) {
            files.push(join(p, name));
          }
        }
      } else {
        files.push(p);
      }
    } catch {
      /* unreadable path — skip */
    }
  }

  const hits = new Map<string, string>();
  for (const file of files) {
    let text: string;
    try {
      text = await readFile(file, "utf8");
    } catch {
      continue;
    }
    const add = (d: string) => {
      const dom = d.trim().toLowerCase().replace(/^\*\./, "");
      const lastLabel = dom.split(".").pop() ?? "";
      if (
        !dom.includes(".") || // must be a FQDN — kills "server", "services"
        dom.includes("*") ||
        dom.startsWith("_") ||
        dom.endsWith(".local") ||
        dom.endsWith(".internal") ||
        dom === "localhost" ||
        SKIP.has(dom) ||
        BAD_LAST_LABEL.has(lastLabel) || // kills config keys like "...app.rule"
        !/^[a-z0-9.-]+$/.test(dom)
      )
        return;
      if (!hits.has(dom)) hits.set(dom, file);
    };

    for (const m of text.matchAll(/server_name\s+([^;]+);/gi)) {
      m[1].split(/\s+/).forEach(add);
    }
    for (const m of text.matchAll(/Host\(`([^`]+)`\)/gi)) add(m[1]);
    for (const m of text.matchAll(/^\s*([a-z0-9.*-]+(?:\s*,\s*[a-z0-9.*-]+)*)\s*\{/gim)) {
      m[1].split(/\s*,\s*/).forEach(add);
    }
    for (const m of text.matchAll(DOMAIN_RE)) add(m[1]);
  }
  return [...hits.entries()].map(([domain, source]) => ({ domain, source }));
}

// ---- WireGuard write helpers (v0.2) ----

export const WG_KEY_RE = /^[A-Za-z0-9+/]{42,43}=$/;
export const WG_IFACE_RE = /^[A-Za-z0-9_.-]{1,15}$/;

/** Generate a fresh WireGuard keypair (private + public). Read-only. */
export async function wgGenKeypair(): Promise<{ privateKey?: string; publicKey?: string; error?: string }> {
  if (!(await hasBinary("wg"))) return { error: "`wg` (wireguard-tools) not found on PATH" };
  const priv = await run("wg", ["genkey"], 4000);
  if (!priv.ok) return { error: priv.stderr.trim() || "wg genkey failed" };
  const privateKey = priv.stdout.trim();
  const pub = await runWithInput("wg", ["pubkey"], privateKey, 4000);
  if (!pub.ok) return { error: pub.stderr.trim() || "wg pubkey failed" };
  return { privateKey, publicKey: pub.stdout.trim() };
}

export interface WgPeerArgs {
  iface: string;
  publicKey: string;
  allowedIps?: string;
  endpoint?: string;
}

/** Build the `wg set` argv for adding/updating or removing a peer (no execution). */
export function buildWgSetArgs(a: WgPeerArgs, remove: boolean): string[] {
  const args = ["set", a.iface, "peer", a.publicKey];
  if (remove) {
    args.push("remove");
    return args;
  }
  if (a.endpoint) args.push("endpoint", a.endpoint);
  if (a.allowedIps) args.push("allowed-ips", a.allowedIps);
  return args;
}

/** Execute a previously built `wg set` command. */
export async function wgSet(args: string[]): Promise<{ ok: boolean; error?: string }> {
  if (!(await hasBinary("wg"))) return { ok: false, error: "`wg` not found on PATH" };
  const r = await run("wg", args, 6000);
  return r.ok ? { ok: true } : { ok: false, error: r.stderr.trim() || `wg exited ${r.code}` };
}

export function interfaces(): Record<string, string[]> {
  const nets = os.networkInterfaces();
  const out: Record<string, string[]> = {};
  for (const [name, addrs] of Object.entries(nets)) {
    out[name] = (addrs ?? []).map((a) => `${a.address}/${a.family}${a.internal ? " (internal)" : ""}`);
  }
  return out;
}

function uniq<T>(a: T[]): T[] {
  return [...new Set(a)];
}
