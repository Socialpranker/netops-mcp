---
id: S69
url: https://github.com/modelcontextprotocol/servers
title: MCP Reference Servers Repository — Packaging Patterns
channel: github-code
access: open
subquestion_ids: [ST4]
credibility: 5
recency: 5
bias: 1
date: 2025-06-01
---
# MCP Reference Servers — Паттерны упаковки

## Текущее состояние

Официальный репозиторий теперь содержит только малое число reference implementations (Everything, Fetch, Filesystem, Git, Memory, Sequential Thinking, Time). Остальные переехали в `servers-archived`.

Большинство community серверов → [MCP Registry](https://registry.modelcontextprotocol.io/)

## Стандартный паттерн упаковки для Node.js MCP серверов

1. **npm package** с `bin` полем в package.json
2. Запуск через `npx <package>` или `node <path>`
3. Транспорт: исключительно stdio (все reference серверы)
4. Конфигурация: env variables или CLI args

## Пример конфига для Filesystem сервера

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    }
  }
}
```

## Ни один reference сервер не использует HTTP транспорт

Все официальные reference серверы используют stdio. HTTP транспорт предназначен для cloud-hosted серверов (Notion, Sentry, Stripe, GitHub), которые не живут локально.

## npx vs глобальная установка vs Docker

| Метод | DX | Плюсы | Минусы |
|-------|-----|-------|--------|
| `npx -y` | Лучший для пользователя | Zero-install, always latest | Медленный cold start (~2-5с) |
| global npm install | Средний | Быстрый запуск | Нужен npm global, версии могут устаревать |
| Docker | Плохой для обычных | Изоляция | Docker required, медленно, mcp.json сложнее |

## Вывод для netops

`npx -y netops-mcp` — правильный подход. Docker в mcp.json это anti-pattern для локальных инструментов. Медленный cold start npx можно компенсировать явной установкой в документации.
