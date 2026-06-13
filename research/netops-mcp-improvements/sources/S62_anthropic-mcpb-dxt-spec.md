---
id: S62
url: https://github.com/anthropics/dxt
title: Anthropic MCPB (formerly DXT) — Desktop Extension Bundle Spec
channel: official-docs
access: open
subquestion_ids: [ST4]
credibility: 5
recency: 5
bias: 2
date: 2025-12-02
---
# Anthropic MCPB — MCP Bundle Specification

## Переименование: DXT → MCPB

- Проект называется **MCPB (MCP Bundles)**, CLI переименован из `dxt` в `mcpb`
- Файлы `.dxt` → `.mcpb` (zip-архивы)
- npm пакет: `@anthropic-ai/mcpb` (был `@anthropic-ai/dxt`)

## Что такое MCPB

`.mcpb` = zip-архив с локальным MCP-сервером + `manifest.json`. Аналог Chrome extensions (.crx) или VS Code extensions (.vsix). Цель — **one-click install** для не-разработчиков.

## Структура bundle

```
bundle.mcpb (ZIP)
├── manifest.json     # Обязательно: метаданные, конфиг
├── server/           # Файлы сервера
│   └── index.js      # Entry point
├── node_modules/     # Зависимости встроены
└── icon.png          # Опционально
```

## manifest.json — ключевые поля

- `manifest_version`: "0.3" (текущая)
- `server.type`: "node" | "python" | "binary" | "uv"
- `server.entry_point`: путь к файлу сервера
- `server.mcp_config.command/args`: как запустить (stdio!)
- `user_config`: декларативные UI-поля для конфигурации (строки, директории, секреты)
- `${__dirname}` в args заменяется на директорию bundle
- `${user_config.api_key}` — подстановка пользовательских настроек

## Рекомендация Anthropic по runtime

**Node.js рекомендован** для MCPB: Node.js поставляется вместе с Claude for macOS/Windows, Python требует отдельной установки. Исключение: `server.type = "uv"` — тогда хост сам управляет Python и зависимостями.

## Что даёт MCPB

1. **One-click install**: открыть .mcpb в Claude Desktop — появляется диалог установки
2. **Авто-конфигурация**: `user_config` генерирует UI без ручного mcp.json
3. **Встроенные зависимости**: не нужен npm install
4. **Автообновления** через хост-приложение
5. **Кастрированный каталог**: Anthropic Directory поддерживает MCPB-серверы

## Важно: MCPB использует stdio

MCPB внутри всегда запускает через stdio (`mcp_config.command + args`). HTTP транспорт для MCPB не предусмотрен — это пакет для ЛОКАЛЬНЫХ серверов.

## Текущий статус поддержки

Claude for macOS и Claude for Windows поддерживают MCPB. Claude Code, Cursor, VS Code — не упоминаются как поддерживающие .mcpb файлы напрямую.
