---
id: S20
url: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
title: MCP Specification — Tools (2025-11-25)
channel: official-docs
access: open
subquestion_ids: [ST2]
credibility: 5
recency: 5
bias: 1
date: 2025-11-25
---
# MCP Specification — Tools

## Tool Structure
Each tool has: `name`, `title` (optional display), `description`, `inputSchema` (JSON Schema), `outputSchema` (optional), `annotations` (optional), `execution` (optional).

## Tool Names (spec 2025-11-25)
- SHOULD be 1–128 chars (64 per SEP-986)
- Allowed chars: A-Z, a-z, 0-9, `_`, `-`, `.`
- SHOULD be case-sensitive and unique within server
- Valid: `getUser`, `DATA_EXPORT_v2`, `admin.tools.list`

## Tool Annotations (4 boolean hints)
- **readOnlyHint** (default: false): Tool does NOT modify environment. When true, clients may skip confirmation prompts for read-only ops.
- **destructiveHint** (default: true): Modifications are destructive vs additive. When true → triggers confirmation before execution. When false → additive ops (create/add without removing).
- **idempotentHint** (default: false): Repeated calls with identical args are safe. Enables automatic retry logic.
- **openWorldHint** (default: true): Tool reaches beyond local/internal boundaries (external untrusted sources). When false → operates within closed, controlled domain.

**Important**: All annotations are HINTS, not contracts. Defaults assume worst-case risk (non-read-only, potentially destructive, non-idempotent, open-world).

## Error Handling (spec)
Two mechanisms:
1. **Protocol Errors** (JSON-RPC errors): unknown tool, malformed request, server errors. Less likely to be recoverable by LLM.
2. **Tool Execution Errors** (isError: true in result): API failures, input validation errors, business logic errors. Clients SHOULD provide these to LLMs for self-correction.

Example actionable error text: `"Invalid departure date: must be in the future. Current date is 08/08/2025."`

## Structured + Unstructured Output
- Tools MAY return both `content` (text/image/audio) AND `structuredContent` (JSON object)
- For backwards compat: if returning structuredContent, SHOULD also include serialized JSON in TextContent block
- outputSchema enables strict validation of structured results

## inputSchema Requirements
- MUST be valid JSON Schema object (not null)
- For no-params tools, use: `{"type": "object", "additionalProperties": false}`
