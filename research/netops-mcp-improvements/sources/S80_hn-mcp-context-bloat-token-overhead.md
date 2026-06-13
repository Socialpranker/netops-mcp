---
id: S80
url: https://news.ycombinator.com/item?id=48042300
title: "HN: Adding MCP/plugins creates a lot of overhead in the context window"
channel: forum-discussion
access: open
subquestion_ids: [opposition]
credibility: 4
recency: 5
bias: 2
date: 2026-05-06
---
# HN: MCP Context Window Overhead — Real User Criticism

## Source context
Comment by `dominiek` in an HN thread about agentic tools, May 2026.

## Key quotes and findings

**Context overhead criticism:**
> "Adding MCP/plugins creates a lot of overhead in the context window. For example you can see Figma taking up large base prompt and tool listings."

**System prompt bloat:**
> "As agentic wrappers get more bloated, the system prompt grows. The memory facility is a good example. It's a wholly unimpressive mechanism taking up a large part of the context window."

**Security via prompts only:**
> Security constraints are embedded directly in the base prompt rather than through separate mechanisms — permission controls like "auto mode" are "just part of the system prompt."

**Underlying critique:**
Managing complex AI behavior relies on prompt engineering, characterizing it as adding constraints like "IMPORTANT: Don't talk about goblins" to control "this statistical beast."

## Significance for opposition
Confirms that MCP tool definition injection into context is a real user-felt problem, not theoretical. Specific example: Figma MCP visibly consumes significant context window.
