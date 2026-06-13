---
id: S28
url: https://modelcontextprotocol.io/community/design-principles.md
title: MCP Design Principles (Official Community Document)
channel: official-docs
access: open
subquestion_ids: [ST2]
credibility: 5
recency: 5
bias: 1
date: 2026
---
# MCP Design Principles

## Composability over specificity
"MCP provides foundational primitives: resources, tools, prompts, and tasks. We don't add protocol features for use cases that can be constructed from these existing building blocks. This keeps the surface area small and implementations simple."

**implication for tool design**: Prefer composable tools that can be orchestrated together. A tool that does one thing well + another that combines several for common workflows (like net_diagnose) is the right pattern.

## Convergence over choice
"There should be one way to solve a problem in MCP." — For tool design: one canonical tool per job, not multiple overlapping tools for the same purpose.

## Capability over compensation
"Models improve faster than protocols evolve. We avoid adding permanent structure to work around limitations that are likely temporary." — Don't over-engineer tool descriptions to compensate for weak model behavior that future models will handle naturally.

## Pragmatism over purity
"We don't pursue theoretical elegance at the cost of real-world utility." — Accept some tool overlap if it genuinely helps users get work done faster.

## Stability over velocity
"Every addition is a permanent commitment." — Be conservative about adding new tools to an MCP server.

## netops relevance
- "Composability" principle supports having both atomic probes (dns_lookup) and composite orchestrators (net_diagnose, diagnosis_bundle) — this IS the right pattern, not redundancy
- "Convergence" suggests: if two tools do the same job, pick one
- "Stability" argues against adding more tools without strong use-case evidence
