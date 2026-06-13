---
id: S21
url: https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
title: Anthropic Docs — Define Tools (Best Practices for Tool Definitions)
channel: official-docs
access: open
subquestion_ids: [ST2]
credibility: 5
recency: 5
bias: 1
date: 2026-06
---
# Anthropic Docs — Define Tools

## Model Choice for Tool Use
- Use **Claude Opus** for complex tools and ambiguous queries — handles multiple tools better, seeks clarification when params missing
- Use **Haiku** for straightforward tools only — may infer missing parameters rather than asking

## Tool Definition Parameters
- `name`: regex `^[a-zA-Z0-9_-]{1,64}$`
- `description`: detailed plaintext — what it does, when to use it, how it behaves
- `input_schema`: JSON Schema defining expected parameters
- `input_examples`: (optional) array of valid input objects for complex tools

## Best Practices for Tool Definitions (Anthropic Official)

### 1. Provide extremely detailed descriptions (MOST IMPORTANT)
"This is by far the most important factor in tool performance."
Description MUST include:
- What the tool does
- When it SHOULD be used (and when it SHOULD NOT)
- What each parameter means and how it affects behavior
- Important caveats or limitations
- "Aim for at least 3-4 sentences per tool description, more if complex"

Good example (get_stock_price):
> "Retrieves the current stock price for a given ticker symbol. The ticker symbol must be a valid symbol for a publicly traded company on a major US stock exchange like NYSE or NASDAQ. The tool will return the latest trade price in USD. It should be used when the user asks about the current or most recent price of a specific stock. It will not provide any other information about the stock or company."

Bad example: "Gets the stock price for a ticker."

### 2. Consolidate related operations into fewer tools
"Rather than creating a separate tool for every action (create_pr, review_pr, merge_pr), group them into a single tool with an action parameter. Fewer, more capable tools reduce selection ambiguity and make your tool surface easier for Claude to navigate."

### 3. Use meaningful namespacing in tool names
"When your tools span multiple services or resources, prefix names with the service (e.g., github_list_prs, slack_send_message). This makes tool selection unambiguous as your library grows."

### 4. Design tool responses to return only high-signal information
"Return semantic, stable identifiers (slugs or UUIDs) rather than opaque internal references, and include only the fields Claude needs to reason about its next step. Bloated responses waste context and make it harder for Claude to extract what matters."

### 5. Use input_examples for complex tools
Particularly useful for complex tools with nested objects, optional parameters, or format-sensitive inputs. Each example must conform to the inputSchema. Token cost: ~20-50 tokens for simple, ~100-200 for complex nested examples.

## Token costs of tool definitions
Tools in the `tools` parameter consume input tokens. Claude Sonnet 4.6 with auto/none: 497 tokens base system prompt for tool use. More tools = more tokens consumed by their definitions sitting in context.

## Forcing tool use
`tool_choice: {"type": "tool", "name": "specific_tool"}` forces a specific tool. `strict: true` guarantees schema conformance.

## Error Handling
If invalid tool call (missing params): Claude retries 2-3 times with corrections before apologizing. Write instructive error messages: instead of "failed", say "Rate limit exceeded. Retry after 60 seconds."
