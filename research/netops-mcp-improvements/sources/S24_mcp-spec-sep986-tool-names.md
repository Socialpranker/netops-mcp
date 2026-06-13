---
id: S24
url: https://modelcontextprotocol.io/seps/986-specify-format-for-tool-names.md
title: MCP SEP-986 — Specify Format for Tool Names (Final)
channel: official-docs
access: open
subquestion_ids: [ST2]
credibility: 5
recency: 5
bias: 1
date: 2025-07-16
---
# MCP SEP-986 — Tool Name Format Standard (Final)

## Specification
- Length: 1–64 characters (SHOULD)
- Case-sensitive
- Allowed chars: A-Z, a-z, 0-9, `_`, `-`, `.`, `/`
- SHOULD NOT contain spaces, commas, or other special characters
- SHOULD be unique within namespace

## Naming Pattern Support
Forward slash `/` and dot `.` explicitly allowed to support hierarchical/namespaced names:
- `user-profile/update`
- `admin.tools.list`
- `DATA_EXPORT_v2`
- `getUser`

## Motivation
Without standard format, inconsistent naming (different separators, casing, char sets) creates confusion and errors in tool invocation.

## Rationale
Pattern based on patterns used in major clients (VS Code, Claude) and common programming/API conventions. Flexibility supports use cases from human-readable to machine-generated names.

## netops-mcp relevance
Current netops naming: `net_diagnose`, `dns_lookup`, `wg_status` etc. — all underscore-separated, snake_case. This conforms to spec. The `net_` and `wg_` prefixes provide effective namespacing within the server.
