---
id: S23
url: https://news.ycombinator.com/item?id=48407391
title: HN Discussion — "Bad MCP design costs your agent 5x more tokens" (2026-06-05)
channel: forum-discussion
access: open
subquestion_ids: [ST2]
credibility: 3
recency: 5
bias: 2
date: 2026-06-05
---
# HN — Bad MCP design costs your agent 5x more tokens

## Key Empirical Finding
Comparison of two MCPs with IDENTICAL functionality on 40 test prompts:
- **MCP-A** (14 tools, well-designed): 637K input tokens, 90% pass rate
- **MCP-B** (47 tools, poorly designed): 3.17M input tokens, 90% pass rate
- **Result: MCP-B used 5× more tokens for the same task accuracy**
- MCP-B required 35 additional ReAct loops (30% more output tokens)

## Root Causes of Poor MCP-B Performance

### 1. Tool Proliferation (47 vs 14)
47 tools compressed to 14 = identical functionality. Excess tools "increase the model's decision burden" and enlarge candidate selection set.

### 2. Incomplete Query Results
MCP-B search tool returned only id, title, url — missing project_id needed for next operation. Forced agent to make redundant calls. Fix: "all necessary info to perform the next action in a single call."

### 3. Unfiltered API Responses
Create_task returned raw JSON (600+ chars with timestamps and null fields) → inflated context window. Fix: filter and format data.

## Best Practices from Article
- Design tools anticipating agent's next steps, not just immediate requests
- Return sufficient context to prevent extra round-trips
- Minimize tool overlap and consolidate overlapping functions
- Format data for readability; remove unnecessary API fields

## netops-mcp relevance
14 good tools vs 47 bad tools → MCP-A was 5x cheaper. netops has 19 tools — in the "MCP-A zone" but worth auditing for overlap between similar probes.
