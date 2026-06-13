---
id: S83
url: https://news.ycombinator.com/item?id=48494837
title: "HN: MCP is 'prompt injection as a service'"
channel: forum-discussion
access: open
subquestion_ids: [opposition]
credibility: 4
recency: 5
bias: 3
date: 2026-06-11
---
# HN: MCP Security — Prompt Injection as a Service

## Source context
HN comment by `seanhunter`, June 2026, about MCP UI protocol security.

## Key quote

> "What a terrible idea this ui protocol is. MCP is already pretty much 'prompt injection as a service'. This creates a little-known side channel to make it easier to slip an exploit under people's radar."

## Related comment (HN 48342219, by `devil1432`)

Critical structural flaw:
> "From my experience, the biggest flaw of MCP is lack of control over your system prompt. Prompts need to be tailored for specific model (duh). Tool definitions are de facto part of your system prompt. By injecting tool definition from MCP servers into your prompt, you are basically adding prompt that was (likely) not tailored for your specific model. That causes drop in quality of answers."

> "Other issue is that adding one new feature via MCP can introduce regression into your system and cause other MCP features to work incorrectly... Real life example: tools from MCP server for ms outlook requires certain date format for filtering emails. That worked fine in our prod. Until we added another MCP server (built in-house) [and it broke]."

## Comment from HN 47910135

> "The same agent that can see your memory, instructions, and secrets can often also walk outside your system and take unrestricted actions. It will be exposed to various attacks, including prompt injection, unsafe scripts, skills, and websites whose sole purpose is to attack AI agents and gain control over them."

## Significance for netops-mcp
A network MCP with WireGuard access is particularly high-risk: successful prompt injection could result in tunnel teardown, route modification, or peer addition. The "prompt injection as a service" framing is a real concern for any MCP with privileged system access.
