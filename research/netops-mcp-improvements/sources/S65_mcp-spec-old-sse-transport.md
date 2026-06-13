---
id: S65
url: https://modelcontextprotocol.io/specification/2024-11-05/basic/transports
title: MCP Specification 2024-11-05 — HTTP+SSE Transport (deprecated)
channel: official-docs
access: open
subquestion_ids: [ST4]
credibility: 5
recency: 3
bias: 1
date: 2024-11-05
---
# MCP Old HTTP+SSE Transport (deprecated)

## Как работал (2024-11-05)

Два endpoint'а:
1. **SSE endpoint (GET)** — клиент открывает долгую SSE-коннекцию, получает сообщения от сервера
2. **POST endpoint** — клиент отправляет сообщения серверу

Последовательность:
1. Клиент открывает SSE GET к серверу
2. Сервер присылает `endpoint` event с URL для POST
3. Далее все сообщения клиента — POST на этот URL
4. Сообщения сервера — SSE events

## Почему deprecated

1. Два разных endpoint'а — сложнее реализовывать и настраивать
2. Нет session management (не было Mcp-Session-Id)
3. Нет resumability
4. Отдельный GET-поток для server→client и POST-путь для client→server — неинтуитивно
5. Streamable HTTP унифицирует в один endpoint с более гибкой семантикой

## Текущий статус

Полностью deprecated с версии 2025-03-26. Claude Code явно помечает SSE как deprecated в документации. Тем не менее — Claude Code всё ещё поддерживает SSE для обратной совместимости.

## Роадмап в netops

Если netops планировал "HTTP/SSE transport" по роадмапу, нужно сразу реализовывать **Streamable HTTP**, а не старый HTTP+SSE. Иначе реализация устареет ещё до релиза.
