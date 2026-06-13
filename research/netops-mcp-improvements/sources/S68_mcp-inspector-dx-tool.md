---
id: S68
url: https://modelcontextprotocol.io/docs/tools/inspector
title: MCP Inspector — Developer Tool for Testing & Debugging MCP Servers
channel: official-docs
access: open
subquestion_ids: [ST4]
credibility: 5
recency: 5
bias: 1
date: 2025-06-01
---
# MCP Inspector — официальный DX инструмент

## Что это

Интерактивный браузерный инструмент для тестирования и отладки MCP серверов без запуска через реальный клиент.

## Запуск через npx (без установки)

```bash
# npm пакет
npx -y @modelcontextprotocol/inspector npx <package-name> <args>

# Локальный сервер (TypeScript)
npx @modelcontextprotocol/inspector node path/to/server/index.js
```

## Возможности

- **Server connection pane**: выбор транспорта, аргументы, env переменные
- **Tools tab**: список инструментов, тестирование с кастомными inputs, просмотр результатов
- **Resources tab**: просмотр ресурсов
- **Prompts tab**: тестирование prompt templates
- **Notifications pane**: логи и нотификации от сервера

## Вывод для netops DX

- Инструмент доступен через `npx @modelcontextprotocol/inspector npx netops-mcp` — это должно быть в README
- Даёт разработчикам возможность тестировать все tools без Claude Desktop
- Поддерживает выбор транспорта — можно тестировать и stdio и (в будущем) HTTP версию
- Логи через stderr будут видны в Notifications pane
