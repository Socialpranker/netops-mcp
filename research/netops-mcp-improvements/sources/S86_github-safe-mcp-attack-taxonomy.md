---
id: S86
url: https://github.com/fkautz/safe-mcp
title: "SAFE-MCP: Security Analysis Framework — MITRE ATT&CK for MCP"
channel: github-code
access: open
subquestion_ids: [opposition]
credibility: 5
recency: 4
bias: 2
date: 2025-07-24
---
# SAFE-MCP: Comprehensive MCP Attack Taxonomy

## What it is
MITRE ATT&CK adaptation specifically for MCP environments. 14 tactical categories, documented TTPs.

## Key attack categories relevant to netops-mcp

| Tactic | Technique | Risk for network MCP |
|--------|-----------|---------------------|
| Initial Access | Tool Poisoning Attack (SAFE-T1001) | Malicious instructions in tool descriptions invisible to users but processed by LLMs | HIGH |
| Initial Access | Supply Chain Compromise (SAFE-T1002) | Backdoored MCP packages | HIGH |
| Initial Access | Server Impersonation / Name-Collision (SAFE-T1004) | Attacker registers same-name server | MEDIUM |
| Initial Access | Exposed Endpoint Exploit (SAFE-T1005) | Misconfigured public MCP endpoints (no auth, debug on) | HIGH for netops |
| Execution | Command Injection (SAFE-T1101) | Unsanitized input leading to RCE | CRITICAL for netops |
| Credential Access | — | Agent exposes API keys/secrets via tool calls | HIGH |
| Exfiltration | — | Data exfil via network tools agent controls | CRITICAL for netops |

## Specific concern: Name-collision attack (SAFE-T1004)

For a tool named `netops-mcp`, an attacker could:
1. Register `netops-mcp` on npm/pip with similar description
2. Users install it via MCP registry
3. Malicious tool definitions poison their agent's context

## Key quote from HN discussion (item 44452180)

> "Key MCP Security Challenges: Prompt Injection and Unauthorized Tool Execution; Excessive OAuth Permissions and Token Management; Third-party MCP Server Risks; Supply-Chain Vulnerabilities and Tool Poisoning"

## Driftcop tool (HN 44843841, github.com/sudoviz/driftcop)

> "a tool that was useful and benign yesterday could auto-update into something malicious today (this is known as a rug pull attack in the MCP context)"
> "MCP lacks built-in security checks — MCP servers can suffer from issues like command injection, permission reuse, and version drift"
