/**
 * Low-level reusable network probes. Pure Node where possible (works without
 * root); system-tool fallbacks where it matters. Every probe returns a plain
 * structured object so tools and the orchestrator can share them.
 */

import net from "node:net";
import tls from "node:tls";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import { run, hasBinary } from "./runner.js";

const resolver = new dns.promises.Resolver();

export interface DnsResult {
  name: string;
  type: string;
  server?: string;
  records: string[];
  ms: number;
  error?: string;
}

export async function resolveDns(
  name: string,
  type = "A",
  server?: string,
): Promise<DnsResult> {
  const r = server ? new dns.promises.Resolver() : resolver;
  if (server) r.setServers([server]);
  const start = performance.now();
  try {
    const records = (await (r.resolve(name, type as any) as Promise<unknown>)) as unknown;
    const flat = Array.isArray(records)
      ? records.map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
      : [JSON.stringify(records)];
    return { name, type, server, records: flat, ms: round(performance.now() - start) };
  } catch (e) {
    return {
      name,
      type,
      server,
      records: [],
      ms: round(performance.now() - start),
      error: errMsg(e),
    };
  }
}

export interface TcpResult {
  host: string;
  port: number;
  open: boolean;
  ms: number;
  error?: string;
}

export function tcpConnect(host: string, port: number, timeoutMs = 5000): Promise<TcpResult> {
  return new Promise((resolve) => {
    const start = performance.now();
    const sock = new net.Socket();
    let done = false;
    const finish = (open: boolean, error?: string) => {
      if (done) return;
      done = true;
      sock.destroy();
      resolve({ host, port, open, ms: round(performance.now() - start), error });
    };
    sock.setTimeout(timeoutMs);
    sock.once("connect", () => finish(true));
    sock.once("timeout", () => finish(false, "timeout"));
    sock.once("error", (e) => finish(false, errMsg(e)));
    sock.connect(port, host);
  });
}

export interface TlsResult {
  host: string;
  port: number;
  ok: boolean;
  handshakeMs?: number;
  protocol?: string | null;
  cipher?: string;
  subject?: string;
  issuer?: string;
  altNames?: string;
  validFrom?: string;
  validTo?: string;
  daysToExpiry?: number;
  authorized?: boolean;
  authorizationError?: string;
  error?: string;
}

export function tlsInspect(host: string, port = 443, timeoutMs = 8000): Promise<TlsResult> {
  return new Promise((resolve) => {
    const start = performance.now();
    const sock = tls.connect(
      { host, port, servername: host, rejectUnauthorized: false, timeout: timeoutMs },
      () => {
        const handshakeMs = round(performance.now() - start);
        const cert = sock.getPeerCertificate();
        const cipher = sock.getCipher();
        const validTo = cert?.valid_to;
        const days = validTo
          ? Math.round((new Date(validTo).getTime() - Date.now()) / 86400000)
          : undefined;
        resolve({
          host,
          port,
          ok: true,
          handshakeMs,
          protocol: sock.getProtocol(),
          cipher: cipher?.name,
          subject: cert?.subject ? Object.values(cert.subject).join(", ") : undefined,
          issuer: cert?.issuer ? Object.values(cert.issuer).join(", ") : undefined,
          altNames: (cert as any)?.subjectaltname,
          validFrom: cert?.valid_from,
          validTo,
          daysToExpiry: days,
          authorized: sock.authorized,
          authorizationError: sock.authorizationError
            ? String(sock.authorizationError)
            : undefined,
        });
        sock.end();
      },
    );
    sock.once("timeout", () => {
      sock.destroy();
      resolve({ host, port, ok: false, error: "timeout" });
    });
    sock.once("error", (e) => {
      resolve({ host, port, ok: false, error: errMsg(e) });
    });
  });
}

export interface HttpResult {
  url: string;
  ok: boolean;
  status?: number;
  statusText?: string;
  finalUrl?: string;
  redirects?: number;
  timing?: { dnsMs?: number; connectMs?: number; tlsMs?: number; ttfbMs?: number; totalMs?: number };
  server?: string;
  error?: string;
  localAddress?: string;
}

export function httpProbe(
  rawUrl: string,
  opts: { timeoutMs?: number; localAddress?: string; maxRedirects?: number } = {},
): Promise<HttpResult> {
  const timeoutMs = opts.timeoutMs ?? 10000;
  const maxRedirects = opts.maxRedirects ?? 5;
  let redirects = 0;

  const attempt = (urlStr: string): Promise<HttpResult> =>
    new Promise((resolve) => {
      let url: URL;
      try {
        url = new URL(urlStr);
      } catch {
        return resolve({ url: urlStr, ok: false, error: "invalid URL" });
      }
      const isHttps = url.protocol === "https:";
      const lib = isHttps ? https : http;
      const t0 = performance.now();
      let tDns = 0, tConnect = 0, tTls = 0, tFirstByte = 0;

      const req = lib.request(
        url,
        {
          method: "GET",
          timeout: timeoutMs,
          localAddress: opts.localAddress,
          servername: isHttps ? url.hostname : undefined,
        },
        (res) => {
          tFirstByte = performance.now();
          const status = res.statusCode ?? 0;
          if (status >= 300 && status < 400 && res.headers.location && redirects < maxRedirects) {
            redirects++;
            res.resume();
            const next = new URL(res.headers.location, url).toString();
            resolve(attempt(next));
            return;
          }
          res.resume();
          res.once("end", () => {
            resolve({
              url: rawUrl,
              ok: status > 0,
              status,
              statusText: res.statusMessage,
              finalUrl: url.toString(),
              redirects,
              server: res.headers.server as string | undefined,
              localAddress: opts.localAddress,
              timing: {
                dnsMs: tDns ? round(tDns - t0) : undefined,
                connectMs: tConnect ? round(tConnect - (tDns || t0)) : undefined,
                tlsMs: tTls ? round(tTls - (tConnect || t0)) : undefined,
                ttfbMs: round(tFirstByte - t0),
                totalMs: round(performance.now() - t0),
              },
            });
          });
        },
      );
      req.on("socket", (socket) => {
        socket.once("lookup", () => (tDns = performance.now()));
        socket.once("connect", () => (tConnect = performance.now()));
        socket.once("secureConnect", () => (tTls = performance.now()));
      });
      req.once("timeout", () => {
        req.destroy();
        resolve({ url: rawUrl, ok: false, error: "timeout", redirects, localAddress: opts.localAddress });
      });
      req.once("error", (e) =>
        resolve({ url: rawUrl, ok: false, error: errMsg(e), redirects, localAddress: opts.localAddress }),
      );
      req.end();
    });

  return attempt(rawUrl);
}

export interface PingResult {
  host: string;
  reachable: boolean;
  method: "icmp" | "tcp";
  rttMs?: number;
  detail?: string;
}

/** ICMP via system ping; falls back to TCP-ping (connect to a common port) without root. */
export async function pingHost(host: string, tcpFallbackPort = 443): Promise<PingResult> {
  if (await hasBinary("ping")) {
    const args =
      process.platform === "win32" ? ["-n", "1", "-w", "3000", host] : ["-c", "1", "-W", "3", host];
    const r = await run("ping", args, 6000);
    if (r.ok) {
      const m = r.stdout.match(/time[=<]\s*([\d.]+)\s*ms/i);
      return { host, reachable: true, method: "icmp", rttMs: m ? Number(m[1]) : undefined };
    }
  }
  const tcp = await tcpConnect(host, tcpFallbackPort, 5000);
  return {
    host,
    reachable: tcp.open,
    method: "tcp",
    rttMs: tcp.open ? tcp.ms : undefined,
    detail: `TCP-ping to ${host}:${tcpFallbackPort}${tcp.open ? "" : ` failed (${tcp.error})`}`,
  };
}

export interface TraceHop {
  hop: number;
  host: string;
  rttMs?: number;
}
export interface TraceResult {
  host: string;
  supported: boolean;
  hops: TraceHop[];
  raw?: string;
  detail?: string;
}

/** Trace the path to a host. Wraps system traceroute/tracert; light-parses hops. */
export async function tracePath(host: string, maxHops = 20): Promise<TraceResult> {
  const win = process.platform === "win32";
  const bin = win ? "tracert" : "traceroute";
  if (!(await hasBinary(bin))) {
    return { host, supported: false, hops: [], detail: `\`${bin}\` not available on PATH` };
  }
  const args = win
    ? ["-h", String(maxHops), "-w", "2000", host]
    : ["-n", "-m", String(maxHops), "-w", "2", "-q", "1", host];
  const r = await run(bin, args, 30000);
  const hops: TraceHop[] = [];
  for (const line of r.stdout.split(/\r?\n/)) {
    const m = line.match(/^\s*(\d+)\s+(.*)$/);
    if (!m) continue;
    const hopNum = Number(m[1]);
    const rest = m[2].trim();
    if (/^\*/.test(rest) || rest === "*") {
      hops.push({ hop: hopNum, host: "*" });
      continue;
    }
    const ip = rest.match(/(\d{1,3}(?:\.\d{1,3}){3}|[0-9a-f:]{3,})/i);
    const ms = rest.match(/([\d.]+)\s*ms/);
    hops.push({ hop: hopNum, host: ip ? ip[1] : rest.split(/\s+/)[0], rttMs: ms ? Number(ms[1]) : undefined });
  }
  return { host, supported: true, hops, raw: r.stdout.trim() };
}

export interface MtuResult {
  host: string;
  supported: boolean;
  pathMtu?: number;
  largestPayload?: number;
  blackhole: boolean;
  detail: string;
  samples?: { payload: number; passed: boolean }[];
}

/**
 * Path-MTU discovery via Don't-Fragment pings of increasing size. Detects the
 * classic MTU black hole: small packets pass, large packets vanish with no ICMP
 * "fragmentation needed" reply — the reason SSH connects but then freezes over a
 * VPN/PPPoE link. Binary-searches the largest payload that traverses the path.
 */
export async function mtuProbe(host: string, low = 1200, high = 1472): Promise<MtuResult> {
  if (!(await hasBinary("ping"))) {
    return { host, supported: false, blackhole: false, detail: "system `ping` not available" };
  }
  const samples: { payload: number; passed: boolean }[] = [];
  const dfPing = async (size: number): Promise<"pass" | "fail" | "local"> => {
    let args: string[];
    if (process.platform === "win32") args = ["-f", "-l", String(size), "-n", "1", "-w", "2000", host];
    else if (process.platform === "darwin") args = ["-D", "-s", String(size), "-c", "1", "-t", "2", host];
    else args = ["-M", "do", "-s", String(size), "-c", "1", "-W", "2", host];
    const r = await run("ping", args, 5000);
    const out = `${r.stdout}\n${r.stderr}`.toLowerCase();
    if (/message too long|local error|cannot fragment/.test(out)) return "local";
    if (r.ok && /(\d+) bytes from|ttl=|time[=<]/i.test(out)) return "pass";
    return "fail";
  };

  // Baseline: does the smallest size even pass? If not, MTU test is inconclusive.
  const base = await dfPing(low);
  samples.push({ payload: low, passed: base === "pass" });
  if (base !== "pass") {
    return {
      host,
      supported: true,
      blackhole: false,
      detail:
        base === "local"
          ? `Local interface MTU is below ${low + 28} bytes; can't send DF packets that large from here.`
          : `Host did not answer even a ${low}-byte DF ping — unreachable or ICMP filtered; MTU test inconclusive.`,
      samples,
    };
  }

  let lo = low, hi = high, best = low, sawFail = false;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const res = await dfPing(mid);
    samples.push({ payload: mid, passed: res === "pass" });
    if (res === "pass") {
      best = mid;
      lo = mid + 1;
    } else {
      if (res === "fail") sawFail = true;
      hi = mid - 1;
    }
  }
  const pathMtu = best + 28; // IPv4 header (20) + ICMP header (8)
  const blackhole = sawFail && best < high;
  const detail = blackhole
    ? `MTU black hole: ${best + 28}-byte packets pass but larger ones are silently dropped (no ICMP frag-needed). Clamp MSS / set interface MTU to ${pathMtu}. This is the classic "connects then hangs on big transfers" over VPN/PPPoE.`
    : best >= high
      ? `Full ${pathMtu}-byte path MTU — no fragmentation issue detected.`
      : `Path MTU ~${pathMtu} bytes (largest DF payload ${best}). Failures looked like local interface limits, not a black hole.`;
  return { host, supported: true, pathMtu, largestPayload: best, blackhole, detail, samples };
}

// ---- helpers ----
export function round(n: number): number {
  return Math.round(n * 10) / 10;
}
export function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
