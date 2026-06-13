---
id: S26
url: https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls
title: Anthropic Docs — Handle Tool Calls (Results, Errors, is_error)
channel: official-docs
access: open
subquestion_ids: [ST2]
credibility: 5
recency: 5
bias: 1
date: 2026-06
---
# Anthropic Docs — Handle Tool Calls

## Tool Result Format
Returns go in `tool_result` blocks with:
- `tool_use_id`: matches the originating tool_use block
- `content`: string, list of content blocks (text, image, document)
- `is_error` (optional): true if execution failed

## Error Handling Best Practices
- Set `is_error: true` for execution failures
- Write INSTRUCTIVE error messages: not "failed" but "Rate limit exceeded. Retry after 60 seconds."
- For missing params: "Error: Missing required 'location' parameter" → Claude retries 2-3 times
- If invalid tool call due to missing info during development: add more detail to descriptions

### Self-correction behavior
"If a tool request is invalid or missing parameters, Claude will retry 2-3 times with corrections before apologizing to the user."

## Security Warning on Tool Results
"Tool results often carry content from sources outside your control: web pages, inbound email, user uploads, third-party APIs. Treat that content as untrusted" — keep in tool_result blocks, not system prompts. Indirect prompt injection risk.

## Strict Tool Use
`strict: true` on tool definitions guarantees tool inputs always match schema exactly — prevents missing parameters and type mismatches. Eliminates invalid tool calls entirely.

## netops relevance
For netops tools: when a probe fails (timeout, ICMP blocked, etc.), return isError: true with actionable text like "TCP connect to 8.8.8.8:443 timed out after 5s. Try increasing timeout or check if host firewall blocks port 443." The current approach of text verdicts already does this — just ensure the is_error flag is set appropriately so the LLM knows it's an error not a result.
