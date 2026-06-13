---
id: S82
url: https://news.ycombinator.com/item?id=48407391
title: "HN: Bad MCP design costs your agent 5x more tokens"
channel: forum-discussion
access: open
subquestion_ids: [opposition]
credibility: 5
recency: 5
bias: 3
date: 2026-06-05
---
# Bad MCP Design Costs 5x More Tokens — Empirical Test

## Source context
Show HN post with benchmarks comparing two MCPs with identical functionality for a to-do list app (MCP-A vs MCP-B, official release from the app vendor).

## Key quantitative findings

- **MCP-B consumed 5x more input tokens** (3.17M vs 637K over identical test runs)
- Same pass rate (~90%) despite 5x more tokens
- MCP-B had **47 tools** vs MCP-A's **14 tools** covering identical functionality

## Bad design patterns identified

1. **Incomplete query results** — search tool returned only basic fields (ID, title, URL) but omitted project_id needed for next operation → extra tool calls, +30% decision loops
2. **Unfiltered API responses** — create_task dumped 600+ raw JSON chars including null fields like `focusSummaries: null`
3. **Tool proliferation** — 47 tools vs 14 for same functionality increases model "decision burden"

Quote:
> "If MCP returns pure API results to the Agent's context unprocessed, the Agent's context window will accumulate very fast."

## Significance for netops-mcp
Direct empirical evidence that tool count and output verbosity are the #1 and #2 token killers. For a network MCP that might have 20+ tools (ping, traceroute, dig, nmap, ss, netstat, arp...), bad design could make it genuinely costly to use. This is a real product risk, not theoretical.
