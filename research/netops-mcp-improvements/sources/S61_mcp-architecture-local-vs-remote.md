---
id: S61
url: https://modelcontextprotocol.io/docs/concepts/architecture
title: MCP Architecture Overview — Local vs Remote Server Design
channel: official-docs
access: open
subquestion_ids: [ST4]
credibility: 5
recency: 5
bias: 1
date: 2025-06-18
---
# MCP Architecture Overview — Local vs Remote

## Ключевой тезис из официальной документации

> "Local MCP servers that use the STDIO transport typically serve **a single MCP client**, whereas remote MCP servers that use the Streamable HTTP transport will typically serve **many MCP clients**."

Это фундаментальное разграничение: stdio = one-to-one, HTTP = one-to-many.

## Примеры из документации

- **Filesystem server** (Claude Desktop) — локальный, STDIO, запускается как subprocess
- **Sentry MCP server** — удалённый, Streamable HTTP, запускается на платформе Sentry

## Транспортный слой

**Stdio:**
- Прямая коммуникация между процессами на одной машине
- Оптимальная производительность — нет сетевого оверхеда
- Нет поддержки аутентификации (не нужна — процессная изоляция)

**Streamable HTTP:**
- Удалённая коммуникация
- Поддерживает bearer tokens, API keys, custom headers, OAuth
- Нужна аутентификация (обязательна)

## Вывод для netops

netops-mcp как диагностический инструмент с доступом к сети пользователя и WireGuard — канонический пример local-first stdio сервера. Одиночный клиент, прямой доступ к системе, нет смысла в HTTP если нет multi-client или remote требований.
