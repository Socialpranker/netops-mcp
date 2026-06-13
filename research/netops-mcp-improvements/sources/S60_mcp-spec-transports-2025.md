---
id: S60
url: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports
title: MCP Specification 2025 — Transports (stdio + Streamable HTTP)
channel: official-docs
access: open
subquestion_ids: [ST4]
credibility: 5
recency: 5
bias: 1
date: 2025-03-26
---
# MCP Specification 2025 — Transports

## Два официальных транспорта

С 2025-03-26 MCP определяет ТОЛЬКО ДВА стандартных транспорта:

1. **stdio** — локальный процесс, stdin/stdout
2. **Streamable HTTP** — HTTP POST + опциональный SSE (заменил устаревший HTTP+SSE из 2024-11-05)

Клиенты ДОЛЖНЫ поддерживать stdio при каждой возможности (`Clients SHOULD support stdio whenever possible`).

## Streamable HTTP (новый стандарт 2025)

- Сервер работает как независимый процесс, может обслуживать **несколько клиентов одновременно**
- Один endpoint (URL вида `https://example.com/mcp`) поддерживает и POST и GET
- POST — запросы клиента к серверу
- GET — опциональный SSE-поток от сервера к клиенту без предварительного POST
- Ответ может быть `application/json` (одиночный) или `text/event-stream` (стриминг)
- Поддержка session management через `Mcp-Session-Id` header
- Resumability через `id` поля SSE событий и `Last-Event-ID` header
- Обязателен `MCP-Protocol-Version` header в каждом запросе

## Безопасность HTTP транспорта (CRITICAL для netops)

- Серверы ОБЯЗАНЫ валидировать `Origin` header для защиты от DNS rebinding атак
- При локальном запуске ДОЛЖНЫ биндить только `127.0.0.1`, не `0.0.0.0`
- Серверы ДОЛЖНЫ реализовывать аутентификацию

## Устаревший HTTP+SSE (2024-11-05, deprecated)

- Требовал ДВА endpoint: SSE-эндпоинт (GET) и POST-эндпоинт
- Клиент сначала открывал SSE, получал `endpoint` event с URL для POST
- Deprecated полностью в пользу Streamable HTTP

## Совместимость назад

- Серверы, желающие поддержать старых клиентов, должны держать ОБА endpoint'а
- Клиенты, желающие поддержать старые серверы: сначала POST InitializeRequest, если 4xx — пробуют SSE GET

## Вывод для netops (local-first tool)

stdio — идеальный вариант для локального инструмента: никакого сетевого оверхеда, никаких рисков rebinding. HTTP нужен только если netops должен быть доступен с нескольких клиентов одновременно или с удалённой машины.
