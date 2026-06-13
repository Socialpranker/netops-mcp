/**
 * Scope-guard layer — the safety core of netops-mcp.
 *
 * Risk #1 for any network-touching MCP is abuse: an LLM told to scan ports or
 * poke arbitrary hosts. This layer keeps the server trustworthy in corp/homelab
 * environments. Read-only by default; mutations require an explicit opt-in;
 * external calls (globalping, egress echo) can be disabled entirely.
 */

import net from "node:net";

export interface GuardConfig {
  /** Allow mutating operations (wg_peer_*, config writes). Default false. */
  allowWrite: boolean;
  /** Disable ALL outbound calls to third-party services (globalping, IP echo). */
  localOnly: boolean;
  /** Max ports allowed in a single tcp_port_check call. */
  maxPortsPerCall: number;
  /** Optional allowlist of targets (hostnames / CIDRs). Empty = allow all. */
  allow: string[];
  /** Optional denylist of targets (hostnames / CIDRs). */
  deny: string[];
  /** Emit an audit line to stderr for every guarded action. */
  audit: boolean;
}

export const DEFAULT_GUARD: GuardConfig = {
  allowWrite: false,
  localOnly: false,
  maxPortsPerCall: 20,
  allow: [],
  deny: [],
  audit: true,
};

export class GuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuardError";
  }
}

export class Guard {
  constructor(public cfg: GuardConfig) {}

  /** Log an action to stderr (never stdout — that's the MCP channel). */
  log(action: string, detail: Record<string, unknown> = {}): void {
    if (!this.cfg.audit) return;
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      action,
      ...detail,
    });
    process.stderr.write(`[netops-audit] ${line}\n`);
  }

  /** Validate a target host/IP against allow/deny lists and basic sanity. */
  checkTarget(target: string): void {
    const t = (target || "").trim();
    if (!t) throw new GuardError("Empty target.");
    // Reject obvious shell metacharacters early (defense in depth; we never use a shell).
    if (/[;&|`$(){}<>\\\s]/.test(t)) {
      throw new GuardError(`Target contains illegal characters: ${target}`);
    }
    if (this.cfg.deny.some((d) => matchTarget(t, d))) {
      throw new GuardError(`Target is on the denylist: ${target}`);
    }
    if (this.cfg.allow.length > 0 && !this.cfg.allow.some((a) => matchTarget(t, a))) {
      throw new GuardError(
        `Target not on allowlist (strict mode). Add it to NETOPS_ALLOW to permit: ${target}`,
      );
    }
  }

  /** Anti-scan: cap port count and forbid sweeps. */
  checkPorts(ports: number[]): void {
    if (ports.length === 0) throw new GuardError("No ports specified.");
    if (ports.length > this.cfg.maxPortsPerCall) {
      throw new GuardError(
        `Refusing to check ${ports.length} ports in one call (cap ${this.cfg.maxPortsPerCall}). ` +
          `This server does connectivity checks of specific ports, not discovery scans.`,
      );
    }
    for (const p of ports) {
      if (!Number.isInteger(p) || p < 1 || p > 65535) {
        throw new GuardError(`Invalid port: ${p}`);
      }
    }
  }

  /** Gate for mutating operations. */
  assertWriteEnabled(op: string): void {
    if (!this.cfg.allowWrite) {
      throw new GuardError(
        `Operation "${op}" mutates state and is disabled. Start the server with --enable-write to allow it.`,
      );
    }
  }

  /** Gate for outbound third-party calls. */
  assertNetworkAllowed(service: string): void {
    if (this.cfg.localOnly) {
      throw new GuardError(
        `External service "${service}" is disabled in --local-only mode.`,
      );
    }
  }
}

/** Very small matcher: exact host, suffix wildcard (*.example.com), or CIDR for IPs. */
function matchTarget(target: string, rule: string): boolean {
  if (rule === target) return true;
  if (rule.startsWith("*.")) {
    return target.endsWith(rule.slice(1)); // ".example.com"
  }
  if (rule.includes("/") && net.isIP(target)) {
    return cidrContains(rule, target);
  }
  return false;
}

function cidrContains(cidr: string, ip: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  if (net.isIPv4(range) && net.isIPv4(ip) && bits >= 0 && bits <= 32) {
    const a = ipv4ToInt(range);
    const b = ipv4ToInt(ip);
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (a & mask) === (b & mask);
  }
  // IPv6 CIDR matching omitted in v0.1; conservatively no match.
  return false;
}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

/** Build a Guard from environment variables + CLI flags. */
export function guardFromEnv(argv: string[]): Guard {
  const cfg: GuardConfig = { ...DEFAULT_GUARD };
  if (argv.includes("--enable-write")) cfg.allowWrite = true;
  if (argv.includes("--local-only")) cfg.localOnly = true;
  if (argv.includes("--no-audit")) cfg.audit = false;

  const env = process.env;
  if (env.NETOPS_ALLOW) cfg.allow = splitList(env.NETOPS_ALLOW);
  if (env.NETOPS_DENY) cfg.deny = splitList(env.NETOPS_DENY);
  if (env.NETOPS_MAX_PORTS) {
    const n = Number(env.NETOPS_MAX_PORTS);
    if (Number.isFinite(n) && n > 0) cfg.maxPortsPerCall = Math.floor(n);
  }
  if (env.NETOPS_LOCAL_ONLY === "1") cfg.localOnly = true;
  if (env.NETOPS_ENABLE_WRITE === "1") cfg.allowWrite = true;
  return new Guard(cfg);
}

function splitList(s: string): string[] {
  return s
    .split(/[, ]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}
