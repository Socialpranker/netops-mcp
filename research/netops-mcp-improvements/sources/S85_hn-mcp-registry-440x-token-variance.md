---
id: S85
url: https://news.ycombinator.com/item?id=47488461
title: "HN: MCP registry quality — token costs vary 440x across 201 servers"
channel: forum-discussion
access: open
subquestion_ids: [opposition]
credibility: 5
recency: 5
bias: 3
date: 2026-03-23
---
# MCP Registry Quality Crisis: 440x Token Cost Variance

## Source context
HN comment by `0coCeo` about analysis of 201 public MCP servers' schema quality.

## Key quantitative findings

> "We've been running build-time schema analysis on 201 public MCP servers — grading token efficiency, correctness, and description quality. The results across popular servers are pretty striking: token costs vary 440x (GitHub official: 20,444 tokens; sqlite: 46). 100% have at least one quality issue."

## Critical observation

> "The top-starred servers are consistently the worst performers on token efficiency — **star count is actually a negative quality signal**."

## Implications

1. MCP registries (smithery.ai, mcp.so, etc.) are essentially discovery catalogs with no quality gate
2. The most popular servers are the most token-wasteful
3. 100% of analyzed servers have at least one quality issue
4. No standardized quality metrics exist in current registries

## Context from another HN comment (47881567)

> "There is a discovery layer (although, not sure if that will be the main draw), and I am vetting that discovery layer to ensure high quality of the MCP servers we have on that discovery layer. The big value prop is only loading the MCP server or set of tools within the MCP server that is required for each prompt. This reduces wasteful context usage and clutter (and wasteful token usage)."

## Significance
Registries don't solve the quality problem; they aggregate it. For a netops-mcp to succeed, quality differentiation (clean tool schemas, minimal token footprint) is a genuine competitive advantage, not just nice-to-have.
