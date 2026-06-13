/**
 * Tool registrations. Each tool returns a human summary (content) AND machine
 * structuredContent. Probes are shared via ./probes; local readers via ./local.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import net from "node:net";
import { Guard, GuardError } from "./guard.js";
import {
  resolveDns,
  tcpConnect,
  tlsInspect,
  httpProbe,
  pingHost,
  mtuProbe,
  tracePath,
  round,
} from "./probes.js";
import { globalpingTest, egressIp } from "./globalping.js";
import {
  readHostsFile,
  readResolvers,
  wgStatus,
  interfaces,
  extractDomains,
  wgGenKeypair,
  buildWgSetArgs,
  wgSet,
  WG_KEY_RE,
  WG_IFACE_RE,
} from "./local.js";

type ToolReturn = {
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

function ok(summary: string, data: Record<string, unknown>): ToolReturn {
  return { content: [{ type: "text", text: summary }], structuredContent: data };
}
function fail(summary: string, data: Record<string, unknown> = {}): ToolReturn {
  return { content: [{ type: "text", text: summary }], structuredContent: data, isError: true };
}
function guardWrap(fn: () => Promise<ToolReturn>): Promise<ToolReturn> {
  return fn().catch((e) =>
    e instanceof GuardError ? fail(`Blocked by scope-guard: ${e.message}`) : fail(`Error: ${e?.message ?? e}`),
  );
}

// Wrap network-derived text (DNS records, reverse-DNS hostnames, cert fields,
// HTTP status/headers) before it enters the model-visible `content`. These are
// attacker-controllable and могут содержать prompt-injection payloads. The
// delimiter marks them as untrusted data, not instructions. See SECURITY.md.
function untrusted(s: string): string {
  // Collapse newlines/control chars that could break out of the marker, cap length.
  const clean = s.replace(/[\r\n -]+/g, " ").slice(0, 512);
  return `⟦untrusted:${clean}⟧`;
}

function hostFromTarget(target: string): string {
  try {
    if (target.includes("://")) return new URL(target).hostname;
  } catch {
    /* not a url */
  }
  return target.replace(/^.*@/, "").split("/")[0];
}

export function registerTools(server: McpServer, guard: Guard): void {
  // ---- diagnostics ----------------------------------------------------------

  server.registerTool(
    "dns_lookup",
    {
      title: "DNS lookup",
      description:
        "Resolve DNS records for a name. Supports A/AAAA/MX/TXT/NS/CNAME/SOA and an optional custom resolver.",
      inputSchema: {
        name: z.string().describe("hostname to resolve"),
        type: z.string().optional().describe("record type (default A)"),
        server: z.string().optional().describe("custom DNS resolver IP"),
      },
    },
    async ({ name, type, server: dnsServer }) =>
      guardWrap(async () => {
        guard.checkTarget(name);
        if (dnsServer) guard.checkTarget(dnsServer);
        guard.log("dns_lookup", { name, type, dnsServer });
        const r = await resolveDns(name, type ?? "A", dnsServer);
        const summary = r.error
          ? `DNS ${type ?? "A"} ${name} failed: ${r.error}`
          : `${name} ${type ?? "A"} -> ${r.records.length ? untrusted(r.records.join(", ")) : "(none)"} (${r.ms}ms${dnsServer ? ` via ${dnsServer}` : ""})`;
        return ok(summary, r as unknown as Record<string, unknown>);
      }),
  );

  server.registerTool(
    "net_ping",
    {
      title: "Ping host",
      description:
        "Reachability check. Uses ICMP ping when available, falls back to a TCP connect (works without root).",
      inputSchema: {
        host: z.string().describe("host to ping"),
        tcp_port: z.number().optional().describe("port for TCP-ping fallback (default 443)"),
      },
    },
    async ({ host, tcp_port }) =>
      guardWrap(async () => {
        guard.checkTarget(host);
        guard.log("net_ping", { host });
        const r = await pingHost(host, tcp_port ?? 443);
        const summary = r.reachable
          ? `${host} reachable via ${r.method}${r.rttMs != null ? ` (${r.rttMs}ms)` : ""}`
          : `${host} NOT reachable (${r.method}${r.detail ? `: ${r.detail}` : ""})`;
        return ok(summary, r as unknown as Record<string, unknown>);
      }),
  );

  server.registerTool(
    "tcp_port_check",
    {
      title: "TCP port check",
      description:
        "Check whether specific TCP ports on a host accept connections. This is a connectivity check of named ports — NOT a discovery scan. Capped by scope-guard.",
      inputSchema: {
        host: z.string().describe("target host"),
        ports: z.array(z.number()).describe("list of ports to check"),
      },
    },
    async ({ host, ports }) =>
      guardWrap(async () => {
        guard.checkTarget(host);
        guard.checkPorts(ports);
        guard.log("tcp_port_check", { host, ports });
        const results = await Promise.all(ports.map((p) => tcpConnect(host, p, 5000)));
        const open = results.filter((r) => r.open).map((r) => r.port);
        const closed = results.filter((r) => !r.open).map((r) => r.port);
        const summary = `${host}: open [${open.join(", ") || "-"}], closed/filtered [${closed.join(", ") || "-"}]`;
        return ok(summary, { host, results });
      }),
  );

  server.registerTool(
    "tls_inspect",
    {
      title: "TLS / certificate inspect",
      description:
        "Open a TLS connection and report certificate chain, expiry (days), SANs, protocol, cipher, handshake timing, and validation status.",
      inputSchema: {
        host: z.string().describe("host"),
        port: z.number().optional().describe("port (default 443)"),
      },
    },
    async ({ host, port }) =>
      guardWrap(async () => {
        guard.checkTarget(host);
        guard.log("tls_inspect", { host, port });
        const r = await tlsInspect(host, port ?? 443);
        if (!r.ok) return fail(`TLS to ${host}:${port ?? 443} failed: ${r.error}`, r as any);
        const exp =
          r.daysToExpiry != null
            ? r.daysToExpiry < 0
              ? `EXPIRED ${-r.daysToExpiry}d ago`
              : `${r.daysToExpiry}d left`
            : "unknown expiry";
        const valid = r.authorized ? "valid chain" : `INVALID: ${untrusted(String(r.authorizationError ?? "unknown"))}`;
        return ok(
          `${host}:${r.port} ${r.protocol} ${r.cipher}, cert ${exp}, ${valid}, handshake ${r.handshakeMs}ms`,
          r as unknown as Record<string, unknown>,
        );
      }),
  );

  server.registerTool(
    "http_probe",
    {
      title: "HTTP probe",
      description:
        "GET a URL and report status, redirect chain, server header, and a timing breakdown (DNS / connect / TLS / TTFB / total).",
      inputSchema: {
        url: z.string().describe("URL to probe"),
      },
    },
    async ({ url }) =>
      guardWrap(async () => {
        guard.checkTarget(hostFromTarget(url));
        guard.log("http_probe", { url });
        const r = await httpProbe(url);
        if (!r.ok) return fail(`HTTP ${url} failed: ${r.error}`, r as any);
        return ok(
          `HTTP ${r.status} ${r.statusText ? untrusted(r.statusText) : ""} ${url}${r.redirects ? ` (${r.redirects} redirects)` : ""}, TTFB ${r.timing?.ttfbMs}ms total ${r.timing?.totalMs}ms`,
          r as unknown as Record<string, unknown>,
        );
      }),
  );

  server.registerTool(
    "traceroute",
    {
      title: "Traceroute",
      description: "Trace the network path to a host hop by hop, with per-hop latency. Wraps system traceroute/tracert.",
      inputSchema: {
        host: z.string().describe("destination host"),
        max_hops: z.number().optional().describe("max hops (default 20)"),
      },
    },
    async ({ host, max_hops }) =>
      guardWrap(async () => {
        guard.checkTarget(host);
        guard.log("traceroute", { host });
        const r = await tracePath(host, max_hops ?? 20);
        if (!r.supported) return fail(`Traceroute unavailable: ${r.detail}`, r as any);
        const last = r.hops[r.hops.length - 1];
        const reached = last && last.host !== "*";
        const summary =
          `${r.hops.length} hops to ${host}${reached ? ` (last: ${untrusted(last.host)}${last.rttMs != null ? ` ${last.rttMs}ms` : ""})` : " (did not complete)"}\n` +
          r.hops.map((h) => `  ${h.hop}. ${h.host === "*" ? "*" : untrusted(h.host)}${h.rttMs != null ? `  ${h.rttMs}ms` : ""}`).join("\n");
        return ok(summary, r as unknown as Record<string, unknown>);
      }),
  );

  server.registerTool(
    "mtu_blackhole",
    {
      title: "MTU black-hole detector",
      description:
        "Path-MTU discovery via Don't-Fragment pings. Detects the classic MTU black hole — small packets pass, large ones vanish with no ICMP reply — the reason connections establish but then hang on big transfers over VPN/PPPoE links.",
      inputSchema: {
        host: z.string().describe("host to probe the path MTU to"),
      },
    },
    async ({ host }) =>
      guardWrap(async () => {
        guard.checkTarget(host);
        guard.log("mtu_blackhole", { host });
        const r = await mtuProbe(host);
        if (!r.supported) return fail(`MTU probe unavailable: ${r.detail}`, r as any);
        return ok(r.detail, r as unknown as Record<string, unknown>);
      }),
  );

  server.registerTool(
    "cert_sweep",
    {
      title: "TLS certificate sweep",
      description:
        "Check TLS certificate expiry across many domains at once. Pass an explicit list, and/or config paths (nginx/Caddy/Traefik/compose files or dirs) to auto-extract the domains. Sorts by soonest expiry and flags certs expiring within warn_days.",
      inputSchema: {
        domains: z.array(z.string()).optional().describe("explicit domains to check"),
        paths: z.array(z.string()).optional().describe("config files/dirs to extract domains from"),
        warn_days: z.number().optional().describe("flag certs expiring within N days (default 21)"),
        port: z.number().optional().describe("TLS port (default 443)"),
      },
    },
    async ({ domains, paths, warn_days, port }) =>
      guardWrap(async () => {
        const warn = warn_days ?? 21;
        const p = port ?? 443;
        guard.log("cert_sweep", { domains, paths, warn });
        const set = new Map<string, string>();
        for (const d of domains ?? []) set.set(d.toLowerCase(), "(explicit)");
        if (paths && paths.length) {
          for (const hit of await extractDomains(paths)) {
            if (!set.has(hit.domain)) set.set(hit.domain, hit.source);
          }
        }
        const list = [...set.keys()];
        if (list.length === 0) {
          return fail("No domains to check. Provide `domains` and/or `paths` to extract from.");
        }
        for (const d of list) guard.checkTarget(d);

        const checked = await Promise.all(
          list.map(async (d) => {
            const r = await tlsInspect(d, p);
            return {
              domain: d,
              source: set.get(d),
              ok: r.ok,
              daysToExpiry: r.daysToExpiry,
              validTo: r.validTo,
              authorized: r.authorized,
              error: r.error,
            };
          }),
        );
        checked.sort((a, b) => {
          const av = a.daysToExpiry ?? (a.ok ? 1e9 : -1e9);
          const bv = b.daysToExpiry ?? (b.ok ? 1e9 : -1e9);
          return av - bv;
        });

        const lines = checked.map((c) => {
          if (!c.ok) return `  ✗ ${c.domain} — unreachable (${untrusted(String(c.error ?? "error"))})`;
          if (c.daysToExpiry == null) return `  ? ${c.domain} — no expiry info`;
          if (c.daysToExpiry < 0) return `  ⚠ ${c.domain} — EXPIRED ${-c.daysToExpiry}d ago (${untrusted(String(c.validTo))})`;
          if (c.daysToExpiry <= warn) return `  ⚠ ${c.domain} — expires in ${c.daysToExpiry}d (${untrusted(String(c.validTo))})`;
          return `  ✓ ${c.domain} — ${c.daysToExpiry}d left`;
        });
        const flagged = checked.filter(
          (c) => c.ok && c.daysToExpiry != null && c.daysToExpiry <= warn,
        ).length;
        const unreachable = checked.filter((c) => !c.ok).length;
        const head = `Checked ${checked.length} domains — ${flagged} need attention (≤${warn}d or expired), ${unreachable} unreachable.`;
        return ok(`${head}\n${lines.join("\n")}`, { warnDays: warn, results: checked });
      }),
  );

  // ---- orchestrator ---------------------------------------------------------

  server.registerTool(
    "net_diagnose",
    {
      title: "Diagnose connectivity (why can't I reach X)",
      description:
        "One-shot diagnosis: resolves DNS, pings, checks TCP, inspects TLS, and probes HTTP for a target, then returns a verdict on where the failure is.",
      inputSchema: {
        target: z.string().describe("hostname or URL to diagnose"),
      },
    },
    async ({ target }) =>
      guardWrap(async () => {
        const host = hostFromTarget(target);
        guard.checkTarget(host);
        guard.log("net_diagnose", { target });
        const isUrl = target.includes("://");
        const url = isUrl ? target : `https://${host}`;

        const dnsR = await resolveDns(host, net.isIP(host) ? "A" : "A");
        const resolvedIp = net.isIP(host) ? host : dnsR.records[0];
        const steps: Record<string, unknown> = { dns: dnsR };
        let verdict = "";

        if (!resolvedIp && !net.isIP(host)) {
          verdict = `DNS resolution FAILED for ${host}. Likely a DNS/resolver problem on your side or the domain doesn't exist.`;
          return ok(verdict, { target, verdict, steps });
        }
        const ping = await pingHost(host, 443);
        steps.ping = ping;
        const tcp = await tcpConnect(host, isUrl && url.startsWith("http://") ? 80 : 443, 5000);
        steps.tcp = tcp;
        if (!tcp.open) {
          verdict = `DNS resolves (${resolvedIp}) but TCP/${tcp.port} is closed/filtered. Firewall, the service is down, or wrong port. ICMP ${ping.reachable ? "works" : "also fails"}.`;
          return ok(verdict, { target, verdict, steps });
        }
        let tls;
        if (url.startsWith("https://")) {
          tls = await tlsInspect(host, 443);
          steps.tls = tls;
          if (tls.ok && tls.daysToExpiry != null && tls.daysToExpiry < 0) {
            verdict = `Reaches ${host} but the TLS certificate EXPIRED ${-tls.daysToExpiry} days ago (${tls.validTo}). That's their side.`;
            return ok(verdict, { target, verdict, steps });
          }
          if (tls.ok && !tls.authorized) {
            verdict = `Reaches ${host} but TLS chain is INVALID: ${tls.authorizationError}. Cert/trust problem on their side (or a MITM/proxy).`;
            return ok(verdict, { target, verdict, steps });
          }
        }
        const http = await httpProbe(url);
        steps.http = http;
        if (!http.ok) {
          verdict = `TCP+TLS ok but HTTP failed: ${http.error}. Application-layer issue.`;
        } else if (http.status && http.status >= 500) {
          verdict = `Reachable; server returns HTTP ${http.status} — their server is erroring. Your connectivity is fine.`;
        } else if (http.status && http.status >= 400) {
          verdict = `Reachable; HTTP ${http.status} — auth/not-found/client issue, not a network problem.`;
        } else {
          verdict = `${target} is fully reachable: DNS ${resolvedIp}, TCP open, ${url.startsWith("https") ? "TLS valid, " : ""}HTTP ${http.status}. No network fault detected.`;
        }
        return ok(verdict, { target, verdict, steps });
      }),
  );

  // ---- WOW #1: triangulate (me or them?) ------------------------------------

  server.registerTool(
    "net_triangulate",
    {
      title: "Is it me or them? (local + global probes)",
      description:
        "Runs the same reachability test from THIS machine and from Globalping's worldwide probes, then verdicts whether a failure is your side, your network/ISP, or the target. Disabled in --local-only mode.",
      inputSchema: {
        target: z.string().describe("hostname or URL"),
        locations: z.array(z.string()).optional().describe("probe regions, e.g. US/EU/Asia"),
      },
    },
    async ({ target, locations }) =>
      guardWrap(async () => {
        const host = hostFromTarget(target);
        guard.checkTarget(host);
        guard.assertNetworkAllowed("globalping");
        guard.log("net_triangulate", { target });

        const localPing = await pingHost(host, 443);
        const localTcp = await tcpConnect(host, 443, 5000);
        const localReachable = localPing.reachable || localTcp.open;

        const gp = await globalpingTest(host, "ping", locations ?? ["US", "EU", "Asia"], 3);
        const remoteReachableCount = gp.results.filter((r) => r.reachable).length;
        const remoteTotal = gp.results.length;

        let verdict: string;
        if (gp.error) {
          verdict = `Local: ${localReachable ? "reachable" : "unreachable"}. Globalping unavailable (${gp.error}) — can't triangulate.`;
        } else if (!localReachable && remoteReachableCount > 0) {
          verdict = `YOUR SIDE: ${host} is down for you but reachable from ${remoteReachableCount}/${remoteTotal} global probes. The target is up — problem is your machine, network, DNS, or ISP routing.`;
        } else if (!localReachable && remoteReachableCount === 0) {
          verdict = `THEIR SIDE: ${host} is unreachable from you AND from all ${remoteTotal} global probes. The target is down.`;
        } else if (localReachable && remoteReachableCount < remoteTotal) {
          verdict = `MOSTLY UP: reachable from you and ${remoteReachableCount}/${remoteTotal} probes. Partial/regional outage or geo-restriction.`;
        } else {
          verdict = `ALL GREEN: ${host} reachable from you and all ${remoteTotal} global probes.`;
        }
        return ok(verdict, {
          target,
          verdict,
          local: { ping: localPing, tcp: localTcp, reachable: localReachable },
          global: gp,
        });
      }),
  );

  // ---- diagnosis_bundle: shareable report -----------------------------------

  server.registerTool(
    "diagnosis_bundle",
    {
      title: "Shareable diagnosis report",
      description:
        "Runs a full battery of probes against a target and returns a clean Markdown report you can paste straight into a bug report or support ticket. Includes DNS, reachability, TLS, HTTP timing, optional global probes, and local context.",
      inputSchema: {
        target: z.string().describe("hostname or URL to diagnose"),
        include_global: z
          .boolean()
          .optional()
          .describe("also probe from Globalping worldwide (default true unless --local-only)"),
      },
    },
    async ({ target, include_global }) =>
      guardWrap(async () => {
        const host = hostFromTarget(target);
        guard.checkTarget(host);
        guard.log("diagnosis_bundle", { target });
        const isUrl = target.includes("://");
        const url = isUrl ? target : `https://${host}`;
        const https = url.startsWith("https://");
        const wantGlobal = (include_global ?? true) && !guard.cfg.localOnly;

        const dns = await resolveDns(host, "A");
        const ping = await pingHost(host, 443);
        const tcp = await tcpConnect(host, https ? 443 : 80, 5000);
        const tls = https ? await tlsInspect(host, 443) : undefined;
        const http = tcp.open ? await httpProbe(url) : undefined;
        const gp = wantGlobal ? await globalpingTest(host, "ping", ["US", "EU", "Asia"], 3) : undefined;
        const resolvers = await readResolvers();
        const egress = wantGlobal ? await egressIp(6000) : null;

        let verdict: string;
        if (!dns.records.length && !net.isIP(host)) verdict = "DNS resolution failed — likely your resolver or a nonexistent domain.";
        else if (!tcp.open) verdict = `TCP/${tcp.port} closed/filtered — firewall, service down, or wrong port.`;
        else if (tls && tls.ok && tls.daysToExpiry != null && tls.daysToExpiry < 0) verdict = `TLS certificate expired ${-tls.daysToExpiry}d ago — server-side.`;
        else if (tls && tls.ok && !tls.authorized) verdict = `TLS chain invalid: ${tls.authorizationError} — server-side or interception.`;
        else if (http && http.status && http.status >= 500) verdict = `Reachable; server returns HTTP ${http.status} (their error).`;
        else if (http && http.ok) verdict = `Fully reachable — no network fault detected.`;
        else verdict = "Reaches TCP but no clean HTTP response — application-layer issue.";

        const ts = new Date().toISOString();
        const md: string[] = [];
        md.push(`# netops-mcp diagnosis — \`${target}\``);
        md.push(`_${ts}_`);
        md.push("");
        md.push(`**Verdict:** ${verdict}`);
        md.push("");
        md.push("## DNS");
        md.push(dns.records.length ? `- A: ${dns.records.join(", ")} (${dns.ms}ms)` : `- A: no answer (${dns.error ?? "none"})`);
        md.push("## Reachability");
        md.push(`- ping: ${ping.reachable ? `reachable via ${ping.method}${ping.rttMs != null ? ` ${ping.rttMs}ms` : ""}` : "unreachable"}`);
        md.push(`- TCP/${tcp.port}: ${tcp.open ? `open (${tcp.ms}ms)` : `closed/filtered (${tcp.error})`}`);
        if (tls) {
          md.push("## TLS");
          if (tls.ok) {
            md.push(`- ${tls.protocol} ${tls.cipher}, handshake ${tls.handshakeMs}ms`);
            md.push(`- cert: ${tls.daysToExpiry != null ? (tls.daysToExpiry < 0 ? `EXPIRED ${-tls.daysToExpiry}d ago` : `${tls.daysToExpiry}d left`) : "unknown"} (${tls.validTo ?? "?"}), ${tls.authorized ? "valid chain" : `INVALID: ${tls.authorizationError}`}`);
          } else md.push(`- failed: ${tls.error}`);
        }
        if (http) {
          md.push("## HTTP");
          if (http.ok) {
            md.push(`- ${http.status} ${http.statusText ?? ""}${http.redirects ? ` (${http.redirects} redirects)` : ""}`);
            md.push(`- timing: DNS ${http.timing?.dnsMs ?? "?"}ms · connect ${http.timing?.connectMs ?? "?"}ms · TLS ${http.timing?.tlsMs ?? "?"}ms · TTFB ${http.timing?.ttfbMs}ms · total ${http.timing?.totalMs}ms`);
          } else md.push(`- failed: ${http.error}`);
        }
        if (gp) {
          md.push("## From the world (Globalping)");
          if (gp.error) md.push(`- unavailable: ${gp.error}`);
          else for (const r of gp.results) md.push(`- ${r.location}: ${r.reachable ? "✓" : "✗"} ${r.summary ?? ""}`);
        }
        md.push("## Local context");
        md.push(`- resolvers: ${resolvers.join(", ") || "(default)"}`);
        if (wantGlobal) md.push(`- egress IP: ${egress ?? "unknown"}`);
        md.push("");
        md.push("---");
        md.push("_generated by netops-mcp · local-first network diagnostics_");

        const report = md.join("\n");
        return ok(report, { target, verdict, report, generatedAt: ts });
      }),
  );

  // ---- WOW #4: config <-> live correlation ----------------------------------

  server.registerTool(
    "config_correlate",
    {
      title: "Correlate local config with live DNS",
      description:
        "Reads /etc/hosts and resolv.conf and cross-checks them against live DNS — surfaces the hidden config that explains weird resolution (stale /etc/hosts pin, overriding resolver). No remote service can do this.",
      inputSchema: {
        domain: z.string().optional().describe("optional: focus the check on one domain"),
      },
    },
    async ({ domain }) =>
      guardWrap(async () => {
        guard.log("config_correlate", { domain });
        const hosts = await readHostsFile();
        const resolvers = await readResolvers();
        const findings: string[] = [];
        const correlations: unknown[] = [];

        const entriesToCheck = domain
          ? hosts.filter((h) => h.hostnames.includes(domain))
          : hosts;

        for (const e of entriesToCheck) {
          // Skip non-actionable system entries: loopback/link-local/multicast IPs
          // and non-FQDN aliases (localhost, ip6-*). We care about real domains
          // pinned to real addresses — that's where stale pins hide.
          if (!domain && (isLoopbackOrReserved(e.ip) || e.hostnames.every((h) => !h.includes(".")))) {
            continue;
          }
          for (const name of e.hostnames) {
            if (domain && name !== domain) continue;
            if (!domain && !name.includes(".")) continue;
            const live = await resolveDns(name, "A");
            const liveIp = live.records[0];
            const match = liveIp === e.ip;
            correlations.push({ hostname: name, hostsIp: e.ip, liveDnsIp: liveIp, line: e.line, match });
            if (!liveIp) {
              findings.push(
                `/etc/hosts:${e.line} pins ${name} -> ${e.ip}; this OVERRIDES DNS (DNS itself returns nothing). If ${name} seems stuck on an old address, this line is why.`,
              );
            } else if (!match) {
              findings.push(
                `/etc/hosts:${e.line} pins ${name} -> ${e.ip}, but live DNS says ${liveIp}. Your machine uses the hosts file, so you're talking to ${e.ip} (possibly stale).`,
              );
            }
          }
        }
        if (domain && entriesToCheck.length === 0) {
          const live = await resolveDns(domain, "A");
          correlations.push({ hostname: domain, hostsIp: null, liveDnsIp: live.records[0], match: null });
          findings.push(`${domain} is not in /etc/hosts; resolution comes purely from DNS (${live.records[0] ?? "no answer"}).`);
        }

        const summary =
          findings.length > 0
            ? findings.join("\n")
            : `No conflicting /etc/hosts pins found${domain ? ` for ${domain}` : ""}. Resolvers in use: ${resolvers.join(", ") || "(default)"}.`;
        return ok(summary, { resolvers, hostsEntries: hosts, correlations, findings });
      }),
  );

  // ---- WOW #2: tunnel diff (direct vs via interface/proxy) -------------------

  server.registerTool(
    "tunnel_diff",
    {
      title: "Direct vs tunnel diff",
      description:
        "Compares egress identity and reachability from the default route vs. bound to a specific interface IP (e.g. your VPN interface). Reveals split-tunnel surprises and egress differences. Needs network access for the egress check.",
      inputSchema: {
        interface_ip: z
          .string()
          .optional()
          .describe("local source IP to bind the 'tunnel' path to (e.g. your wg interface address)"),
        url: z.string().optional().describe("optional URL to test reachability on both paths (default https://api.ipify.org)"),
      },
    },
    async ({ interface_ip, url }) =>
      guardWrap(async () => {
        guard.assertNetworkAllowed("egress-check");
        if (interface_ip) guard.checkTarget(interface_ip);
        guard.log("tunnel_diff", { interface_ip, url });

        const directIp = await egressIp(6000);
        const boundIp = interface_ip ? await egressIp(6000, interface_ip) : null;

        const testUrl = url ?? "https://api.ipify.org";
        const directHttp = await httpProbe(testUrl, { timeoutMs: 8000 });
        const boundHttp = interface_ip
          ? await httpProbe(testUrl, { timeoutMs: 8000, localAddress: interface_ip })
          : null;

        let verdict: string;
        if (!interface_ip) {
          verdict = `Default-route egress IP: ${directIp ?? "unknown"}. Pass interface_ip to compare against a tunnel path.`;
        } else if (boundIp && directIp && boundIp !== directIp) {
          verdict = `Egress DIFFERS: default route exits as ${directIp}, interface ${interface_ip} exits as ${boundIp}. Traffic on that interface is taking a different path (expected for a working VPN/proxy).`;
        } else if (boundIp && directIp && boundIp === directIp) {
          verdict = `SAME egress (${directIp}) on both paths. The interface ${interface_ip} is NOT changing your exit IP — possible split-tunnel leak or the tunnel isn't carrying this traffic.`;
        } else {
          verdict = `Could not get egress IP on one path (direct=${directIp ?? "fail"}, bound=${boundIp ?? "fail"}). The bound interface may have no route.`;
        }
        return ok(verdict, {
          verdict,
          directEgressIp: directIp,
          boundEgressIp: boundIp,
          directHttp,
          boundHttp,
        });
      }),
  );

  // ---- WOW #3: DNS leak / egress identity -----------------------------------

  server.registerTool(
    "dns_leak_check",
    {
      title: "DNS leak / egress identity",
      description:
        "Reports your public egress IP and the DNS resolvers your system is actually using, and flags whether resolvers look like a local/ISP server (potential leak) vs a tunnel resolver. Heuristic. Needs network access for egress IP.",
      inputSchema: {},
    },
    async () =>
      guardWrap(async () => {
        guard.log("dns_leak_check", {});
        const resolvers = await readResolvers();
        let egress: string | null = null;
        if (!guard.cfg.localOnly) egress = await egressIp(6000);

        const flags: string[] = [];
        for (const r of resolvers) {
          if (isPrivate(r) || r.startsWith("127.") || r === "::1") {
            flags.push(`${r} is a local/private resolver (router or stub). Verify it forwards over your tunnel, otherwise queries may leak to your ISP.`);
          }
        }
        const summary =
          `Egress IP: ${egress ?? (guard.cfg.localOnly ? "(skipped: local-only)" : "unknown")}. ` +
          `Resolvers: ${resolvers.join(", ") || "(default)"}. ` +
          (flags.length ? `\nNotes:\n- ${flags.join("\n- ")}` : "No obvious leak heuristics tripped.");
        return ok(summary, { egressIp: egress, resolvers, flags });
      }),
  );

  // ---- tunnels: wg status ---------------------------------------------------

  server.registerTool(
    "wg_status",
    {
      title: "WireGuard status",
      description:
        "Reads WireGuard interfaces and peers (via `wg show`): handshake recency, endpoints, allowed-IPs, transfer. Read-only. Flags peers with stale handshakes.",
      inputSchema: {},
    },
    async () =>
      guardWrap(async () => {
        guard.log("wg_status", {});
        const st = await wgStatus();
        if (!st.available) return ok(`WireGuard not readable: ${st.note}`, st as any);
        const lines: string[] = [];
        for (const iface of st.interfaces) {
          lines.push(`${iface.name} (port ${iface.listenPort ?? "?"}, ${iface.peers.length} peers)`);
          for (const p of iface.peers) {
            const stale =
              p.handshakeAgeSec != null && p.handshakeAgeSec > 180
                ? ` STALE handshake ${p.handshakeAgeSec}s ago`
                : p.handshakeAgeSec != null
                  ? ` handshake ${p.handshakeAgeSec}s ago`
                  : " never handshaked";
            lines.push(`  peer ${p.publicKey.slice(0, 12)}… via ${p.endpoint ?? "no endpoint"}, allowed ${p.allowedIps}${stale}`);
          }
        }
        return ok(lines.join("\n") || "No WireGuard interfaces.", st as any);
      }),
  );

  // ---- WireGuard write ops (v0.2, gated by --enable-write) -------------------

  server.registerTool(
    "wg_config_generate",
    {
      title: "Generate WireGuard peer config",
      description:
        "Generate a fresh WireGuard keypair and a ready-to-paste client config. Read-only — it does NOT modify any interface; it just prints the config and keys for you to use.",
      inputSchema: {
        address: z.string().optional().describe("client tunnel address, e.g. 10.0.0.2/32"),
        server_public_key: z.string().optional().describe("the server's public key"),
        server_endpoint: z.string().optional().describe("server host:port, e.g. vpn.example.com:51820"),
        allowed_ips: z.string().optional().describe("routes through the tunnel (default 0.0.0.0/0, ::/0)"),
        dns: z.string().optional().describe("DNS server for the client"),
      },
    },
    async ({ address, server_public_key, server_endpoint, allowed_ips, dns }) =>
      guardWrap(async () => {
        guard.log("wg_config_generate", {});
        const kp = await wgGenKeypair();
        if (kp.error) return fail(`Could not generate keypair: ${kp.error}`, kp as any);
        const cfg =
          `[Interface]\n` +
          `PrivateKey = ${kp.privateKey}\n` +
          `Address = ${address ?? "10.0.0.2/32"}\n` +
          (dns ? `DNS = ${dns}\n` : "") +
          `\n[Peer]\n` +
          `PublicKey = ${server_public_key ?? "<SERVER_PUBLIC_KEY>"}\n` +
          `Endpoint = ${server_endpoint ?? "<SERVER_HOST>:51820"}\n` +
          `AllowedIPs = ${allowed_ips ?? "0.0.0.0/0, ::/0"}\n` +
          `PersistentKeepalive = 25\n`;
        return ok(
          `Generated a new keypair. Client public key: ${kp.publicKey}\n\n${cfg}`,
          { publicKey: kp.publicKey, config: cfg },
        );
      }),
  );

  server.registerTool(
    "wg_peer_add",
    {
      title: "Add / update WireGuard peer",
      description:
        "Add or update a peer on a WireGuard interface (`wg set`). Mutating: requires --enable-write, and runs as a dry-run unless confirm:true. Needs privileges to apply.",
      inputSchema: {
        iface: z.string().describe("WireGuard interface, e.g. wg0"),
        public_key: z.string().describe("peer public key"),
        allowed_ips: z.string().describe("comma-separated CIDRs, e.g. 10.0.0.2/32"),
        endpoint: z.string().optional().describe("peer endpoint host:port"),
        confirm: z.boolean().optional().describe("set true to actually apply (otherwise dry-run)"),
      },
    },
    async ({ iface, public_key, allowed_ips, endpoint, confirm }) =>
      guardWrap(async () => {
        guard.assertWriteEnabled("wg_peer_add");
        validateWg(iface, public_key, allowed_ips, endpoint);
        const args = buildWgSetArgs({ iface, publicKey: public_key, allowedIps: allowed_ips, endpoint }, false);
        guard.log("wg_peer_add", { iface, public_key, confirm: Boolean(confirm) });
        if (!confirm) {
          return ok(`DRY-RUN — would run:\n  wg ${args.join(" ")}\nRe-call with confirm:true to apply.`, {
            dryRun: true,
            command: `wg ${args.join(" ")}`,
          });
        }
        const r = await wgSet(args);
        return r.ok
          ? ok(`Applied: wg ${args.join(" ")}`, { applied: true, command: `wg ${args.join(" ")}` })
          : fail(`wg set failed: ${r.error}`, { applied: false });
      }),
  );

  server.registerTool(
    "wg_peer_remove",
    {
      title: "Remove WireGuard peer",
      description:
        "Remove a peer from a WireGuard interface (`wg set ... remove`). Mutating: requires --enable-write, and runs as a dry-run unless confirm:true.",
      inputSchema: {
        iface: z.string().describe("WireGuard interface, e.g. wg0"),
        public_key: z.string().describe("peer public key to remove"),
        confirm: z.boolean().optional().describe("set true to actually apply (otherwise dry-run)"),
      },
    },
    async ({ iface, public_key, confirm }) =>
      guardWrap(async () => {
        guard.assertWriteEnabled("wg_peer_remove");
        validateWg(iface, public_key);
        const args = buildWgSetArgs({ iface, publicKey: public_key }, true);
        guard.log("wg_peer_remove", { iface, public_key, confirm: Boolean(confirm) });
        if (!confirm) {
          return ok(`DRY-RUN — would run:\n  wg ${args.join(" ")}\nRe-call with confirm:true to apply.`, {
            dryRun: true,
            command: `wg ${args.join(" ")}`,
          });
        }
        const r = await wgSet(args);
        return r.ok
          ? ok(`Removed peer ${public_key.slice(0, 12)}… from ${iface}`, { applied: true })
          : fail(`wg set failed: ${r.error}`, { applied: false });
      }),
  );

  // ---- context: net_overview ------------------------------------------------

  server.registerTool(
    "net_overview",
    {
      title: "Network overview",
      description: "Snapshot of local interfaces, resolvers, and WireGuard interfaces — quick context for the assistant.",
      inputSchema: {},
    },
    async () =>
      guardWrap(async () => {
        guard.log("net_overview", {});
        const ifaces = interfaces();
        const resolvers = await readResolvers();
        const wg = await wgStatus();
        const summary = `Interfaces: ${Object.keys(ifaces).join(", ")}. Resolvers: ${resolvers.join(", ") || "(default)"}. WireGuard: ${wg.available ? wg.interfaces.map((i) => i.name).join(", ") || "none" : "unavailable"}.`;
        return ok(summary, { interfaces: ifaces, resolvers, wireguard: wg });
      }),
  );
}

function validateWg(iface: string, publicKey: string, allowedIps?: string, endpoint?: string): void {
  if (!WG_IFACE_RE.test(iface)) throw new GuardError(`Invalid interface name: ${iface}`);
  if (!WG_KEY_RE.test(publicKey)) throw new GuardError(`Invalid WireGuard public key: ${publicKey}`);
  if (allowedIps !== undefined) {
    const toks = allowedIps.split(",").map((s) => s.trim()).filter(Boolean);
    if (toks.length === 0) throw new GuardError("allowed_ips is empty.");
    for (const t of toks) {
      if (!/^[0-9a-fA-F:.]+(\/\d{1,3})?$/.test(t)) throw new GuardError(`Invalid allowed-ip: ${t}`);
    }
  }
  if (endpoint !== undefined && !/^[A-Za-z0-9.\-\[\]:]+:\d{1,5}$/.test(endpoint)) {
    throw new GuardError(`Invalid endpoint (expect host:port): ${endpoint}`);
  }
}

function isLoopbackOrReserved(ip: string): boolean {
  return (
    ip.startsWith("127.") ||
    ip === "::1" ||
    /^fe80/i.test(ip) || // link-local
    /^fe00/i.test(ip) ||
    /^ff0/i.test(ip) || // multicast
    /^255\./.test(ip) ||
    ip === "0.0.0.0"
  );
}

function isPrivate(ip: string): boolean {
  return (
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^169\.254\./.test(ip) ||
    /^fc/i.test(ip) ||
    /^fd/i.test(ip)
  );
}
