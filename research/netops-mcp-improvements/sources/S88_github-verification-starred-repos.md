---
id: S88
url: https://github.com
title: "GitHub Verification: Star counts for previously claimed repos (2026-06-13)"
channel: github-code
access: open
subquestion_ids: [verification]
credibility: 5
recency: 5
bias: 1
date: 2026-06-13
---
# GitHub Repo Verification Table

All data verified via `gh api repos/OWNER/REPO` on 2026-06-13.

| Repo | Claimed stars | REAL stars | pushed_at | Active? | Archived? | Notes |
|---|---|---|---|---|---|---|
| jsdelivr/globalping-mcp-server | 58 | **58** ✅ | 2026-06-08 | YES | No | "Remote MCP server that gives LLMs access to run network commands" — CONFIRMED, actively maintained |
| labeveryday/network-mcp | 4 | **4** ✅ | 2025-12-25 | stale | No | "widely distributed network mcp server for agents" — last push Christmas 2025 |
| AliKarami/MikroMCP | 29 | **29** ✅ | 2026-05-30 | YES | No | "Production-grade MCP server for MikroTik RouterOS" |
| jeff-nasseri/mikrotik-mcp | 208 | **208** ✅ | 2026-06-06 | YES | No | "MCP server for Mikrotik" — most starred networking MCP |
| containers/kubernetes-mcp-server | 1681 | **1681** ✅ | 2026-06-12 | YES | No | "MCP server for Kubernetes and OpenShift" — tier 1 infra project |
| netboxlabs/netbox-mcp-server | 185 | **185** ✅ | 2026-06-12 | YES | No | "read-only interaction with NetBox data in LLMs" |

## All 6 stars claims confirmed accurate to the day.

## MCP Ecosystem Scale (GitHub, 2026-06-13)

- Repos with topic `mcp-server`: **17,873**
- Repos with topic `model-context-protocol`: **13,206**  
- Repos with "mcp server" in name: **~41,024**

Ecosystem is massive and growing fast. Not a builder-bubble in terms of repo count.

## Quality signal

The kubernetes-mcp-server (1681 stars) is by `containers` org — the same org as Podman, Buildah. This is a tier-1 infra project, not a side project. Indicates MCP is being adopted at production-grade level in infrastructure tooling.
