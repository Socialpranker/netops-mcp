---
id: S22
url: https://www.anthropic.com/engineering/writing-tools-for-agents
title: Anthropic Engineering — Writing Tools for Agents
channel: official-docs
access: open
subquestion_ids: [ST2]
credibility: 5
recency: 5
bias: 1
date: 2025
---
# Anthropic Engineering — Writing Tools for Agents

## Core Principle: Restraint Over Quantity
"More tools don't always lead to better outcomes." Build "a few thoughtful tools targeting specific high-impact workflows" rather than maximizing tool count.

## Tool Proliferation Problem
Excess tools "increase the model's decision burden" and enlarge the candidate selection set. Overlapping tools → "agents can get confused about which ones to use."

## Tool Consolidation (PRIMARY recommendation)
Prefer composite tools over atomic ones:
- Single `schedule_event` > separate `list_users` + `list_events` + `create_event`
- `search_logs` > generic `read_logs`  
- `get_customer_context` (combines customer ID + transactions + notes) > 3 separate tools
- Each tool must have "a clear, distinct purpose"

## Tool Descriptions
- Write as if explaining to a new team member: make implicit context explicit
- "Even small refinements to tool descriptions can yield dramatic improvements"
- Tool descriptions are "loaded into your agents' context" — they actively steer behavior
- Avoid ambiguity in parameter names: prefer `user_id` over `user`

## Namespacing for Disambiguation
When tools overlap, namespace by service AND resource:
- `asana_search` vs `jira_search`
- `asana_projects_search` vs `asana_users_search`
- "Prefix- and suffix-based namespacing" produce "non-trivial effects" on performance
- Choose approach "according to your own evaluations"

## Output Design — Token Efficiency
- Return "only high signal information"; prioritize "contextual relevance over flexibility"
- Resolve "arbitrary alphanumeric UUIDs to more semantically meaningful language" to reduce hallucinations
- Include: `name`, `image_url`, `file_type` — NOT: `uuid`, `256px_image_url`, `mime_type`
- Support response format parameter: `"detailed"` vs `"concise"` (example showed 206 vs 72 tokens)
- Implement pagination, range selection, filtering, truncation
- Claude Code defaults to 25,000 token max response
- Encourage agents to "make many small and targeted searches" rather than broad requests

## Error Messages for Agents
- Avoid "opaque error codes or tracebacks"
- Provide "clear instructions" that are "specific and actionable"
- Steer agents toward token-efficient strategies through error messaging

## Input Schema Design
- Use unambiguously named parameters
- Avoid low-level technical identifiers
- Optional enums for `response_format` type parameters
- Strict data models for enforcement
