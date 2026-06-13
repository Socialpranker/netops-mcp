---
id: S05
url: https://www.anthropic.com/engineering/desktop-extensions
title: Claude Desktop Extensions (MCPB) — Anthropic Engineering Blog
channel: official-docs
access: open
subquestion_ids: [ST1]
credibility: 5
recency: 5
bias: 4
date: 2025-06
---

# Desktop Extensions (MCPB) — Официальный формат Anthropic

MCPB (.mcpb файлы) — zip-архив с MCP-сервером + manifest.json. Введён в июне 2025, ранее назывался DXT (.dxt), оба формата поддерживаются.

**Создание MCPB:**
1. `npx @anthropic-ai/mcpb init` — генерирует manifest интерактивно
2. Настроить `user_config` для API keys, directories
3. `npx @anthropic-ai/mcpb pack` — создаёт .mcpb
4. Drag & drop в Claude Desktop Settings для теста

**Установка для пользователя:** скачать .mcpb → двойной клик → Install. Всё. Без Node.js, npm команд, JSON конфигурации.

**КРИТИЧЕСКИ ВАЖНО:** "We recommend implementing MCP servers in Node.js rather than Python to reduce installation friction. Node.js ships with Claude for macOS and Windows." — Node.js включён в Claude Desktop, Python требует отдельной установки.

**Выгода:** потенциальный охват "thousands of MCP servers to millions of users with just one click"

**Куrated directory:** Claude Desktop имеет встроенный каталог MCPB серверов — отдельный discovery channel.

Для netops-mcp (TypeScript/Node): уже на правильном рантайме. MCPB-пакет — естественный следующий шаг после npm.
