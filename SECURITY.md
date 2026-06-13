# Security model

netops-mcp touches your network on behalf of an LLM. It is built so that staying
trustworthy in a corporate or homelab environment is the default, not an option.

## Guarantees

1. **No telemetry. Ever.** netops-mcp makes no analytics, tracking, or "phone-home"
   calls. The only outbound calls it ever makes are:
   - the Globalping public API (`net_triangulate`), and
   - a public egress-IP echo (`tunnel_diff`, `dns_leak_check`).

   Both are disabled entirely with `--local-only`.

2. **Read-only by default.** Every tool is read-only unless you pass
   `--enable-write`. The only mutating tools — `wg_peer_add` / `wg_peer_remove` —
   are gated behind that flag AND run as a dry-run (printing the exact `wg`
   command) until you pass `confirm: true`. Inputs are strictly validated
   (interface name, base64 key, CIDR, host:port) before any command is built.

3. **No shell, no injection.** System utilities are invoked via `execFile` with an
   argument array — never a shell string. Targets are validated and rejected if they
   contain shell metacharacters.

4. **Anti-scan.** `tcp_port_check` checks a small list of **named** ports (default cap
   20, `NETOPS_MAX_PORTS`) on one host. It refuses bulk/CIDR sweeps. This is a
   connectivity tool, not a discovery scanner. (A future explicit `--enable-scan`
   mode with an allowlist may add nmap-style behaviour.)

5. **Allow/deny lists.** `NETOPS_ALLOW` enables strict mode (only listed hosts/CIDRs
   permitted); `NETOPS_DENY` blocks specific targets.

6. **Audit log.** Every guarded action is written to stderr as a JSON line
   (`[netops-audit] …`). Silence with `--no-audit`. stdout is reserved for the MCP
   protocol and never used for logging.

7. **Network output is marked untrusted.** Tools that surface attacker-controllable
   network text — DNS records (`dns_lookup`, `config_correlate`, `diagnosis_bundle`),
   reverse-DNS hostnames (`traceroute`), TLS error strings and certificate fields
   (`tls_inspect`, `cert_sweep`, `net_diagnose`, `diagnosis_bundle`), HTTP status text
   (`http_probe`) — wrap that text in an `⟦untrusted:…⟧` delimiter before it reaches
   the model-visible output, and carry the MCP `openWorldHint` annotation. This blunts *indirect prompt
   injection*: a hostile DNS server, a hop with a crafted PTR record, or a honeypot's
   certificate cannot easily smuggle instructions into your assistant's context
   disguised as a normal result. This is **defense-in-depth, not a guarantee** — the
   delimiter collapses newlines but an attacker who places the closing bracket `⟧`
   inside their payload can still break the fence, so always treat tool output as
   data, not commands.

## Reporting

Found a vulnerability? Open a private security advisory on the repository rather than
a public issue.
