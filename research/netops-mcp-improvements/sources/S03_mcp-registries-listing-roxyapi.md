---
id: S03
url: https://roxyapi.com/blogs/mcp-registries-where-to-list-your-server-2026
title: MCP Registries in 2026: Where to List Your Server for AI Tool Discovery
channel: industry-media
access: open
subquestion_ids: [ST1]
credibility: 4
recency: 5
bias: 3
date: 2026
---

# Where to List Your MCP Server (2026)

Конкретные шаги листинга в 4 ключевых реестрах:

**mcp.so** — форм-based submission: server name, one-sentence description, tool count, transport type, GitHub URL, homepage, optional icon. 20222+ серверов.

**smithery.ai** — Publisher account + manifest submission: server name/description/tools/auth method, working server URL or npm package. CLI: `smithery mcp publish <url> -n <org/server>`. Handles OAuth автоматически. Оба варианта: локальный и hosted.

**glama.ai/mcp** — Manual review через submission form: name, description, repo URL, installation snippet, transport type, tool count. Favors production-quality с clear documentation.

**punkpeye/awesome-mcp-servers** (89k звёзд!) — Pull request против README.md, alphabetical placement в нужной категории. Включить "🤖🤖🤖" в PR title для fast-tracked automated agent submissions.

Universally required: name, description, capabilities/tool list, transport type, auth method, example Claude Desktop/Cursor config, homepage and repo URLs, license, maintainer contact.

Pre-submission валидация JSON RPC 2.0 probe: `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"registry-probe","version":"1.0.0"}}}` — должен вернуть server name + capabilities.

Для netops-mcp: сабмитить во все 4, каждый охватывает разную аудиторию.
