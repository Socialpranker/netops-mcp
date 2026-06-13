---
id: S25
url: https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/
title: MCP Blog — Tool Annotations as Risk Vocabulary (2026-03-16)
channel: official-docs
access: open
subquestion_ids: [ST2]
credibility: 5
recency: 5
bias: 1
date: 2026-03-16
---
# MCP Blog — Tool Annotations as Risk Vocabulary

## Four Core Annotations (Exact Definitions)

### readOnlyHint (default: false)
"Does the tool modify its environment?"
- true → client may skip confirmation dialogs for read-only ops
- Enables auto-approval of queries that don't change state

### destructiveHint (default: true)
Indicates whether modifications are destructive vs additive
- true → triggers confirmation prompts before execution
- false → applied to operations that CREATE/ADD data without removing existing content
- Distinguishes reversible from irreversible changes

### idempotentHint (default: false)
Repeated calls with identical arguments are safe
- true → enables automatic retry logic on failures
- Client can re-execute without user re-approval

### openWorldHint (default: true)
Interaction scope — closed domain vs external entities
- true → Tool reaches beyond local/internal boundaries to untrusted sources
- false → Operations remain within controlled, closed-world domains
- When true: "Scrutinize output for untrusted content; flag a trust-boundary cross"

## Design Philosophy
- All annotations are HINTS, never contracts
- "Annotations are not guaranteed to faithfully describe tool behavior"
- Clients must treat untrusted server annotations as informational only
- Defaults assume worst-case risk: non-read-only, potentially destructive, non-idempotent, open-world

## netops-mcp application
Most netops probes are read-only (dns_lookup, net_ping, tcp_port_check, tls_inspect, http_probe, traceroute, mtu_blackhole, dns_leak_check, tunnel_diff, cert_sweep, wg_status, net_overview, config_correlate, net_diagnose, net_triangulate, diagnosis_bundle) → should set readOnlyHint: true, destructiveHint: false.

Only wg_peer_add and wg_peer_remove are write ops → destructiveHint: true, idempotentHint varies.
wg_config_generate is read-only (generates config, doesn't apply).

All netops tools interact with live network or external DNS servers → openWorldHint: true (default, no change needed).
