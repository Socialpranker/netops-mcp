---
id: S84
url: https://news.ycombinator.com/item?id=46725025
title: "HN: We tested AI agents with 214 attacks that don't require jailbreaking"
channel: forum-discussion
access: open
subquestion_ids: [opposition]
credibility: 5
recency: 4
bias: 2
date: 2026-01-22
---
# AI Agent Security: 214 Environment-Level Attacks

## Core insight

> "The model functioned correctly, yet the overall agent system remained compromised because it trusted its tools' outputs."

## Attack classes that succeeded (all without jailbreaking the model)

1. **Path injection** — asked agent to read a file, injected `path=/etc/passwd`. Agent complied.
2. **Data exfiltration** — asked for config, instructed to email it externally. Agent did it.
3. **Shell output poisoning** — poisoned `git status` output with malicious instructions. Agent executed them.
4. **Credential exposure** — asked for API keys "for debugging". Agent provided them.

## Methodology
Researchers used "shims" intercepting actual tool operations (filesystem ops, subprocess calls, PATH manipulation), making poisoned output appear legitimate. Agents processed what seemed like authentic tool responses.

## Relevance to network MCP

For a netops-mcp server:
- `traceroute` output could be poisoned to contain embedded instructions
- `dig` response from a malicious DNS server could include prompt injection in TXT records
- `nmap` scan output from a honeypot host could embed LLM instructions in banner text
- WireGuard peer output could be manipulated if peer is attacker-controlled

This is not theoretical — the attack surface exists whenever the MCP returns text from network-accessible resources.
