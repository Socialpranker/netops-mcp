---
id: S64
url: https://code.visualstudio.com/docs/copilot/chat/mcp-servers
title: VS Code — MCP Server Configuration Reference
channel: official-docs
access: open
subquestion_ids: [ST4]
credibility: 5
recency: 5
bias: 1
date: 2025-11-01
---
# VS Code MCP Configuration

## Формат конфига

`.vscode/mcp.json` (workspace) или User profile:

```json
{
  "servers": {
    "server-name": {
      "type": "stdio|http|sse",
      "command": "...",
      "args": [...]
    }
  }
}
```

Заметьте: VS Code использует ключ `servers`, а не `mcpServers` как Claude Desktop/Claude Code. Это один из болезненных аспектов — форматы не идентичны между клиентами.

## Поддерживаемые транспорты

- **stdio** — локальный subprocess
- **http** — remote HTTP (Streamable HTTP)
- **sse** — legacy SSE

## One-click install

VS Code поддерживает установку из Extensions view через фильтр `@mcp`. Возможна установка "Install in Workspace" (локальная) или "Install" (user profile).

## Автообнаружение

VS Code автоматически обнаруживает конфиги других клиентов через `chat.mcp.discovery.enabled` — включая Claude Desktop.

## Различие форматов

| Клиент | Ключ | Файл |
|--------|------|------|
| Claude Desktop | `mcpServers` | `claude_desktop_config.json` |
| Claude Code (project) | `mcpServers` | `.mcp.json` |
| VS Code | `servers` | `.vscode/mcp.json` |
| Cursor | `mcpServers` | `.cursor/mcp.json` |

Это фрагментация, которую разработчик должен учитывать при документировании netops-mcp.

## Вывод для netops

При написании README для netops-mcp нужно давать примеры конфигов для каждого клиента отдельно — форматы файлов различаются.
