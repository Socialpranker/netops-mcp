---
id: S29
url: https://modelcontextprotocol.io/community/tool-annotations/charter.md
title: MCP Tool Annotations Interest Group Charter (2026-04-20)
channel: official-docs
access: open
subquestion_ids: [ST2]
credibility: 4
recency: 5
bias: 1
date: 2026-04-20
---
# MCP Tool Annotations Interest Group Charter

## Current 4 Annotations Being Evaluated
readOnlyHint, destructiveHint, idempotentHint, openWorldHint — "6 independent SEPs propose annotation changes, each solving real problems but lacking the coherent, cross-cutting perspective"

## Open Questions (Active Research Areas)
- Should runtime annotations (change between invocations) be added?
- Are additional static annotations worth standardizing?
- Should tool RESPONSE annotations be added?
- How should annotations interact with trust, security, human-in-the-loop?
- "What is the right level of granularity — a few well-defined hints vs. a richer, extensible vocabulary?"

## Active SEPs Under Discussion
- SEP-1913: Trust and Sensitivity Annotations
- SEP-1984: Comprehensive Tool Annotations
- SEP-2417: Model Preferences for Tools
- SEP-1862: Tool Resolution (preflight checks)

## Status
Annotations system is actively evolving. The 4 current hints are stable but the community is actively debating whether they are sufficient. Participants include Microsoft, GitHub, OpenAI, Cloudflare.

## netops relevance
Existing 4 annotations are sufficient for netops now. The key useful annotations for netops:
- readOnlyHint: true → 15+ diagnostic tools (safe, no side effects)
- destructiveHint: true → wg_peer_add, wg_peer_remove (write operations)
- idempotentHint: true → most read probes (safe to retry)
- openWorldHint: true → all tools (interact with network/external services)
Wait for SEP-2417 (Model Preferences for Tools) — may allow hinting which model tier to use per tool.
