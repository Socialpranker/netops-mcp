---
id: S63
url: https://code.claude.com/docs/en/mcp
title: Claude Code — MCP Configuration Reference (Official)
channel: official-docs
access: open
subquestion_ids: [ST4]
credibility: 5
recency: 5
bias: 1
date: 2026-06-13
---
# Claude Code MCP Configuration Reference

## Поддерживаемые транспорты

Claude Code поддерживает 4 транспорта:

1. **HTTP** (рекомендован для remote) — `--transport http`, в mcp.json `type: "http"` или `"streamable-http"` (алиас)
2. **SSE** (deprecated, но поддерживается) — `--transport sse`
3. **stdio** (рекомендован для local) — `--transport stdio` (дефолт для локальных)
4. **WebSocket** — `type: "ws"`, только через `claude mcp add-json`

## CLI команды

```bash
# HTTP remote server
claude mcp add --transport http notion https://mcp.notion.com/mcp

# stdio local server
claude mcp add --env AIRTABLE_API_KEY=YOUR_KEY --transport stdio airtable \
  -- npx -y airtable-mcp-server

# SSE (deprecated)
claude mcp add --transport sse asana https://mcp.asana.com/sse
```

## Скоупы конфигурации

| Scope | Хранится в | Шарится с командой |
|-------|-----------|-------------------|
| local (дефолт) | `~/.claude.json` | Нет |
| project | `.mcp.json` в корне проекта | Да, через git |
| user | `~/.claude.json` | Нет |

## Формат .mcp.json (project scope)

```json
{
  "mcpServers": {
    "netops-mcp": {
      "command": "npx",
      "args": ["-y", "netops-mcp"],
      "env": {}
    }
  }
}
```

## Хорошие DX-фичи в Claude Code

- `CLAUDE_PROJECT_DIR` автоматически передаётся в env сервера
- Авто-переподключение HTTP/SSE с экспоненциальным бэкоффом (5 попыток)
- OAuth через `/mcp` для remote серверов
- Плагины могут бандлить MCP-серверы без ручной конфигурации
- Dynamic tool updates через `list_changed` notifications
- `MCP_TIMEOUT` env для таймаута запуска

## Различие от Claude Desktop

Claude Desktop использует `~/Library/Application Support/Claude/claude_desktop_config.json` с похожей структурой, но без `--transport` флага в CLI (конфигурируется вручную).

## Вывод для netops

Для Claude Code: `claude mcp add --transport stdio netops-mcp -- npx -y netops-mcp`. Один клик через плагин Claude Code возможен — если выпустить как Claude Code plugin с встроенным MCP config.
